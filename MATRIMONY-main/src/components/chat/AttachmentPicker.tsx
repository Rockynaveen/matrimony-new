import React, { useRef } from 'react';
import { Image as ImageIcon, Video, FileText, Paperclip, Music } from 'lucide-react';

interface AttachmentPickerProps {
  onSelectImage: (file: File) => void;
  onSelectVideo: (file: File) => void;
  onSelectDocument: (file: File) => void;
  onSelectAttachment: (file: File) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  onSelectImage,
  onSelectVideo,
  onSelectDocument,
  onSelectAttachment,
  isOpen,
  onClose
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const genericInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    handler: (file: File) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handler(file);
      onClose();
    }
  };

  return (
    <div className="absolute bottom-16 left-4 bg-white border border-stone-200 shadow-xl rounded-2xl p-2 z-50 flex flex-col gap-1 w-48 animate-fade-up">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={e => handleFileChange(e, onSelectImage)}
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        className="hidden"
        onChange={e => handleFileChange(e, onSelectVideo)}
      />
      <input
        type="file"
        ref={docInputRef}
        accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
        className="hidden"
        onChange={e => handleFileChange(e, onSelectDocument)}
      />
      <input
        type="file"
        ref={genericInputRef}
        accept="*/*"
        className="hidden"
        onChange={e => handleFileChange(e, onSelectAttachment)}
      />

      <button
        type="button"
        onClick={() => imageInputRef.current?.click()}
        className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-[#8B1E3F] transition-colors"
      >
        <ImageIcon className="h-4 w-4 text-emerald-600" /> Send Image
      </button>

      <button
        type="button"
        onClick={() => videoInputRef.current?.click()}
        className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-[#8B1E3F] transition-colors"
      >
        <Video className="h-4 w-4 text-purple-600" /> Send Video
      </button>

      <button
        type="button"
        onClick={() => docInputRef.current?.click()}
        className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-[#8B1E3F] transition-colors"
      >
        <FileText className="h-4 w-4 text-blue-600" /> Send Document
      </button>

      <button
        type="button"
        onClick={() => genericInputRef.current?.click()}
        className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-[#8B1E3F] transition-colors"
      >
        <Paperclip className="h-4 w-4 text-amber-600" /> Attachment File
      </button>
    </div>
  );
};
