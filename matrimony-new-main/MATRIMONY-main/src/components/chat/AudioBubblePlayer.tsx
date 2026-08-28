import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioBubblePlayerProps {
  audioUrl: string;
  isMe: boolean;
}

export const AudioBubblePlayer: React.FC<AudioBubblePlayerProps> = ({ audioUrl, isMe }) => {
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
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-3 py-1 px-2 min-w-[200px]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 ${
          isMe
            ? 'bg-white text-rose-600 hover:bg-rose-50'
            : 'bg-rose-600 text-white hover:bg-rose-700'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 space-y-1">
        <div className="h-1.5 bg-black/10 rounded-full overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all ${isMe ? 'bg-white' : 'bg-rose-600'}`}
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <div className={`flex justify-between text-[10px] font-mono ${isMe ? 'text-rose-100' : 'text-gray-500'}`}>
          <span>{formatSeconds(currentTime)}</span>
          <span className="flex items-center gap-1">
            <Volume2 className="w-2.5 h-2.5 opacity-70" />
            {formatSeconds(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
