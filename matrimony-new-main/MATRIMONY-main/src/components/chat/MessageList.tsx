import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { DotsLoader } from '../ui/LoadingScreen';
import type { ChatMessageOut } from '../../types/chat.types';

interface MessageListProps {
  messages: ChatMessageOut[];
  currentUserId: string;
  isLoading?: boolean;
  formatTimestamp: (ts?: string | number) => string;
  onOpenMediaModal: (mediaUrl: string, mediaType: 'image' | 'video') => void;
  onDeleteForMe?: (msgId: string) => void;
  onDeleteForEveryone?: (msgId: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  isLoading,
  formatTimestamp,
  onOpenMediaModal,
  onDeleteForMe,
  onDeleteForEveryone
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-rose-50/20">
        <DotsLoader />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-rose-50/20 text-gray-500">
        <div className="w-16 h-16 rounded-full bg-rose-100/60 flex items-center justify-center text-rose-500 mb-3">
          💬
        </div>
        <h3 className="font-bold text-gray-900 mb-1">No messages yet</h3>
        <p className="text-sm max-w-xs text-gray-500">
          Say hello! Send a message or a voice note to start the conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-rose-50/20">
      {messages.map((msg, index) => {
        const isMe = String(msg.sender_id) === String(currentUserId) || msg.sender_id === 'me';
        return (
          <MessageBubble
            key={msg.id || `msg-${index}`}
            message={msg}
            isMe={isMe}
            formatTimestamp={formatTimestamp}
            onOpenMediaModal={onOpenMediaModal}
            onDeleteForMe={onDeleteForMe}
            onDeleteForEveryone={onDeleteForEveryone}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
