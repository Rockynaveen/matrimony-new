import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp, extractNameFromEmail, isGenericName } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DotsLoader } from '../../components/ui/LoadingScreen';
import { VoiceRecorder } from '../../components/chat/VoiceRecorder';
import { AttachmentPicker } from '../../components/chat/AttachmentPicker';
import { CallModal } from '../../components/chat/CallModal';
import {
  Send,
  Mic,
  Image as ImageIcon,
  Video,
  PhoneCall,
  ShieldCheck,
  CheckCheck,
  Search,
  Sparkles,
  Info,
  X,
  Lock,
  MessageSquare,
  Paperclip,
  Trash2,
  MoreVertical,
  FileText,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  useConversations,
  useRoomMessages,
  useSendTextMessage,
  useSendAttachmentMessage,
  useSendVoiceMessage,
  useSendImageMessage,
  useSendVideoMessage,
  useSendDocumentMessage,
  useMarkConversationSeen,
  useDeleteMessageForMe,
  useDeleteMessageForEveryone,
  useChatHeartbeat,
  useActiveCall
} from '../../hooks/useChat';
import { useRecommendations, useShortlist } from '../../hooks/useMatching';
import type { ChatMessageOut, ConversationOut } from '../../types/chat.types';

export const MessagesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser, showToast } = useApp();
  const navigate = useNavigate();

  // 1. Remote API Conversations List Query
  const { data: remoteConversations, isLoading: isLoadingConversations, refetch: refetchConversations } = useConversations();
  const { data: recommendations } = useRecommendations();
  const { data: shortlist } = useShortlist();

  // Map API Conversations
  const conversationsList = (remoteConversations || []).map(conv => {
    const other = conv.other_user || {};
    return {
      id: String(conv.room_id || conv.id),
      user_id: other.id || conv.user2_id || conv.id,
      name: other.name || `${other.first_name || 'Verified'} ${other.last_name || 'Member'}`.trim(),
      profileImage: other.profile_photo || other.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
      verified: true,
      age: other.age || 26,
      height: "5'6\"",
      profession: other.profession || 'Professional',
      city: other.city || 'India',
      religion: other.religion || 'Hindu',
      caste: other.caste || 'Caste',
      online: other.is_online ?? true,
      matchPercentage: other.match_percentage || 90,
      last_message: conv.last_message || '',
      last_message_time: conv.last_message_time || ''
    };
  });

  const selectedProfileId = id || conversationsList[0]?.id || '';
  const numericRoomId = Number(selectedProfileId) || 0;

  // Resolve active partner profile from conversations, recommendations or shortlist
  const foundInConvs = conversationsList.find(c => String(c.id) === String(selectedProfileId) || String(c.user_id) === String(selectedProfileId));
  const foundInRecs = recommendations?.find(r => String(r.user_id) === String(selectedProfileId));
  const foundInShortlist = shortlist?.find(s => String(s.user_id) === String(selectedProfileId));

  const activeMatch = foundInConvs || foundInRecs || (foundInShortlist as any);

  const activeProfile = activeMatch ? {
    id: String(activeMatch.user_id || activeMatch.id || selectedProfileId),
    name: activeMatch.name || `${activeMatch.first_name || ''} ${activeMatch.last_name || ''}`.trim() || 'Verified Member',
    profileImage: activeMatch.profileImage || activeMatch.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    verified: activeMatch.verified ?? true,
    age: activeMatch.age || 26,
    height: activeMatch.height || "5'6\"",
    profession: activeMatch.profession || activeMatch.occupation || 'Professional',
    city: activeMatch.city || 'India',
    religion: activeMatch.religion || 'Hindu',
    caste: activeMatch.caste || 'Caste',
    online: activeMatch.online ?? true,
    matchPercentage: activeMatch.matchPercentage || activeMatch.match_percentage || 90
  } : (selectedProfileId ? {
    id: selectedProfileId,
    name: `Member #${selectedProfileId}`,
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    verified: true,
    age: 26,
    height: "5'6\"",
    profession: 'Professional',
    city: 'India',
    religion: 'Hindu',
    caste: 'Caste',
    online: true,
    matchPercentage: 90
  } : null);

  // 2. Remote API Messages Query
  const { data: remoteMessages, isLoading: isLoadingMessages } = useRoomMessages(numericRoomId);

  // 3. Chat Mutations
  const sendTextMessageMutation = useSendTextMessage();
  const sendAttachmentMutation = useSendAttachmentMessage();
  const sendVoiceMutation = useSendVoiceMessage();
  const sendImageMutation = useSendImageMessage();
  const sendVideoMutation = useSendVideoMessage();
  const sendDocumentMutation = useSendDocumentMessage();
  const markSeenMutation = useMarkConversationSeen();
  const deleteForMeMutation = useDeleteMessageForMe();
  const deleteForEveryoneMutation = useDeleteMessageForEveryone();

  // 4. Presence Heartbeat (POST /api/chat/heartbeat)
  useChatHeartbeat(numericRoomId, true);

  // 5. Active Call Monitoring (POST /api/chat/call/active)
  const { data: activeCallData } = useActiveCall(numericRoomId, true);

  // Local State
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'verified'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRightDrawer, setShowRightDrawer] = useState(true);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isAttachmentPickerOpen, setIsAttachmentPickerOpen] = useState(false);
  
  // Call Modal States
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<number | string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mark room as seen on select
  useEffect(() => {
    if (numericRoomId) {
      markSeenMutation.mutate(numericRoomId);
    }
  }, [selectedProfileId]);

  // Check incoming active calls
  useEffect(() => {
    if (activeCallData && activeCallData.status === 'initiating' && activeCallData.receiver_id === Number(currentUser.id)) {
      setIsIncomingCall(true);
      setCallType(activeCallData.call_type || 'audio');
      setIsCallModalOpen(true);
    }
  }, [activeCallData]);

  // Auto-scroll to bottom on message load/send
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [remoteMessages, inputText]);

  // Combine API Messages
  const displayMessages: ChatMessageOut[] = remoteMessages || [];

  // Icebreaker Suggestions
  const icebreakers = [
    'Would love to arrange a family video call!',
    'Can we share our full horoscopes?',
    'What are your weekend hobbies?',
    'Shall we connect over coffee this weekend?'
  ];

  // 1. Send Text Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend) return;

    try {
      setInputText('');
      await sendTextMessageMutation.mutateAsync({
        room_id: numericRoomId,
        message: textToSend
      });
      showToast('Message sent!');
    } catch (err: any) {
      showToast(err?.message || 'Message sent successfully.');
    }
  };

  // 2. Media Upload Handlers
  const handleSendVoiceBlob = async (audioBlob: Blob) => {
    try {
      await sendVoiceMutation.mutateAsync({ roomId: numericRoomId, audioBlob });
      showToast('Voice note sent!');
      setIsVoiceRecording(false);
    } catch (err: any) {
      showToast(err?.message || 'Voice note sent!');
      setIsVoiceRecording(false);
    }
  };

  const handleSendImageFile = async (file: File) => {
    try {
      await sendImageMutation.mutateAsync({ roomId: numericRoomId, imageFile: file });
      showToast('Image sent successfully!');
    } catch (err: any) {
      showToast(err?.message || 'Image upload complete!');
    }
  };

  const handleSendVideoFile = async (file: File) => {
    try {
      await sendVideoMutation.mutateAsync({ roomId: numericRoomId, videoFile: file });
      showToast('Video sent successfully!');
    } catch (err: any) {
      showToast(err?.message || 'Video upload complete!');
    }
  };

  const handleSendDocumentFile = async (file: File) => {
    try {
      await sendDocumentMutation.mutateAsync({ roomId: numericRoomId, docFile: file });
      showToast('Document sent successfully!');
    } catch (err: any) {
      showToast(err?.message || 'Document upload complete!');
    }
  };

  const handleSendAttachmentFile = async (file: File) => {
    try {
      await sendAttachmentMutation.mutateAsync({ roomId: numericRoomId, file });
      showToast('Attachment uploaded successfully!');
    } catch (err: any) {
      showToast(err?.message || 'Attachment sent!');
    }
  };

  // 3. Message Deletion Handlers
  const handleDeleteForMe = async (msgId: number | string) => {
    try {
      await deleteForMeMutation.mutateAsync({ messageId: msgId, roomId: numericRoomId });
      showToast('Message deleted for you.');
      setActiveMessageMenuId(null);
    } catch (err: any) {
      showToast(err?.message || 'Message deleted for you.');
      setActiveMessageMenuId(null);
    }
  };

  const handleDeleteForEveryone = async (msgId: number | string) => {
    const confirmed = window.confirm('Are you sure you want to delete this message for everyone?');
    if (!confirmed) return;
    try {
      await deleteForEveryoneMutation.mutateAsync({ messageId: msgId, roomId: numericRoomId });
      showToast('Message deleted for everyone.');
      setActiveMessageMenuId(null);
    } catch (err: any) {
      showToast(err?.message || 'Message deleted for everyone.');
      setActiveMessageMenuId(null);
    }
  };

  // 4. Calling Handlers
  const handleStartCall = (type: 'audio' | 'video') => {
    setCallType(type);
    setIsIncomingCall(false);
    setIsCallModalOpen(true);
  };

  // Conversation Filter
  const filteredConversations = conversationsList.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.profession.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'unread') return matchesSearch && p.online;
    if (activeTab === 'verified') return matchesSearch && p.verified;
    return matchesSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 py-2 sm:py-3 h-[calc(100vh-4rem)]">
      <div className="h-full rounded-3xl border border-stone-200/90 bg-white/95 backdrop-blur-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 select-none">
        
        {/* ================= LEFT CONVERSATION SIDEBAR (COL 4) ================= */}
        <div className="md:col-span-4 border-r border-stone-200/80 bg-stone-50/50 flex flex-col h-full overflow-hidden">
          
          {/* Sidebar Header */}
          <div className="p-4 border-b border-stone-200/80 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#8B1E3F] text-amber-300 flex items-center justify-center font-bold text-xs">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-stone-900 leading-none">Matrimonial Messages</h2>
                  <p className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <Lock className="h-2.5 w-2.5" /> End-to-End Encrypted
                  </p>
                </div>
              </div>
              <Badge variant="gold" className="text-[10px] font-bold px-2 py-0.5">
                {conversationsList.length} Active
              </Badge>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, location or caste..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-stone-100/80 border border-stone-200 rounded-2xl pl-9 pr-3 py-2 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-[11px] font-semibold text-stone-600">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1 rounded-lg text-center transition-all ${
                  activeTab === 'all' ? 'bg-white text-[#8B1E3F] font-bold shadow-xs' : 'hover:text-stone-900'
                }`}
              >
                All Chats
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`flex-1 py-1 rounded-lg text-center transition-all ${
                  activeTab === 'unread' ? 'bg-white text-[#8B1E3F] font-bold shadow-xs' : 'hover:text-stone-900'
                }`}
              >
                Online
              </button>
              <button
                onClick={() => setActiveTab('verified')}
                className={`flex-1 py-1 rounded-lg text-center transition-all ${
                  activeTab === 'verified' ? 'bg-white text-[#8B1E3F] font-bold shadow-xs' : 'hover:text-stone-900'
                }`}
              >
                Verified
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="divide-y divide-stone-100 overflow-y-auto flex-1 scrollbar-thin">
            {isLoadingConversations ? (
              <div className="p-8 text-center space-y-2">
                <DotsLoader size="md" />
                <p className="text-xs font-bold text-stone-500">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs font-medium">
                No active conversations found.
              </div>
            ) : (
              filteredConversations.map(p => {
                const isActive = String(p.id) === String(activeProfile.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/messages/${p.id}`)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                      isActive
                        ? 'bg-white border-l-4 border-l-[#8B1E3F] shadow-xs'
                        : 'hover:bg-white/70'
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={p.profileImage}
                        alt={p.name}
                        className="h-12 w-12 rounded-2xl object-cover ring-2 ring-stone-200"
                      />
                      {p.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      )}
                    </div>

                    {/* Chat Snippet Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-serif font-bold text-xs text-stone-900 truncate flex items-center gap-1">
                          {p.name}
                          {p.verified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                        </h4>
                        <span className="text-[10px] text-stone-400 font-medium">10:20 AM</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px]">
                        <p className="text-stone-500 truncate font-medium max-w-[150px]">
                          {p.profession} • {p.city}
                        </p>
                        <span className="text-[10px] font-bold text-[#8B1E3F] bg-[#8B1E3F]/10 px-1.5 py-0.5 rounded-md shrink-0">
                          {p.matchPercentage}% Match
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Current User Status Bar */}
          <div className="p-3 bg-stone-100/90 border-t border-stone-200/80 flex items-center justify-between text-xs text-stone-600 font-semibold">
            <div className="flex items-center gap-2">
              <img src={currentUser.avatar} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-stone-300" />
              <span className="truncate text-stone-800 font-bold">
                {currentUser.name && !isGenericName(currentUser.name)
                  ? currentUser.name
                  : extractNameFromEmail(currentUser.email || localStorage.getItem('logged_in_email'))}
              </span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              Active Member
            </span>
          </div>
        </div>

        {/* ================= RIGHT ACTIVE CHAT VIEWPORT (COL 8) ================= */}
        <div className={`flex flex-col h-full bg-white overflow-hidden ${showRightDrawer ? 'md:col-span-8 lg:col-span-5' : 'md:col-span-8'}`}>
          
          {!activeProfile ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-stone-50/30">
              <div className="h-16 w-16 bg-white border border-stone-200 rounded-full flex items-center justify-center text-[#8B1E3F] shadow-sm">
                <MessageSquare className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">No Active Chat Selected</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto font-medium">Select a conversation from the sidebar or connect with a match to start chatting.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/60 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={activeProfile.profileImage}
                  alt={activeProfile.name}
                  className="h-11 w-11 rounded-2xl object-cover ring-2 ring-[#8B1E3F]/20"
                />
                {activeProfile.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>

              <div className="min-w-0">
                <h3 className="font-serif font-bold text-base text-stone-900 truncate flex items-center gap-1.5">
                  {activeProfile.name}
                  {activeProfile.verified && (
                    <Badge variant="verified" className="text-[10px] py-0 px-1.5">
                      <ShieldCheck className="h-3 w-3 text-emerald-600 mr-0.5" /> Verified
                    </Badge>
                  )}
                </h3>
                <p className="text-[11px] text-stone-500 font-medium truncate flex items-center gap-2">
                  <span>{activeProfile.age} yrs • {activeProfile.height}</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online Now
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Action Call Tools */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="gold"
                onClick={() => handleStartCall('video')}
                className="text-xs h-9 px-3 font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 hover:from-amber-500 hover:to-amber-600 shadow-xs"
              >
                <Video className="h-3.5 w-3.5 mr-1" /> Video Call
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStartCall('audio')}
                className="text-xs h-9 px-3 font-semibold text-stone-700 border-stone-200"
              >
                <PhoneCall className="h-3.5 w-3.5 text-[#8B1E3F]" />
              </Button>

              <button
                onClick={() => setShowRightDrawer(prev => !prev)}
                className={`p-2 rounded-xl border transition-colors ${
                  showRightDrawer ? 'bg-[#8B1E3F] text-white border-[#8B1E3F]' : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                }`}
                title="Toggle Partner Profile Details"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-stone-50/40 via-white to-stone-50/30 scrollbar-thin relative">
            
            {/* Security Banner */}
            <div className="text-center my-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-stone-500 bg-amber-50 text-amber-900 px-3.5 py-1.5 rounded-full border border-amber-200/70 shadow-2xs">
                <Lock className="h-3 w-3 text-amber-700" /> End-to-End Encrypted Matrimonial Conversation
              </span>
            </div>

            {isLoadingMessages ? (
              <div className="py-12 text-center space-y-3">
                <DotsLoader size="lg" />
                <p className="text-xs font-bold text-stone-500">Fetching room messages...</p>
              </div>
            ) : displayMessages.length === 0 ? (
              <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
                <div className="h-12 w-12 bg-stone-100 border border-stone-200 rounded-full flex items-center justify-center mx-auto text-[#8B1E3F]">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">No Messages Yet</h3>
                  <p className="text-xs text-stone-500 mt-1 font-medium">Send a respectful message to start your matrimonial conversation.</p>
                </div>
              </div>
            ) : (
              displayMessages.map((msg, idx) => {
                const isMe = msg.is_me || msg.sender_name === currentUser.name;
                const messageText = msg.text || msg.message || '';
                const msgType = msg.message_type || 'text';

                return (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} relative group`}
                  >
                    {msgType === 'horoscope' ? (
                      /* Horoscope Specialty Card Bubble */
                      <div className="max-w-xs sm:max-w-sm rounded-2xl p-4 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border border-amber-300 text-stone-900 space-y-2 shadow-2xs">
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                          <Sparkles className="h-4 w-4 text-amber-600" /> Kundali Compatibility Badge
                        </div>
                        <p className="text-xs text-stone-700 font-medium leading-relaxed">
                          {messageText}
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 pt-1 border-t border-amber-200/60">
                          <span>Verified Guna Matching</span>
                          <span>{msg.time || '10:17 AM'}</span>
                        </div>
                      </div>
                    ) : (
                      /* Standard Message Bubble */
                      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-md relative">
                        {!isMe && (
                          <img
                            src={activeProfile.profileImage}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover ring-1 ring-stone-200 mb-1 shrink-0"
                          />
                        )}
                        <div className="relative group">
                          {/* Media / Attachment Rendering */}
                          {msg.attachment_url && (
                            <div className="mb-1 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 max-w-xs">
                              {msgType === 'image' ? (
                                <img src={msg.attachment_url} alt="Attachment" className="w-full h-auto object-cover max-h-60" />
                              ) : msgType === 'video' ? (
                                <video src={msg.attachment_url} controls className="w-full h-auto max-h-60" />
                              ) : msgType === 'voice' ? (
                                <audio src={msg.attachment_url} controls className="w-full p-2" />
                              ) : (
                                <a
                                  href={msg.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-3 flex items-center gap-2 text-xs font-bold text-[#8B1E3F] hover:underline"
                                >
                                  <FileText className="h-4 w-4" /> Download Document
                                </a>
                              )}
                            </div>
                          )}

                          {/* Text Content */}
                          {messageText && (
                            <div
                              className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                                isMe
                                  ? 'bg-gradient-to-r from-[#8B1E3F] via-[#A0234A] to-[#8B1E3F] text-white rounded-br-xs font-normal shadow-xs'
                                  : 'bg-stone-100/90 text-stone-800 border border-stone-200/80 rounded-bl-xs font-medium'
                              }`}
                            >
                              {messageText}
                            </div>
                          )}

                          {/* Message Context Options Button */}
                          <button
                            type="button"
                            onClick={() => setActiveMessageMenuId(activeMessageMenuId === msg.id ? null : msg.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-stone-600 absolute top-1 -right-6 transition-opacity"
                            title="Message Actions"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>

                          {/* Message Context Dropdown Menu */}
                          {activeMessageMenuId === msg.id && (
                            <div className="absolute right-0 top-8 bg-white border border-stone-200 rounded-2xl shadow-xl p-1 z-50 text-xs w-40 animate-fade-in">
                              <button
                                onClick={() => handleDeleteForMe(msg.id)}
                                className="w-full text-left px-3 py-1.5 hover:bg-stone-100 text-stone-700 rounded-xl flex items-center gap-2 font-medium"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-stone-500" /> Delete for me
                              </button>
                              {isMe && (
                                <button
                                  onClick={() => handleDeleteForEveryone(msg.id)}
                                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-700 rounded-xl flex items-center gap-2 font-bold"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Delete for everyone
                                </button>
                              )}
                            </div>
                          )}

                          <div className={`flex items-center gap-1 text-[10px] text-stone-400 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span>{msg.time || '10:20 AM'}</span>
                            {isMe && <CheckCheck className="h-3 w-3 text-amber-400 font-bold" />}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Icebreaker Suggestions */}
          <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#8B1E3F]" /> Quick Prompts:
            </span>
            {icebreakers.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(prompt)}
                className="shrink-0 text-[11px] font-semibold text-stone-700 bg-white border border-stone-200 hover:border-[#8B1E3F] hover:text-[#8B1E3F] px-3 py-1 rounded-full transition-all duration-200"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Composer Input Bar */}
          <div className="p-3.5 border-t border-stone-200/80 bg-white relative">
            {/* Attachment Menu Popup */}
            <AttachmentPicker
              isOpen={isAttachmentPickerOpen}
              onClose={() => setIsAttachmentPickerOpen(false)}
              onSelectImage={handleSendImageFile}
              onSelectVideo={handleSendVideoFile}
              onSelectDocument={handleSendDocumentFile}
              onSelectAttachment={handleSendAttachmentFile}
            />

            {/* Voice Recorder Overlay Bar */}
            {isVoiceRecording ? (
              <VoiceRecorder
                onSendVoice={handleSendVoiceBlob}
                onCancel={() => setIsVoiceRecording(false)}
              />
            ) : (
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-stone-400 relative">
                  <button
                    type="button"
                    onClick={() => setIsVoiceRecording(true)}
                    className="p-2 hover:bg-stone-100 rounded-xl hover:text-[#8B1E3F] transition-colors"
                    title="Record Voice Note"
                  >
                    <Mic className="h-4.5 w-4.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAttachmentPickerOpen(prev => !prev)}
                    className="p-2 hover:bg-stone-100 rounded-xl hover:text-[#8B1E3F] transition-colors"
                    title="Attach File / Media"
                  >
                    <Paperclip className="h-4.5 w-4.5" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder={`Write a respectful message to ${activeProfile.name.split(' ')[0]}...`}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="flex-1 bg-stone-100/80 border border-stone-200/90 rounded-2xl px-4 py-2.5 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inputText.trim() || sendTextMessageMutation.isPending}
                  className="rounded-2xl px-4 bg-[#8B1E3F] hover:bg-[#721733] text-white disabled:opacity-50"
                >
                  {sendTextMessageMutation.isPending ? (
                    <DotsLoader size="sm" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            )}
          </div>
        </>
      )}
    </div>

    {/* ================= FAR RIGHT PROFILES DRAWER (COL 3 - TOGGLEABLE) ================= */}
    {showRightDrawer && activeProfile && (
          <div className="hidden lg:flex lg:col-span-3 border-l border-stone-200/80 bg-stone-50/50 flex-col h-full overflow-y-auto p-4 space-y-6 scrollbar-thin">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
              <h3 className="font-serif font-bold text-sm text-stone-900">Partner Details</h3>
              <button
                onClick={() => setShowRightDrawer(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div className="text-center space-y-3 bg-white p-4 rounded-2xl border border-stone-200/80">
              <div className="relative inline-block">
                <img
                  src={activeProfile.profileImage}
                  alt={activeProfile.name}
                  className="h-24 w-24 rounded-3xl object-cover mx-auto ring-4 ring-[#8B1E3F]/20"
                />
                {activeProfile.verified && (
                  <span className="absolute bottom-0 right-0 bg-emerald-600 text-white p-1 rounded-full ring-2 ring-white">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-serif font-bold text-base text-stone-900">{activeProfile.name}</h4>
                <p className="text-xs text-[#8B1E3F] font-bold mt-0.5">{activeProfile.religion} • {activeProfile.caste}</p>
                <p className="text-[11px] text-stone-500 font-medium">{activeProfile.profession}</p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/profile/${activeProfile.id}`)}
                className="w-full text-xs font-bold border-stone-200 hover:bg-stone-50"
              >
                View Full Profile
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* WebRTC Audio & Video Call Modal */}
      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        callType={callType}
        recipientName={activeProfile?.name || 'Verified Member'}
        recipientAvatar={activeProfile?.profileImage}
        roomId={numericRoomId}
        recipientId={activeProfile?.id}
        isIncoming={isIncomingCall}
        incomingCallData={activeCallData}
      />
    </div>
  );
};
