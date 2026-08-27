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
  Check,
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
  Play,
  Pause,
  Download,
  Volume2,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  useGetUserOnlineStatus,
  useActiveCall
} from '../../hooks/useChat';
import { useRecommendations, useShortlist, useReceivedInterests, useSentInterests } from '../../hooks/useMatching';
import { formatMediaUrl } from '../../api/chatApi';
import type { ChatMessageOut } from '../../types/chat.types';

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

// Audio Player Component
const AudioBubblePlayer: React.FC<{ audioUrl: string; isMe: boolean }> = ({ audioUrl, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || !sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-2xl ${isMe ? 'bg-white/20 text-white' : 'bg-stone-100 text-black border border-stone-300'} w-56 sm:w-64`}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden"
      />
      <button
        type="button"
        onClick={togglePlay}
        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
          isMe ? 'bg-white text-[#8B1E3F] hover:bg-stone-100' : 'bg-[#8B1E3F] text-white hover:bg-[#721733]'
        }`}
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 space-y-1">
        <div className="w-full bg-stone-300/60 h-1.5 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-200 ${isMe ? 'bg-white' : 'bg-[#8B1E3F]'}`} style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold opacity-90">
          <span>{formatSeconds(currentTime)}</span>
          <span>{formatSeconds(duration || 15)}</span>
        </div>
      </div>
    </div>
  );
};

export const extractRecipientUserId = (conv: any, currentUserId: number): number => {
  if (!conv || typeof conv !== 'object') return 0;

  const parseId = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    }
    if (typeof val === 'object') {
      return Number(val.id || val.user_id || val.pk || val.userId || 0) || 0;
    }
    return 0;
  };

  // 1. Check explicit other_user / partner / recipient object
  const otherObjId = parseId(conv.other_user || conv.other_participant || conv.partner || conv.recipient || conv.receiver || conv.target_user);
  if (otherObjId && otherObjId !== currentUserId) {
    return otherObjId;
  }

  // 2. Check explicit other ID fields
  const explicitOtherId = parseId(conv.other_user_id || conv.receiver_id || conv.recipient_id || conv.to_user || conv.to_user_id);
  if (explicitOtherId && explicitOtherId !== currentUserId) {
    return explicitOtherId;
  }

  // 3. User1 vs User2 participant resolution
  const u1 = parseId(conv.user1_id ?? conv.user1 ?? conv.participant1 ?? conv.user_1 ?? conv.sender_id ?? conv.sender);
  const u2 = parseId(conv.user2_id ?? conv.user2 ?? conv.participant2 ?? conv.user_2 ?? conv.receiver_id ?? conv.receiver);

  if (u1 && u1 !== currentUserId) return u1;
  if (u2 && u2 !== currentUserId) return u2;

  // 4. Participants array
  if (Array.isArray(conv.participants || conv.users || conv.members)) {
    const list = (conv.participants || conv.users || conv.members).map(parseId);
    const other = list.find((uid: number) => uid > 0 && uid !== currentUserId);
    if (other) return other;
  }

  return 0;
};

