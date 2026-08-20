import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp, extractNameFromEmail, isGenericName } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
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
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatMessage {
  id: string | number;
  sender: 'me' | 'them';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'horoscope' | 'voice_note' | 'profile_share';
  extraData?: any;
}

export const MessagesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profiles, currentUser, showToast } = useApp();
  const navigate = useNavigate();

  const conversationList = profiles.slice(0, 6);
  const activeProfile = profiles.find(p => p.id === id) || conversationList[0];

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'verified'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRightDrawer, setShowRightDrawer] = useState(true);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  // Chat History per conversation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'them',
      text: `Namaste Rahul! I reviewed your profile on Vivah and noticed our families share very similar cultural values.`,
      time: '10:14 AM',
      status: 'read',
      type: 'text'
    },
    {
      id: 'm2',
      sender: 'me',
      text: `Namaste ${activeProfile.name.split(' ')[0]}! Thank you so much for reaching out. Yes, family traditions and mutual respect are super important to me.`,
      time: '10:16 AM',
      status: 'read',
      type: 'text'
    },
    {
      id: 'm3',
      sender: 'them',
      text: `✨ Kundali Match Summary: 32 out of 36 Gunas matching (Excellent Compatibility)`,
      time: '10:17 AM',
      type: 'horoscope',
      extraData: { score: '32 / 36 Gunas', status: 'Highly Compatible' }
    },
    {
      id: 'm4',
      sender: 'them',
      text: `That is wonderful! My family is based in Mumbai. Would love to know if you travel here often or if your parents would like to connect over a call?`,
      time: '10:18 AM',
      status: 'read',
      type: 'text'
    },
    {
      id: 'm5',
      sender: 'me',
      text: `I visit Mumbai quite frequently for work projects. My parents would be delighted to speak with your family.`,
      time: '10:20 AM',
      status: 'read',
      type: 'text'
    }
  ]);

  const [inputText, setInputText] = useState('');

  // ICEBREAKER SUGGESTIONS
  const icebreakers = [
    'Would love to arrange a family video call!',
    'Can we share our full horoscopes?',
    'What are your weekend hobbies?',
    'Shall we connect over coffee this weekend?'
  ];

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now(),
      sender: 'me',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
      type: 'text'
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Simulate reply after 1.5s
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'them',
          text: `Thank you for your message, Rahul! That sounds lovely. Let me check with my family and get back to you shortly.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text'
        }
      ]);
    }, 1500);
  };

  const filteredConversations = conversationList.filter(p => {
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
                {conversationList.length} Active
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
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">
                No matching conversations found.
              </div>
            ) : (
              filteredConversations.map(p => {
                const isActive = p.id === activeProfile.id;
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

          {/* User Status Bar */}
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

            {/* Quick Action Tools */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="gold"
                onClick={() => setIsVideoModalOpen(true)}
                className="text-xs h-9 px-3 font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 hover:from-amber-500 hover:to-amber-600 shadow-xs"
              >
                <Video className="h-3.5 w-3.5 mr-1" /> Video Call
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAudioModalOpen(true)}
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
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-stone-50/40 via-white to-stone-50/30 scrollbar-thin">
            
            {/* End to End Security Banner */}
            <div className="text-center my-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-stone-500 bg-amber-50 text-amber-900 px-3.5 py-1.5 rounded-full border border-amber-200/70 shadow-2xs">
                <Lock className="h-3 w-3 text-amber-700" /> End-to-End Encrypted Matrimonial Conversation
              </span>
            </div>

            {messages.map(msg => {
              const isMe = msg.sender === 'me';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {msg.type === 'horoscope' ? (
                    /* Horoscope Specialty Card Bubble */
                    <div className="max-w-xs sm:max-w-sm rounded-2xl p-4 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border border-amber-300 text-stone-900 space-y-2 shadow-2xs">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <Sparkles className="h-4 w-4 text-amber-600" /> Kundali Compatibility Badge
                      </div>
                      <p className="text-xs text-stone-700 font-medium leading-relaxed">
                        {msg.text}
                      </p>
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 pt-1 border-t border-amber-200/60">
                        <span>Verified Guna Matching</span>
                        <span>{msg.time}</span>
                      </div>
                    </div>
                  ) : (
                    /* Standard Message Bubble */
                    <div className="flex items-end gap-2 max-w-[85%] sm:max-w-md">
                      {!isMe && (
                        <img
                          src={activeProfile.profileImage}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover ring-1 ring-stone-200 mb-1"
                        />
                      )}
                      <div>
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-gradient-to-r from-[#8B1E3F] via-[#A0234A] to-[#8B1E3F] text-white rounded-br-xs font-normal'
                              : 'bg-stone-100/90 text-stone-800 border border-stone-200/80 rounded-bl-xs font-medium'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-1 text-[10px] text-stone-400 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span>{msg.time}</span>
                          {isMe && <CheckCheck className="h-3 w-3 text-amber-400 font-bold" />}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
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

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3.5 border-t border-stone-200/80 bg-white flex items-center gap-2">
            <div className="flex items-center gap-1 text-stone-400">
              <button
                type="button"
                onClick={() => showToast('Voice note recording started...')}
                className="p-2 hover:bg-stone-100 rounded-xl hover:text-[#8B1E3F] transition-colors"
                title="Voice Note"
              >
                <Mic className="h-4.5 w-4.5" />
              </button>

              <button
                type="button"
                onClick={() => showToast('Open photo gallery')}
                className="p-2 hover:bg-stone-100 rounded-xl hover:text-[#8B1E3F] transition-colors"
                title="Send Photo"
              >
                <ImageIcon className="h-4.5 w-4.5" />
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
              disabled={!inputText.trim()}
              className="rounded-2xl px-4 bg-[#8B1E3F] hover:bg-[#721733] text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

        </div>

        {/* ================= FAR RIGHT PROFILES DRAWER (COL 3 - TOGGLEABLE) ================= */}
        {showRightDrawer && (
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
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-serif font-bold text-lg text-stone-900">{activeProfile.name}</h4>
                <p className="text-xs text-stone-500 font-semibold">{activeProfile.profession}</p>
                <p className="text-[11px] text-stone-400">{activeProfile.city}, {activeProfile.state}</p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 border-t border-stone-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/profile/${activeProfile.id}`)}
                  className="w-full text-xs h-8 font-semibold border-stone-200"
                >
                  Full Profile
                </Button>
              </div>
            </div>

            {/* Key Match Specs */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-3">
              <h4 className="font-serif font-bold text-xs text-stone-900 uppercase tracking-wider text-[#8B1E3F]">
                Match Summary
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">Age & Height:</span>
                  <span className="text-stone-900 font-bold">{activeProfile.age} yrs, {activeProfile.height}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">Religion & Caste:</span>
                  <span className="text-stone-900 font-bold">{activeProfile.religion}, {activeProfile.caste}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">Education:</span>
                  <span className="text-stone-900 font-bold truncate max-w-[130px]">{activeProfile.education}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">Marital Status:</span>
                  <span className="text-stone-900 font-bold">{activeProfile.maritalStatus}</span>
                </div>
              </div>
            </div>

            {/* Compatibility Progress */}
            <div className="bg-gradient-to-br from-[#8B1E3F]/5 to-[#D4AF37]/10 p-4 rounded-2xl border border-[#8B1E3F]/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#8B1E3F] flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" /> AI Match Score
                </span>
                <span className="text-[#8B1E3F]">{activeProfile.matchPercentage}%</span>
              </div>
              <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8B1E3F] to-[#D4AF37] rounded-full"
                  style={{ width: `${activeProfile.matchPercentage}%` }}
                />
              </div>
              <p className="text-[10px] text-stone-600 font-medium pt-1">
                High compatibility in career goals, lifestyle & horoscope.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Video Call Modal */}
      <Modal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} title={`Video Call with ${activeProfile.name}`}>
        <div className="space-y-4 text-center">
          <div className="aspect-video bg-stone-900 rounded-3xl flex flex-col items-center justify-center text-white space-y-3 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="relative z-10 space-y-2">
              <img
                src={activeProfile.profileImage}
                alt=""
                className="h-20 w-20 rounded-full object-cover ring-4 ring-[#D4AF37] mx-auto animate-pulse"
              />
              <h4 className="font-serif font-bold text-xl text-white">{activeProfile.name}</h4>
              <p className="text-xs text-amber-300 font-semibold flex items-center justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" /> Calling... Securing 128-bit Encrypted Video
              </p>
            </div>
          </div>
          <Button variant="danger" size="md" onClick={() => setIsVideoModalOpen(false)} className="w-full font-bold">
            End Call
          </Button>
        </div>
      </Modal>

      {/* Audio Call Modal */}
      <Modal isOpen={isAudioModalOpen} onClose={() => setIsAudioModalOpen(false)} title={`Voice Call with ${activeProfile.name}`}>
        <div className="space-y-4 text-center p-4">
          <div className="p-8 bg-stone-100 rounded-3xl space-y-3">
            <img
              src={activeProfile.profileImage}
              alt=""
              className="h-20 w-20 rounded-full object-cover ring-4 ring-[#8B1E3F] mx-auto"
            />
            <h4 className="font-serif font-bold text-lg text-stone-900">{activeProfile.name}</h4>
            <p className="text-xs text-emerald-700 font-bold">Connecting Audio Channel...</p>
          </div>
          <Button variant="danger" size="md" onClick={() => setIsAudioModalOpen(false)} className="w-full font-bold">
            Cancel Call
          </Button>
        </div>
      </Modal>
    </div>
  );
};
