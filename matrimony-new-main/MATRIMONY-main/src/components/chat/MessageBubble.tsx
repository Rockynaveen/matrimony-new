import React from 'react';
import { CheckCheck, Check, Trash2, FileText, Download } from 'lucide-react';
import { AudioBubblePlayer } from './AudioBubblePlayer';
import type { ChatMessageOut } from '../../types/chat.types';

interface MessageBubbleProps {
  message: ChatMessageOut;
  isMe: boolean;
  formatTimestamp: (ts?: string | number) => string;
  onOpenMediaModal: (mediaUrl: string, mediaType: 'image' | 'video') => void;
  onDeleteForMe?: (msgId: string) => void;
  onDeleteForEveryone?: (msgId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  formatTimestamp,
  onOpenMediaModal,
  onDeleteForMe,
  onDeleteForEveryone
}) => {
  const msgType = message.message_type || 'text';
  const isAudio = msgType === 'voice' || msgType === 'audio' || Boolean(message.voice_url || message.audio_url);
  const isImage = msgType === 'image' || Boolean(message.image_url);
  const isVideo = msgType === 'video' || Boolean(message.video_url);
  const isDoc = msgType === 'document' || Boolean(message.file_url);

  const mediaUrl = message.image_url || message.video_url || message.file_url || message.voice_url || message.audio_url || '';

  return (
    <div className={`flex flex-col group relative ${isMe ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-3 shadow-xs relative transition-all ${
          isMe
            ? 'bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-tr-xs'
            : 'bg-white border border-rose-100 text-gray-900 rounded-tl-xs'
        }`}
      >
        {/* Render Audio Voice Note */}
        {isAudio && mediaUrl && (
          <AudioBubblePlayer audioUrl={mediaUrl} isMe={isMe} />
        )}

        {/* Render Image Attachment */}
        {isImage && mediaUrl && (
          <div
            onClick={() => onOpenMediaModal(mediaUrl, 'image')}
            className="cursor-pointer overflow-hidden rounded-xl mb-1.5 border border-black/10 group/img relative"
          >
            <img
              src={mediaUrl}
              alt="Attachment"
              className="max-h-60 w-full object-cover transition-transform group-hover/img:scale-105"
            />
          </div>
        )}

        {/* Render Video Attachment */}
        {isVideo && mediaUrl && (
          <div
            onClick={() => onOpenMediaModal(mediaUrl, 'video')}
            className="cursor-pointer overflow-hidden rounded-xl mb-1.5 border border-black/10 relative group/vid"
          >
            <video src={mediaUrl} className="max-h-60 w-full object-cover" />
          </div>
        )}

        {/* Render Document Attachment */}
        {isDoc && mediaUrl && (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 p-2 rounded-xl mb-1 text-xs ${
              isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-rose-50 hover:bg-rose-100'
            }`}
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span className="truncate flex-1 font-medium">Document Attachment</span>
            <Download className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
          </a>
        )}

        {/* Render Text Content */}
        {message.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}

        {/* Footer Timestamp & Seen Indicator */}
        <div
          className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
            isMe ? 'text-rose-100' : 'text-gray-400'
          }`}
        >
          <span>{formatTimestamp(message.timestamp || message.created_at)}</span>
          {isMe && (
            <span>
              {message.is_seen || message.read ? (
                <CheckCheck className="w-3.5 h-3.5 text-rose-200" />
              ) : (
                <Check className="w-3.5 h-3.5 opacity-70" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