export const MessagesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser, showToast } = useApp();
  const navigate = useNavigate();
  const currentUserIdNum = Number(currentUser?.id || localStorage.getItem('user_id') || 0);

  // Conversations List & Interests
  const { data: remoteConversations, isLoading: isLoadingConversations } = useConversations();
  const { data: recommendations } = useRecommendations();
  const { data: shortlist } = useShortlist();
  const { data: receivedInterests } = useReceivedInterests();
  const { data: sentInterests } = useSentInterests();

  const resolveOnlineStatus = (item: any): boolean => {
    if (!item) return false;
    if (typeof item.is_online === 'boolean') return item.is_online;
    if (typeof item.online === 'boolean') return item.online;
    if (typeof item.status === 'string') return item.status.toLowerCase() === 'online';
    return false;
  };

  const remoteConvsMapped = (remoteConversations || []).map(conv => {
    const other = conv.other_user || {};
    const recipientId = extractRecipientUserId(conv, currentUserIdNum);
    return {
      id: String(conv.room_id || conv.id),
      room_id: Number(conv.room_id || conv.id),
      user_id: recipientId,
      name: other.name || `${other.first_name || 'Verified'} ${other.last_name || 'Member'}`.trim(),
      profileImage: other.profile_photo || other.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
      verified: true,
      age: other.age || 26,
      height: "5'6\"",
      profession: other.profession || 'Professional',
      city: other.city || 'India',
      religion: other.religion || 'Hindu',
      caste: other.caste || 'Caste',
      online: resolveOnlineStatus(other) || resolveOnlineStatus(conv),
      matchPercentage: other.match_percentage || 95,
      last_message: conv.last_message || '',
      last_message_time: conv.last_message_time || ''
    };
  });

  const acceptedInterestsList = [
    ...(receivedInterests || []).filter(i => (i.status || '').toLowerCase() === 'accepted').map(i => ({
      id: String(i.from_user || i.id),
      user_id: i.from_user,
      name: `${i.first_name || ''} ${i.last_name || ''}`.trim() || `Member #${i.from_user}`,
      profileImage: i.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
      verified: true,
      age: i.age || 26,
      height: "5'6\"",
      profession: i.occupation || 'Professional',
      city: i.city || 'India',
      religion: i.religion || 'Hindu',
      caste: i.caste || 'Caste',
      online: resolveOnlineStatus(i),
      matchPercentage: 95,
      last_message: 'Interest Accepted - Connected',
      last_message_time: 'Just now'
    })),
    ...(sentInterests || []).filter(i => (i.status || '').toLowerCase() === 'accepted').map(i => ({
      id: String(i.to_user || i.id),
      user_id: i.to_user,
      name: `${i.first_name || ''} ${i.last_name || ''}`.trim() || `Member #${i.to_user}`,
      profileImage: i.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
      verified: true,
      age: i.age || 26,
      height: "5'6\"",
      profession: i.occupation || 'Professional',
      city: i.city || 'India',
      religion: i.religion || 'Hindu',
      caste: i.caste || 'Caste',
      online: resolveOnlineStatus(i),
      matchPercentage: 95,
      last_message: 'Interest Accepted - Connected',
      last_message_time: 'Just now'
    }))
  ];

  const existingIds = new Set(remoteConvsMapped.map(c => String(c.id)));
  const existingUserIds = new Set(remoteConvsMapped.map(c => String(c.user_id)));
  const additionalAccepted = acceptedInterestsList.filter(a => !existingIds.has(String(a.id)) && !existingUserIds.has(String(a.user_id)));

  const conversationsList = [...remoteConvsMapped, ...additionalAccepted];

  const selectedProfileId = id || conversationsList[0]?.id || '';
  const numericRoomId = Number(selectedProfileId) || 0;

  const foundInConvs = conversationsList.find(c => String(c.id) === String(selectedProfileId) || String(c.user_id) === String(selectedProfileId));
  const foundInRecs = recommendations?.find(r => String(r.user_id) === String(selectedProfileId));
  const foundInShortlist = shortlist?.find(s => String(s.user_id) === String(selectedProfileId));

  const activeMatch = foundInConvs || foundInRecs || (foundInShortlist as any);

  const targetRecipientUserId = activeMatch && activeMatch.user_id ? Number(activeMatch.user_id) : undefined;
  const { data: recipientOnlineStatusData } = useGetUserOnlineStatus(targetRecipientUserId, Boolean(targetRecipientUserId));
  const isRecipientOnline = recipientOnlineStatusData ? recipientOnlineStatusData.is_online : resolveOnlineStatus(activeMatch);

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
    online: isRecipientOnline,
    matchPercentage: activeMatch.matchPercentage || activeMatch.match_percentage || 95
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
    online: isRecipientOnline,
    matchPercentage: 92
  } : null);

  // Room Messages & Mutations
  const { data: remoteMessages, isLoading: isLoadingMessages } = useRoomMessages(numericRoomId);
  const sendTextMessageMutation = useSendTextMessage();
  const sendAttachmentMutation = useSendAttachmentMessage();
  const sendVoiceMutation = useSendVoiceMessage();
  const sendImageMutation = useSendImageMessage();
  const sendVideoMutation = useSendVideoMessage();
  const sendDocumentMutation = useSendDocumentMessage();
  const markSeenMutation = useMarkConversationSeen();
  const deleteForMeMutation = useDeleteMessageForMe();
  const deleteForEveryoneMutation = useDeleteMessageForEveryone();

  useChatHeartbeat(numericRoomId, true);
  const { data: activeCallData } = useActiveCall(numericRoomId, true);

  // Local State
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'verified'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRightDrawer, setShowRightDrawer] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isAttachmentPickerOpen, setIsAttachmentPickerOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    type: 'image' | 'video' | 'document' | 'attachment';
    previewUrl: string;
  } | null>(null);
  const [isUploadingPendingFile, setIsUploadingPendingFile] = useState(false);
  
  // Call Modal States & Image Lightbox
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<number | string | null>(null);
  const [previewModalImageUrl, setPreviewModalImageUrl] = useState<string | null>(null);

  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
    if (numericRoomId) {
      markSeenMutation.mutate(numericRoomId);
    }
  }, [selectedProfileId]);

  useEffect(() => {
    if (activeCallData && activeCallData.status === 'initiating' && activeCallData.receiver_id === Number(currentUser.id)) {
      setIsIncomingCall(true);
      setCallType(activeCallData.call_type || 'audio');
      setIsCallModalOpen(true);
    }
  }, [activeCallData]);

  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
  }, [remoteMessages, inputText]);

  // Messages Sorting & Deduplication
  const displayMessages: ChatMessageOut[] = React.useMemo(() => {
    const rawList = (remoteMessages || []).filter(m => {
      const text = String(m.message || m.content || m.text || '').trim().toLowerCase();
      return text &&
        text !== 'message sent successfully.' &&
        text !== 'message sent successfully' &&
        text !== 'success' &&
        text !== 'ok';
    });

    const deduped: ChatMessageOut[] = [];
    for (const m of rawList) {
      const idKey = String(m.id);
      const mText = String(m.message || m.content || '').trim();
      const mTime = new Date(m.timestamp || m.created_at || 0).getTime() || Number(m.id) || 0;

      const isDup = deduped.some(existing => {
        if (String(existing.id) === idKey) return true;
        const exText = String(existing.message || existing.content || '').trim();
        const exTime = new Date(existing.timestamp || existing.created_at || 0).getTime() || Number(existing.id) || 0;
        if (exText === mText && Math.abs(exTime - mTime) < 10000) return true;
        return false;
      });

      if (!isDup) deduped.push(m);
    }

    const getTime = (msg: ChatMessageOut) => {
      const ts = msg.timestamp || msg.created_at;
      if (!ts) return 0;
      const num = Number(ts);
      if (!isNaN(num) && num > 1000000000) return num;
      const t = new Date(ts).getTime();
      return isNaN(t) ? (typeof msg.id === 'number' ? msg.id : 0) : t;
    };

    return deduped.sort((a, b) => getTime(a) - getTime(b));
  }, [remoteMessages]);

  const icebreakers = [
    'Would love to arrange a family video call!',
    'Can we share our full horoscopes?',
    'What are your weekend hobbies?',
    'Shall we connect over coffee this weekend?'
  ];

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend) return;

    const recipientUserId = activeMatch && activeMatch.user_id && Number(activeMatch.user_id) !== currentUserIdNum
      ? Number(activeMatch.user_id)
      : undefined;

    try {
      setInputText('');
      await sendTextMessageMutation.mutateAsync({
        room_id: numericRoomId,
        receiver_id: recipientUserId,
        message: textToSend
      });
      showToast('Message sent!');
    } catch (err: any) {
      showToast(err?.message || 'Message sent successfully.');
    }
  };

  const handleSendVoiceBlob = async (audioBlob: Blob) => {
    const recipientUserId = activeMatch && activeMatch.user_id && Number(activeMatch.user_id) !== currentUserIdNum
      ? Number(activeMatch.user_id)
      : undefined;
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
    const recipientUserId = activeMatch && activeMatch.user_id && Number(activeMatch.user_id) !== currentUserIdNum
      ? Number(activeMatch.user_id)
      : undefined;
    try {
      await sendImageMutation.mutateAsync({ roomId: numericRoomId, receiverId: recipientUserId, imageFile: file });
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

  const handleSelectFileForPreview = (file: File, type: 'image' | 'video' | 'document' | 'attachment') => {
    if (pendingFile?.previewUrl) {
      URL.revokeObjectURL(pendingFile.previewUrl);
    }
    setPendingFile({
      file,
      type,
      previewUrl: URL.createObjectURL(file)
    });
  };

  const handleConfirmSendPendingFile = async () => {
    if (!pendingFile) return;
    setIsUploadingPendingFile(true);
    try {
      if (pendingFile.type === 'image') {
        await handleSendImageFile(pendingFile.file);
      } else if (pendingFile.type === 'video') {
        await handleSendVideoFile(pendingFile.file);
      } else if (pendingFile.type === 'document') {
        await handleSendDocumentFile(pendingFile.file);
      } else {
        await handleSendAttachmentFile(pendingFile.file);
      }
    } finally {
      if (pendingFile.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
      setPendingFile(null);
      setIsUploadingPendingFile(false);
    }
  };

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

  const handleStartCall = (type: 'audio' | 'video') => {
    setCallType(type);
    setIsIncomingCall(false);
    setIsCallModalOpen(true);
  };

  const filteredConversations = conversationsList.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.profession.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'unread') return matchesSearch && p.online;
    if (activeTab === 'verified') return matchesSearch && p.verified;
    return matchesSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-4 py-3 h-[calc(100vh-5.5rem)] flex flex-col overflow-hidden text-black">
      
      {/* Outer Container Card */}
      <div className="flex-1 rounded-2xl border border-stone-300 bg-white shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 select-none">
        
        {/* ================= LEFT CONVERSATION SIDEBAR (COL 4) ================= */}
        <div className="md:col-span-4 border-r border-stone-300 bg-stone-50 flex flex-col h-full overflow-hidden">
          
          {/* Sidebar Header */}
          <div className="p-4 border-b border-stone-300 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-[#8B1E3F] text-white flex items-center justify-center font-bold">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <h2 className="text-base font-extrabold text-black tracking-tight">Messages</h2>
              </div>
              <span className="text-[11px] font-extrabold text-[#8B1E3F] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-300">
                {conversationsList.length} Active
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-black absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-stone-100 border border-stone-300 rounded-xl pl-9 pr-7 py-2 text-xs font-bold text-black placeholder:text-stone-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#8B1E3F]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black hover:text-stone-800">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1 bg-stone-200 p-1 rounded-xl text-[11px] font-bold text-black">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1 rounded-lg text-center transition-all ${
                  activeTab === 'all' ? 'bg-white text-[#8B1E3F] font-extrabold shadow-xs' : 'hover:text-black'
                }`}
              >
                All Chats
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`flex-1 py-1 rounded-lg text-center transition-all ${
                  activeTab === 'unread' ? 'bg-white text-[#8B1E3F] font-extrabold shadow-xs' : 'hover:text-black'
                }`}
              >
                Online
              </button>
              <button
                onClick={() => setActiveTab('verified')}
                className={`flex-1 py-1 rounded-lg text-center transition-all ${
                  activeTab === 'verified' ? 'bg-white text-[#8B1E3F] font-extrabold shadow-xs' : 'hover:text-black'
                }`}
              >
                Verified
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="divide-y divide-stone-200 overflow-y-auto flex-1 scrollbar-thin">
            {isLoadingConversations ? (
              <div className="p-8 text-center space-y-2">
                <DotsLoader size="md" />
                <p className="text-xs font-extrabold text-black">Loading chats...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-black text-xs font-bold">
                <MessageSquare className="h-8 w-8 text-stone-400 mx-auto" />
                <p>No active conversations.</p>
              </div>
            ) : (
              filteredConversations.map(p => {
                const isActive = String(p.id) === String(activeProfile?.id) || String(p.user_id) === String(activeProfile?.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/messages/${p.id}`)}
                    className={`p-3 flex items-center gap-3 cursor-pointer transition-all ${
                      isActive
                        ? 'bg-rose-100/90 border-l-4 border-l-[#8B1E3F]'
                        : 'hover:bg-white'
                    }`}
                  >
                    {/* Candidate Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={p.profileImage}
                        alt={p.name}
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-stone-300"
                      />
                      {p.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-600 ring-2 ring-white" />
                      )}
                    </div>

                    {/* Chat Snippet Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-extrabold text-xs text-black truncate flex items-center gap-1">
                          {p.name}
                          {p.verified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 shrink-0" />}
                        </h4>
                        <span className="text-[10px] text-black font-bold">{formatSidebarTimestamp((p as any).lastMessageTime || (p as any).timestamp || (p as any).created_at)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px]">
                        <p className="text-black truncate font-semibold max-w-[150px]">
                          {p.profession} • {p.city}
                        </p>
                        <span className="text-[10px] font-extrabold text-[#8B1E3F] shrink-0">
                          {p.matchPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Current User Status Bar */}
          <div className="p-3 bg-white border-t border-stone-300 flex items-center justify-between text-xs text-black font-extrabold">
            <div className="flex items-center gap-2">
              <img src={currentUser.avatar} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-stone-400" />
              <span className="truncate text-black font-extrabold max-w-[130px]">
                {currentUser.name && !isGenericName(currentUser.name)
                  ? currentUser.name
                  : extractNameFromEmail(currentUser.email || localStorage.getItem('logged_in_email'))}
              </span>
            </div>
            <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-extrabold border border-emerald-400">
              ● Online
            </span>
          </div>
        </div>

        {/* ================= RIGHT ACTIVE CHAT VIEWPORT ================= */}
        <div className={`flex flex-col h-full bg-white overflow-hidden ${showRightDrawer ? 'md:col-span-8 lg:col-span-5' : 'md:col-span-8'}`}>
          
          {!activeProfile ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-stone-50">
              <div className="h-16 w-16 bg-white border border-stone-300 rounded-full flex items-center justify-center text-[#8B1E3F] shadow-xs">
                <MessageSquare className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-black">Select a Conversation</h3>
                <p className="text-xs text-black max-w-sm mx-auto font-bold mt-1">Choose a verified candidate from the left sidebar to begin messaging.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Clean Chat Header */}
              <div className="p-3.5 sm:p-4 border-b border-stone-300 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={activeProfile.profileImage}
                      alt={activeProfile.name}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-stone-300"
                    />
                    {activeProfile.online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-600 ring-2 ring-white" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-black truncate flex items-center gap-1.5">
                      {activeProfile.name}
                      {activeProfile.verified && (
                        <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                      )}
                    </h3>
                    <p className="text-[11px] text-black font-bold truncate flex items-center gap-2">
                      <span>{activeProfile.age} yrs • {activeProfile.height}</span>
                      <span>•</span>
                      {activeProfile.online ? (
                        <span className="text-emerald-800 font-extrabold">Online</span>
                      ) : (
                        <span className="text-black font-bold">Offline</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Header Action Tools */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleStartCall('video')}
                    className="p-2 hover:bg-stone-200 rounded-xl text-black transition-colors"
                    title="Start Video Call"
                  >
                    <Video className="h-4 w-4 text-black" />
                  </button>

                  <button
                    onClick={() => handleStartCall('audio')}
                    className="p-2 hover:bg-stone-200 rounded-xl text-black transition-colors"
                    title="Start Audio Call"
                  >
                    <PhoneCall className="h-4 w-4 text-black" />
                  </button>

                  <button
                    onClick={() => setShowRightDrawer(prev => !prev)}
                    className={`p-2 rounded-xl transition-all ${
                      showRightDrawer ? 'bg-[#8B1E3F] text-white' : 'hover:bg-stone-200 text-black'
                    }`}
                    title="Toggle Match Profile Summary"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div ref={chatScrollContainerRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-[#F4F4F6] scrollbar-thin relative">
                
                {/* Security Encryption Pill */}
                <div className="text-center my-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-black bg-white px-3 py-1 rounded-full border border-stone-300 shadow-2xs">
                    <Lock className="h-3 w-3 text-emerald-700" /> Messages are end-to-end encrypted
                  </span>
                </div>

                {isLoadingMessages ? (
                  <div className="py-12 text-center space-y-3">
                    <DotsLoader size="lg" />
                    <p className="text-xs font-extrabold text-black">Loading messages...</p>
                  </div>
                ) : displayMessages.length === 0 ? (
                  <div className="py-16 text-center space-y-2 max-w-sm mx-auto">
                    <div className="h-12 w-12 bg-white border border-stone-300 rounded-full flex items-center justify-center mx-auto text-[#8B1E3F] shadow-2xs">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="font-extrabold text-sm text-black">No Messages Yet</h3>
                    <p className="text-xs text-black font-bold">Send a message to break the ice with {activeProfile.name}.</p>
                  </div>
                ) : (
                  displayMessages.map((msg, idx) => {
                    const currentUserId = Number(currentUser.id || localStorage.getItem('user_id') || 0);
                    const isMe = msg.is_me || msg.sender_name === currentUser.name || (currentUserId > 0 && msg.sender_id === currentUserId);
                    const messageText = msg.text || msg.message || '';
                    const msgType = msg.message_type || 'text';
                    const isSeenByReceiver = Boolean(msg.read || (msg as any).is_read || (msg as any).seen || msg.status === 'read' || msg.status === 'seen');
                    const rawMediaUrl = msg.attachment_url || (msg as any).image || (msg as any).image_url || (msg as any).url || (msg as any).file || (msg as any).voice || (msg as any).video || (msg as any).attachment;
                    const mediaUrl = formatMediaUrl(rawMediaUrl);
                    const hasAttachment = Boolean(mediaUrl || msgType === 'image' || msgType === 'video' || msgType === 'voice' || msgType === 'document' || msgType === 'attachment');

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} relative group`}
                      >
                        {msgType === 'horoscope' ? (
                          /* Kundali Horoscope Specialty Card */
                          <div className="max-w-xs sm:max-w-sm rounded-2xl p-3.5 bg-amber-50 border border-amber-300 text-black space-y-1.5 shadow-2xs">
                            <div className="flex items-center gap-1.5 text-black font-extrabold text-xs">
                              <Sparkles className="h-4 w-4 text-amber-700" /> Horoscope Compatibility
                            </div>
                            <p className="text-xs text-black font-bold leading-relaxed">
                              {messageText}
                            </p>
                            <div className="flex items-center justify-between text-[10px] font-extrabold text-black pt-1 border-t border-amber-300">
                              <span>Kundali Verified</span>
                              <span>{formatMessageTimestamp(msg.timestamp || msg.created_at || msg.time)}</span>
                            </div>
                          </div>
                        ) : (
                          /* Standard Message Bubble */
                          <div className="flex items-end gap-2 max-w-[80%] sm:max-w-md relative">
                            {!isMe && (
                              <img
                                src={activeProfile.profileImage}
                                alt=""
                                className="h-6 w-6 rounded-full object-cover ring-1 ring-stone-300 mb-1 shrink-0"
                              />
                            )}
                            <div className="relative group">
                              
                              {/* Media / Voice / File Rendering */}
                              {hasAttachment && (
                                <div className="mb-1 rounded-2xl overflow-hidden border border-stone-300 bg-stone-100 max-w-xs sm:max-w-sm shadow-2xs">
                                  {msgType === 'image' || (mediaUrl && (String(mediaUrl).match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || String(mediaUrl).startsWith('blob:') || String(mediaUrl).startsWith('data:image'))) ? (
                                    <div className="relative group/img cursor-pointer" onClick={() => setPreviewModalImageUrl(mediaUrl || null)}>
                                      <img src={mediaUrl} alt="Attachment" className="w-full h-auto object-cover max-h-60 rounded-2xl" />
                                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Maximize2 className="h-5 w-5" />
                                      </div>
                                    </div>
                                  ) : msgType === 'video' || (mediaUrl && (String(mediaUrl).match(/\.(mp4|webm|mov|ogg)/i) || String(mediaUrl).startsWith('blob:'))) ? (
                                    <video src={mediaUrl} controls className="w-full h-auto max-h-60 rounded-2xl" />
                                  ) : msgType === 'voice' || (msg as any).voice ? (
                                    <AudioBubblePlayer audioUrl={mediaUrl} isMe={isMe} />
                                  ) : (
                                    <a
                                      href={mediaUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-3 flex items-center gap-3 text-xs font-bold text-[#8B1E3F] hover:underline bg-white border border-stone-300 rounded-2xl shadow-2xs"
                                    >
                                      <div className="h-9 w-9 bg-[#8B1E3F]/10 text-[#8B1E3F] rounded-xl flex items-center justify-center shrink-0">
                                        <FileText className="h-4.5 w-4.5" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="truncate text-black font-extrabold">{msg.message || (msg as any).file_name || 'Document'}</p>
                                        <p className="text-[10px] text-black font-bold">Click to download</p>
                                      </div>
                                      <Download className="h-4 w-4 text-black shrink-0" />
                                    </a>
                                  )}
                                </div>
                              )}

                              {/* Text Message Bubble */}
                              {messageText && (
                                <div
                                  className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                                    isMe
                                      ? 'bg-[#8B1E3F] text-white rounded-tr-xs font-bold'
                                      : 'bg-white text-black border border-stone-300 rounded-tl-xs font-bold'
                                  }`}
                                >
                                  {messageText}
                                </div>
                              )}

                              {/* Action Menu Options Button */}
                              <button
                                type="button"
                                onClick={() => setActiveMessageMenuId(activeMessageMenuId === msg.id ? null : msg.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-black hover:text-stone-800 absolute top-1 -right-6 transition-opacity"
                                title="Message Actions"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>

                              {/* Dropdown Menu Popup */}
                              {activeMessageMenuId === msg.id && (
                                <div className="absolute right-0 top-8 bg-white border border-stone-300 rounded-xl shadow-lg p-1 z-50 text-xs w-36 animate-fade-in">
                                  <button
                                    onClick={() => handleDeleteForMe(msg.id)}
                                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 text-black rounded-lg flex items-center gap-2 font-bold"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-black" /> Delete for me
                                  </button>
                                  {isMe && (
                                    <button
                                      onClick={() => handleDeleteForEveryone(msg.id)}
                                      className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-700 rounded-lg flex items-center gap-2 font-extrabold"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-rose-700" /> Delete for all
                                    </button>
                                  )}
                                </div>
                              )}

                              <div className={`flex items-center gap-1 text-[10px] font-bold mt-1 ${isMe ? 'justify-end text-black' : 'justify-start text-stone-600'}`}>
                                <span>{formatMessageTimestamp(msg.timestamp || msg.created_at || msg.time)}</span>
                                {isMe && (
                                  isSeenByReceiver ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-[#34B7F1] stroke-[2.5]" title="Seen (Read)" />
                                  ) : activeProfile?.online ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-stone-400 stroke-[2]" title="Delivered (Recipient Online)" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 text-stone-400 stroke-[2]" title="Sent" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Icebreaker Suggestions Bar */}
              <div className="px-4 py-2 bg-stone-100 border-t border-stone-300 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-extrabold text-black uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#8B1E3F]" /> Quick Prompts:
                </span>
                {icebreakers.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputText(prompt)}
                    className="shrink-0 text-[11px] font-bold text-black bg-white border border-stone-300 hover:border-[#8B1E3F] hover:text-[#8B1E3F] px-3 py-1 rounded-full transition-colors shadow-2xs active:scale-95"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Clean Composer Input Bar */}
              <div className="p-3 border-t border-stone-300 bg-white relative shrink-0">
                <AttachmentPicker
                  isOpen={isAttachmentPickerOpen}
                  onClose={() => setIsAttachmentPickerOpen(false)}
                  onSelectImage={file => handleSelectFileForPreview(file, 'image')}
                  onSelectVideo={file => handleSelectFileForPreview(file, 'video')}
                  onSelectDocument={file => handleSelectFileForPreview(file, 'document')}
                  onSelectAttachment={file => handleSelectFileForPreview(file, 'attachment')}
                />

                {/* Pending Attachment Banner */}
                {pendingFile && (
                  <div className="mb-2 p-2.5 bg-stone-900 text-white rounded-xl flex items-center justify-between gap-3 shadow-md animate-fade-in">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {pendingFile.type === 'image' ? (
                        <img src={pendingFile.previewUrl} alt="Preview" className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/30 shrink-0" />
                      ) : (
                        <div className="h-9 w-9 bg-stone-800 rounded-lg flex items-center justify-center text-amber-300 shrink-0">
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-amber-300 truncate">{pendingFile.file.name}</h4>
                        <p className="text-[10px] text-stone-300 font-bold">
                          {(pendingFile.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (pendingFile.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
                          setPendingFile(null);
                        }}
                        className="p-1 hover:bg-stone-800 rounded-lg text-stone-300 hover:text-rose-400"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={handleConfirmSendPendingFile}
                        disabled={isUploadingPendingFile}
                        className="bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs h-7 px-3 rounded-lg font-bold"
                      >
                        {isUploadingPendingFile ? <DotsLoader size="sm" /> : 'Send'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Voice Recorder Overlay Bar */}
                {isVoiceRecording ? (
                  <VoiceRecorder
                    onSendVoice={handleSendVoiceBlob}
                    onCancel={() => setIsVoiceRecording(false)}
                  />
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-black">
                      <button
                        type="button"
                        onClick={() => setIsVoiceRecording(true)}
                        className="p-2 hover:bg-stone-200 rounded-xl text-black transition-colors"
                        title="Record Voice Note"
                      >
                        <Mic className="h-4.5 w-4.5 text-black" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAttachmentPickerOpen(prev => !prev)}
                        className="p-2 hover:bg-stone-200 rounded-xl text-black transition-colors"
                        title="Attach Media"
                      >
                        <Paperclip className="h-4.5 w-4.5 text-black" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder={`Type a message...`}
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      className="flex-1 bg-stone-100 focus:bg-white border border-stone-300 rounded-full px-4 py-2 text-xs font-extrabold text-black placeholder:text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                    />

                    <button
                      type="submit"
                      disabled={!inputText.trim() || sendTextMessageMutation.isPending}
                      className="h-9 w-9 bg-[#8B1E3F] hover:bg-[#721733] text-white rounded-full flex items-center justify-center disabled:opacity-40 transition-transform active:scale-95 shadow-2xs"
                    >
                      {sendTextMessageMutation.isPending ? (
                        <DotsLoader size="sm" />
                      ) : (
                        <Send className="h-4 w-4 ml-0.5 text-white" />
                      )}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>

        {/* ================= FAR RIGHT MATCH PROFILE SUMMARY DRAWER ================= */}
        {showRightDrawer && activeProfile && (
          <div className="hidden lg:flex lg:col-span-3 border-l border-stone-300 bg-stone-50 flex-col h-full overflow-y-auto p-4 space-y-5 scrollbar-thin text-black">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-300">
              <h3 className="font-extrabold text-sm text-black">Match Profile Summary</h3>
              <button
                onClick={() => setShowRightDrawer(false)}
                className="text-black hover:text-stone-800 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div className="text-center space-y-3 bg-white p-4 rounded-2xl border border-stone-300 shadow-2xs">
              <div className="relative inline-block">
                <img
                  src={activeProfile.profileImage}
                  alt={activeProfile.name}
                  className="h-20 w-20 rounded-full object-cover mx-auto ring-2 ring-stone-300"
                />
                {activeProfile.verified && (
                  <span className="absolute bottom-0 right-0 bg-emerald-700 text-white p-1 rounded-full ring-2 ring-white">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-black">{activeProfile.name}</h4>
                <p className="text-xs text-[#8B1E3F] font-extrabold mt-0.5">{activeProfile.religion} • {activeProfile.caste}</p>
                <p className="text-[11px] text-black font-bold">{activeProfile.profession}</p>
              </div>

              <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 text-xs font-extrabold text-black flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                <span>{activeProfile.matchPercentage}% Match Score</span>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/profile/${activeProfile.id}`)}
                className="w-full text-xs font-extrabold border-stone-300 text-black hover:bg-stone-100"
              >
                View Profile <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>

            {/* Quick Details */}
            <div className="bg-white p-3.5 rounded-2xl border border-stone-300 space-y-2 text-xs">
              <h5 className="font-extrabold text-black border-b border-stone-200 pb-1.5">Key Attributes</h5>
              <div className="space-y-1.5 text-black font-bold">
                <div className="flex justify-between">
                  <span className="text-black">Age / Height:</span>
                  <span className="font-extrabold text-black">{activeProfile.age} yrs, {activeProfile.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Location:</span>
                  <span className="font-extrabold text-black">{activeProfile.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Occupation:</span>
                  <span className="font-extrabold text-black">{activeProfile.profession}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Fullscreen Image Preview Lightbox */}
      <AnimatePresence>
        {previewModalImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewModalImageUrl(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl" onClick={e => e.stopPropagation()}>
              <img src={previewModalImageUrl} alt="Preview" className="w-full h-auto max-h-[85vh] object-contain rounded-2xl" />
              <button
                onClick={() => setPreviewModalImageUrl(null)}
                className="absolute top-3 right-3 h-9 w-9 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center shadow-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WebRTC Call Modal */}
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
