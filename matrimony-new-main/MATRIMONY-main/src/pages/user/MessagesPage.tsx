import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp, extractNameFromEmail } from '../../context/AppContext';
import { useChatStore } from '../../store/useChatStore';
import { ConversationList, type ConversationItem } from '../../components/chat/ConversationList';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { MessageList } from '../../components/chat/MessageList';
import { MessageInputBar } from '../../components/chat/MessageInputBar';
import { CallModal } from '../../components/chat/CallModal';
import { X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useConversations,
  useRoomMessages,
  useSendTextMessage,
  useSendVoiceMessage,
  useSendImageMessage,
  useSendVideoMessage,
  useSendDocumentMessage,
  useMarkConversationSeen,
  useChatHeartbeat,
  useGetUserOnlineStatus
} from '../../hooks/useChat';

const formatMessageTimestamp = (rawTs?: string | number): string => {
  if (!rawTs) {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  const num = Number(rawTs);
  let d: Date = !isNaN(num) && num > 1000000000 ? new Date(num) : new Date(rawTs);
  if (isNaN(d.getTime())) {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatSidebarTimestamp = (rawTs?: string | number): string => {
  if (!rawTs) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const num = Number(rawTs);
  let d: Date = !isNaN(num) && num > 1000000000 ? new Date(num) : new Date(rawTs);
  if (isNaN(d.getTime())) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const MessagesPage: React.FC = () => {
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const activeChatUserId = useChatStore((state) => state.activeChatUserId);
  const setActiveChatUserId = useChatStore((state) => state.setActiveChatUserId);

  const isCallModalOpen = useChatStore((state) => state.isCallModalOpen);
  const activeCallType = useChatStore((state) => state.activeCallType);
  const activeCallTarget = useChatStore((state) => state.activeCallTarget);
  const startCall = useChatStore((state) => state.startCall);
  const endCall = useChatStore((state) => state.endCall);

  const [searchQuery, setSearchQuery] = useState('');
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  useChatHeartbeat(true);

  // Sync route param with store state
  useEffect(() => {
    if (routeUserId) {
      setActiveChatUserId(routeUserId);
    }
  }, [routeUserId, setActiveChatUserId]);

  const activeUserId = routeUserId || activeChatUserId || 'MAT-1001';

  // React Query hooks for chat messages and conversations
  const { data: conversationsData } = useConversations();
  const { data: messagesData, isLoading: isMessagesLoading } = useRoomMessages(activeUserId);
  const { data: isOnlineData } = useGetUserOnlineStatus(activeUserId);

  const sendTextMutation = useSendTextMessage();
  const sendVoiceMutation = useSendVoiceMessage();
  const sendImageMutation = useSendImageMessage();
  const sendVideoMutation = useSendVideoMessage();
  const sendDocumentMutation = useSendDocumentMessage();
  const markSeenMutation = useMarkConversationSeen();

  // Mark conversation seen on active switch
  useEffect(() => {
    if (activeUserId) {
      markSeenMutation.mutate(activeUserId);
    }
  }, [activeUserId]);

  const conversations: ConversationItem[] = (conversationsData || []).map((c: any) => ({
    user_id: String(c.user_id || c.id),
    user_name: c.user_name || c.name || extractNameFromEmail(c.user_id),
    profile_photo: c.profile_photo || c.avatar,
    last_message: c.last_message || c.message || '',
    unread_count: c.unread_count || 0,
    is_online: c.is_online || false,
    updated_at: c.updated_at || c.timestamp,
    verified: c.verified || c.is_verified || false
  }));

  const activeContact = conversations.find((c) => c.user_id === activeUserId) || {
    user_id: activeUserId,
    user_name: extractNameFromEmail(activeUserId),
    profile_photo: '',
    is_online: isOnlineData?.is_online || false,
    verified: true
  };

  const handleSelectUser = (id: string) => {
    setActiveChatUserId(id);
    navigate(`/messages/${id}`);
  };

  const handleSendText = (text: string) => {
    sendTextMutation.mutate({ recipientId: activeUserId, content: text });
  };

  const handleSendVoice = (blob: Blob) => {
    sendVoiceMutation.mutate({ recipientId: activeUserId, audioBlob: blob });
  };

  const handleSendImage = (file: File) => {
    sendImageMutation.mutate({ recipientId: activeUserId, file });
  };

  const handleSendVideo = (file: File) => {
    sendVideoMutation.mutate({ recipientId: activeUserId, file });
  };

  const handleSendDocument = (file: File) => {
    sendDocumentMutation.mutate({ recipientId: activeUserId, file });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden my-4 border border-rose-100">
      {/* 1. Conversations List Sidebar */}
      <ConversationList
        conversations={conversations}
        activeUserId={activeUserId}
        onSelectUser={handleSelectUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        formatTimestamp={formatSidebarTimestamp}
      />

      {/* 2. Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-rose-50/10 min-w-0">
        <ChatHeader
          name={activeContact.user_name || extractNameFromEmail(activeUserId)}
          avatar={activeContact.profile_photo}
          isOnline={activeContact.is_online}
          verified={activeContact.verified}
          onStartAudioCall={() =>
            startCall(
              {
                id: activeUserId,
                name: activeContact.user_name || extractNameFromEmail(activeUserId),
                avatar: activeContact.profile_photo
              },
              'audio'
            )
          }
          onStartVideoCall={() =>
            startCall(
              {
                id: activeUserId,
                name: activeContact.user_name || extractNameFromEmail(activeUserId),
                avatar: activeContact.profile_photo
              },
              'video'
            )
          }
          onToggleInfoPanel={() => setShowInfoPanel(!showInfoPanel)}
        />

        <MessageList
          messages={messagesData || []}
          currentUserId={currentUser.id}
          isLoading={isMessagesLoading}
          formatTimestamp={formatMessageTimestamp}
          onOpenMediaModal={(url, type) => setPreviewMedia({ url, type })}
        />

        <MessageInputBar
          onSendMessage={handleSendText}
          onSendVoice={handleSendVoice}
          onSendImage={handleSendImage}
          onSendVideo={handleSendVideo}
          onSendDocument={handleSendDocument}
          isSending={
            sendTextMutation.isPending ||
            sendVoiceMutation.isPending ||
            sendImageMutation.isPending ||
            sendVideoMutation.isPending ||
            sendDocumentMutation.isPending
          }
        />
      </div>

      {/* 3. Media Preview Modal */}
      <AnimatePresence>
        {previewMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewMedia(null)}
          >
            <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
              <button
                onClick={() => setPreviewMedia(null)}
                className="absolute top-4 right-4 text-white hover:text-rose-400 p-2 bg-black/50 rounded-full z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {previewMedia.type === 'image' ? (
                <img
                  src={previewMedia.url}
                  alt="Full preview"
                  className="max-h-[85vh] max-w-full object-contain rounded-xl"
                />
              ) : (
                <video
                  src={previewMedia.url}
                  controls
                  autoPlay
                  className="max-h-[85vh] max-w-full object-contain rounded-xl"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Active Audio / Video Call Modal */}
      {isCallModalOpen && activeCallTarget && (
        <CallModal
          isOpen={isCallModalOpen}
          callType={activeCallType || 'audio'}
          contactName={activeCallTarget.name}
          contactAvatar={activeCallTarget.avatar}
          onEndCall={endCall}
        />
      )}
    </div>
  );
};

export default MessagesPage;
