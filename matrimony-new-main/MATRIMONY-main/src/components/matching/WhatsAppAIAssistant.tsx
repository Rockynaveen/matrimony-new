import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Send, Bot, ExternalLink, ShieldCheck, Heart, CheckCircle2, Sliders } from 'lucide-react';
import type { MatchResponseSchema, AISearchMatchCardSchema } from '../../types/matching.types';
import { useAskAI } from '../../hooks/useMatching';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  aiMatches?: AISearchMatchCardSchema[];
  matchedProfiles?: MatchResponseSchema[];
  interpretedPreferences?: Record<string, any>;
  totalMatches?: number;
  timestamp: string;
}

interface AskAIAssistantProps {
  matches?: MatchResponseSchema[];
  onApplyFilter?: (criteria: { profession?: string; location?: string; minScore?: number }) => void;
}

export const WhatsAppAIAssistant: React.FC<AskAIAssistantProps> = ({
  matches = [],
  onApplyFilter
}) => {
  const navigate = useNavigate();
  const askAIMutation = useAskAI();
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: 'Namaste! 🙏 I am your AI Matchmaker assistant.\n\nAsk me anything in natural language to find your ideal match, such as:\n• "Find software engineers in Bangalore"\n• "Show me doctors with high compatibility"\n• "Looking for someone living in Hyderabad with Masters degree"',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const quickPrompts = [
    '💻 Software engineers in Bangalore',
    '🩺 Doctors with 80%+ match',
    '📍 Profiles in Hyderabad',
    '🎓 Master degree holders'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      // Call backend API /api/matching/ask-ai/
      const res = await askAIMutation.mutateAsync(text);

      let reply = res.message || '';
      if (!reply) {
        if (res.matches && res.matches.length > 0) {
          reply = `Found ${res.total_matches || res.matches.length} matching candidate${(res.total_matches || res.matches.length) > 1 ? 's' : ''} for "${text}":`;
        } else {
          reply = `I couldn't find any profiles strictly matching your query "${text}". Try broadening your criteria or checking all recommendations.`;
        }
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: reply,
        aiMatches: res.matches || [],
        interpretedPreferences: res.interpreted_preferences,
        totalMatches: res.total_matches,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      // Graceful fallback to client-side match search if network or backend AI server is busy
      const lower = text.toLowerCase();
      const matched = matches.filter(m => {
        const prof = (m.profession || (m as any).occupation || '').toLowerCase();
        const loc = `${m.city || ''} ${m.state || ''}`.toLowerCase();
        const edu = (m.education || '').toLowerCase();
        return prof.includes(lower) || loc.includes(lower) || edu.includes(lower) || lower.includes(prof);
      });

      const fallbackList = matched.length > 0 ? matched : matches.slice(0, 3);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: matched.length > 0
          ? `Found ${matched.length} candidate${matched.length > 1 ? 's' : ''} in your recommendations matching your search:`
          : `Here are our highest recommended profiles for you:`,
        matchedProfiles: fallbackList,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. Floating "Ask AI" Button at Right-Bottom
      ────────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-full text-white font-bold text-sm shadow-[0_8px_28px_rgba(139,30,63,0.35)] hover:shadow-[0_10px_36px_rgba(212,175,55,0.45)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border-2 border-amber-300/80 ${
            isOpen
              ? 'bg-gradient-to-r from-stone-800 to-stone-900 border-stone-600'
              : 'bg-gradient-to-r from-[#8B1E3F] via-[#A82A4D] to-[#B48128]'
          }`}
          title={isOpen ? 'Close Ask AI' : 'Ask AI Match Assistant'}
          aria-label="Ask AI Assistant"
        >
          {isOpen ? (
            <>
              <X className="h-4 w-4 stroke-[2.5]" />
              <span>Close AI</span>
            </>
          ) : (
            <>
              <div className="relative flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-amber-200 fill-amber-300 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
                </span>
              </div>
              <span className="tracking-wide">Ask AI</span>
            </>
          )}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. Ask AI Matchmaker Interactive Input / Chat Dialog Box
      ────────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-22 right-4 sm:right-6 z-50 w-[92vw] sm:w-[410px] h-[550px] max-h-[82vh] bg-gradient-to-b from-white via-[#FFF8FA] to-[#FDF5F8] backdrop-blur-md rounded-2xl shadow-[0_20px_60px_rgba(139,30,63,0.22)] border-2 border-amber-300/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header (Royal Gold & Deep Rose Luxury Theme) */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#8B1E3F] via-[#A82A4D] to-[#B48128] text-white flex items-center justify-between shadow-md shrink-0 border-b border-amber-200/30">
            <div className="flex items-center gap-2.5">
              <div className="relative h-10 w-10 rounded-full bg-white/20 border border-amber-200/50 flex items-center justify-center shrink-0 shadow-inner">
                <Bot className="h-5 w-5 text-amber-200" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#8B1E3F]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm leading-tight truncate">Ask AI Matchmaker</h3>
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-amber-300 text-stone-900 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-amber-100/90 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span>Online • Instant Match & Compatibility Answers</span>
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full bg-black/15 hover:bg-black/30 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Conversation Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 font-sans">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Chat Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs relative ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-[#8B1E3F] to-[#A82A4D] text-white rounded-tr-xs shadow-[0_2px_8px_rgba(139,30,63,0.25)]'
                      : 'bg-white text-stone-800 rounded-tl-xs border border-rose-100/90 shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  
                  {/* Message Timestamp */}
                  <span className={`block text-[9px] mt-1 text-right ${msg.sender === 'user' ? 'text-rose-200' : 'text-stone-400'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {/* AI Interpreted Preferences Tag Chips */}
                {msg.interpretedPreferences && Object.keys(msg.interpretedPreferences).length > 0 && (
                  <div className="w-full mt-1.5 pl-1 flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                      <Sliders className="h-3 w-3 text-amber-600" /> Filtered:
                    </span>
                    {Object.entries(msg.interpretedPreferences).map(([key, val]) => (
                      val ? (
                        <span key={key} className="text-[9.5px] bg-amber-50 text-amber-900 border border-amber-200/80 px-1.5 py-0.5 rounded-md font-medium">
                          {key.replace(/_/g, ' ')}: <strong className="font-bold">{String(val)}</strong>
                        </span>
                      ) : null
                    ))}
                  </div>
                )}

                {/* Candidate Mini Cards from /api/matching/ask-ai/ */}
                {msg.aiMatches && msg.aiMatches.length > 0 && (
                  <div className="w-full mt-2 space-y-1.5 pl-1">
                    {msg.aiMatches.map(match => (
                      <div
                        key={match.profile_id}
                        onClick={() => {
                          setIsOpen(false);
                          navigate(`/profile/${match.profile_id}`);
                        }}
                        className="p-2.5 bg-white hover:bg-rose-50/50 rounded-xl border border-amber-300/80 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-stone-900 group-hover:text-[#8B1E3F] transition-colors truncate">
                            {match.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md">
                              {Math.round(match.match_percentage)}% Match
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 text-stone-400 group-hover:text-[#8B1E3F] shrink-0" />
                          </div>
                        </div>

                        <p className="text-[10.5px] text-stone-600 truncate">
                          {[match.age ? `${match.age} yrs` : null, match.profession, match.education, match.location].filter(Boolean).join(' • ')}
                        </p>

                        {match.matched_fields && match.matched_fields.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {match.matched_fields.slice(0, 4).map((f, idx) => (
                              <span key={idx} className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Candidate Mini Cards inside AI response if fallback */}
                {msg.matchedProfiles && msg.matchedProfiles.length > 0 && (
                  <div className="w-full mt-2 space-y-1.5 pl-1">
                    {msg.matchedProfiles.map(profile => {
                      const matchId = profile.user_id || (profile as any).id;
                      const score = profile.match_percentage || (profile as any).compatibility_score;
                      return (
                        <div
                          key={matchId}
                          onClick={() => {
                            setIsOpen(false);
                            navigate(`/profile/${matchId}`);
                          }}
                          className="flex items-center justify-between gap-2 p-2.5 bg-white hover:bg-rose-50/50 rounded-xl border border-amber-300/70 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-stone-900 group-hover:text-[#8B1E3F] transition-colors truncate">
                                {profile.first_name} {profile.last_name}
                              </span>
                              {score && (
                                <span className="text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded-md">
                                  {score}%
                                </span>
                              )}
                              {profile.is_verified && (
                                <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] text-stone-500 truncate mt-0.5">
                              {[profile.age ? `${profile.age} yrs` : null, profile.profession || (profile as any).occupation, profile.city].filter(Boolean).join(' • ')}
                            </p>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-stone-400 group-hover:text-[#8B1E3F] shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* AI Typing Animation */}
            {isTyping && (
              <div className="flex items-center gap-1.5 bg-white border border-rose-100 rounded-2xl rounded-tl-xs px-3 py-2 w-16 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8B1E3F] animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#8B1E3F] animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#B48128] animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-rose-50/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 border-t border-rose-100/70">
            {quickPrompts.map(prompt => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSendMessage(prompt.replace(/^[^\w]+/, '').trim())}
                className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-amber-50 text-stone-700 hover:text-[#8B1E3F] text-[10.5px] font-semibold rounded-full border border-stone-200 hover:border-amber-300 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box Area */}
          <div className="p-2.5 bg-white border-t border-rose-100 flex items-center gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI (e.g. Find engineers in Bangalore)..."
              className="flex-1 bg-stone-50 focus:bg-white text-xs text-stone-900 placeholder:text-stone-400 px-3.5 py-2.5 rounded-full border border-stone-200 focus:border-[#8B1E3F] focus:outline-none transition-colors shadow-inner"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputQuery.trim()}
              className="h-9 w-9 rounded-full bg-gradient-to-r from-[#8B1E3F] to-[#B48128] hover:from-[#761734] hover:to-[#9E6E1F] disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer shrink-0 active:scale-95"
              title="Send Message"
            >
              <Send className="h-4 w-4 ml-0.5" />
            </button>
          </div>

        </div>
      )}
    </>
  );
};

// Also export alias AskAIAssistant
export const AskAIAssistant = WhatsAppAIAssistant;
