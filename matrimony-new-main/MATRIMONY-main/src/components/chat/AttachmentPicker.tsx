import React, { useRef } from 'react';
import { Image as ImageIcon, Video, FileText, Paperclip, Sparkles, X } from 'lucide-react';

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
    <div className="absolute bottom-16 left-4 bg-white/95 backdrop-blur-xl border border-stone-200 shadow-2xl rounded-3xl p-3 z-50 flex flex-col gap-1.5 w-56 animate-fade-up border-stone-200/90">
      <div className="flex items-center justify-between px-2 py-1 pb-2 border-b border-stone-100">
        <span className="text-[11px] font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-[#8B1E3F]" /> Attach Media
        </span>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

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
        className="flex items-center gap-3 p-2.5 rounded-2xl text-xs font-bold text-stone-800 hover:bg-emerald-50 hover:text-emerald-900 transition-all border border-transparent hover:border-emerald-200/60"
      >
        <div className="h-7 w-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <ImageIcon className="h-4 w-4" />
        </div>
        <span>Send Photo / Image</span>
      </button>

      <button
        type="button"
        onClick={() => videoInputRef.current?.click()}
        className="flex items-center gap-3 p-2.5 rounded-2xl text-xs font-bold text-stone-800 hover:bg-purple-50 hover:text-purple-900 transition-all border border-transparent hover:border-purple-200/60"
      >
        <div className="h-7 w-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
          <Video className="h-4 w-4" />
        </div>
        <span>Send Video Clip</span>
      </button>

      <button
        type="button"
        onClick={() => docInputRef.current?.click()}
        className="flex items-center gap-3 p-2.5 rounded-2xl text-xs font-bold text-stone-800 hover:bg-blue-50 hover:text-blue-900 transition-all border border-transparent hover:border-blue-200/60"
      >
        <div className="h-7 w-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4" />
        </div>
        <span>Send PDF / Doc</span>
      </button>

      <button
        type="button"
        onClick={() => genericInputRef.current?.click()}
        className="flex items-center gap-3 p-2.5 rounded-2xl text-xs font-bold text-stone-800 hover:bg-amber-50 hover:text-amber-900 transition-all border border-transparent hover:border-amber-200/60"
      >
        <div className="h-7 w-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Paperclip className="h-4 w-4" />
        </div>
        <span>General File</span>
      </button>
    </div>
  );
};
