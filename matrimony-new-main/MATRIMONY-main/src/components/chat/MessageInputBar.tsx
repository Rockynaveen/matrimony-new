import React, { useState } from 'react';
import { Send, Mic, Paperclip } from 'lucide-react';
import { Button } from '../ui/Button';
import { VoiceRecorder } from './VoiceRecorder';
import { AttachmentPicker } from './AttachmentPicker';

interface MessageInputBarProps {
  onSendMessage: (text: string) => void;
  onSendVoice: (audioBlob: Blob) => void;
  onSendImage: (file: File) => void;
  onSendVideo: (file: File) => void;
  onSendDocument: (file: File) => void;
  isSending?: boolean;
}

export const MessageInputBar: React.FC<MessageInputBarProps> = ({
  onSendMessage,
  onSendVoice,
  onSendImage,
  onSendVideo,
  onSendDocument,
  isSending
}) => {
  const [text, setText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (isRecordingVoice) {
    return (
      <div className="p-3 border-t border-rose-100 bg-white">
        <VoiceRecorder
          onSendVoice={(blob) => {
            onSendVoice(blob);
            setIsRecordingVoice(false);
          }}
          onCancel={() => setIsRecordingVoice(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-rose-100 bg-white relative">
      {isAttachmentOpen && (
        <div className="absolute bottom-16 left-4 z-20 shadow-xl rounded-2xl">
          <AttachmentPicker
            onSelectImage={(file) => {
              onSendImage(file);
              setIsAttachmentOpen(false);
            }}
            onSelectVideo={(file) => {
              onSendVideo(file);
              setIsAttachmentOpen(false);
            }}
            onSelectDocument={(file) => {
              onSendDocument(file);
              setIsAttachmentOpen(false);
            }}
            onClose={() => setIsAttachmentOpen(false)}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsAttachmentOpen(!isAttachmentOpen)}
          className="text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl p-2"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsRecordingVoice(true)}
          className="text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl p-2"
          title="Record voice note"
        >
          <Mic className="w-5 h-5" />
        </Button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-colors"
        />

        <Button
          type="submit"
          disabled={!text.trim() || isSending}
          className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl px-4 py-2.5 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};
