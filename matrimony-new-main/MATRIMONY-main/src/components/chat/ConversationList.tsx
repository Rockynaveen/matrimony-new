import React from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { MatchAvatar } from '../ui/MatchAvatar';
import { extractNameFromEmail } from '../../context/AppContext';

export interface ConversationItem {
  user_id: string;
  user_name?: string;
  name?: string;
  profile_photo?: string;
  avatar?: string;
  last_message?: string;
  unread_count?: number;
  is_online?: boolean;
  updated_at?: string | number;
  verified?: boolean;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  activeUserId: string | null;
  onSelectUser: (userId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  formatTimestamp: (ts?: string | number) => string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeUserId,
  onSelectUser,
  searchQuery,
  onSearchChange,
  formatTimestamp
}) => {
  const filtered = conversations.filter((c) => {
    const name = c.user_name || c.name || extractNameFromEmail(c.user_id);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-full md:w-80 lg:w-96 border-r border-rose-100 flex flex-col h-full bg-white">
      {/* Sidebar Header & Search */}
      <div className="p-4 border-b border-rose-100 space-y-3">
        <h2 className="text-xl font-bold text-gray-900 font-serif">Messages</h2>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search messages & contacts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-rose-50/50 border border-rose-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-colors"
          />
        </div>
      </div>

      {/* Conversation Cards List */}
      <div className="flex-1 overflow-y-auto divide-y divide-rose-50">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">No conversations found</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = item.user_id === activeUserId;
            const displayName = item.user_name || item.name || extractNameFromEmail(item.user_id);
            const avatarUrl = item.profile_photo || item.avatar;
            const unread = item.unread_count || 0;

            return (
              <button
                key={item.user_id}
                onClick={() => onSelectUser(item.user_id)}
                className={`w-full p-4 flex items-center gap-3 text-left transition-colors relative ${
                  isSelected
                    ? 'bg-rose-50/80 border-l-4 border-rose-600'
                    : 'hover:bg-rose-50/40'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <MatchAvatar
                    src={avatarUrl}
                    name={displayName}
                    size="md"
                    className="rounded-full ring-2 ring-rose-100"
                  />
                  {item.is_online && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate flex items-center gap-1">
                      {displayName}
                      {item.verified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 inline" />
                      )}
                    </h3>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      {formatTimestamp(item.updated_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500 truncate">
                      {item.last_message || 'Tap to start conversation'}
                    </p>
                    {unread > 0 && (
                      <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
