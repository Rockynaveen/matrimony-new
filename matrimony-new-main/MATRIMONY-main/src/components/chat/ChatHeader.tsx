import React from 'react';
import { PhoneCall, Video, Info, ShieldCheck } from 'lucide-react';
import { MatchAvatar } from '../ui/MatchAvatar';
import { Button } from '../ui/Button';

interface ChatHeaderProps {
  name: string;
  avatar?: string;
  isOnline?: boolean;
  verified?: boolean;
  onStartAudioCall: () => void;
  onStartVideoCall: () => void;
  onToggleInfoPanel: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  name,
  avatar,
  isOnline,
  verified,
  onStartAudioCall,
  onStartVideoCall,
  onToggleInfoPanel
}) => {
  return (
    <div className="p-4 border-b border-rose-100 bg-white flex items-center justify-between shadow-xs z-10">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative">
          <MatchAvatar
            src={avatar}
            name={name}
            size="md"
            className="rounded-full ring-2 ring-rose-100"
          />
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          )}
        </div>

        <div className="min-w-0">
          <h2 className="font-bold text-gray-900 text-base truncate flex items-center gap-1.5">
            {name}
            {verified && (
              <ShieldCheck className="w-4 h-4 text-rose-600 flex-shrink-0 inline" />
            )}
          </h2>
          <p className="text-xs text-emerald-600 font-medium">
            {isOnline ? 'Online now' : 'Offline'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onStartAudioCall}
          className="text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
          title="Start Audio Call"
        >
          <PhoneCall className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onStartVideoCall}
          className="text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
          title="Start Video Call"
        >
          <Video className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleInfoPanel}
          className="text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
          title="Contact Info"
        >
          <Info className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
