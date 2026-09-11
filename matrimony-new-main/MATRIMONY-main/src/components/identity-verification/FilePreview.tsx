import React, { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, X, Check } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface FilePreviewProps {
  file: File | null;
  onRemove: () => void;
  label?: string;
  isImage?: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onRemove,
  label,
  isImage = false
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  if (!file) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="flex items-center justify-between p-3.5 bg-slate-50/90 border border-slate-200 rounded-xl transition-all hover:bg-slate-50">
      <div className="flex items-center gap-3 min-w-0 pr-2">
        {previewUrl ? (
          <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-slate-300 shrink-0 shadow-2xs">
            <img
              src={previewUrl}
              alt={file.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-12 w-12 rounded-lg bg-rose-50 border border-rose-200 text-[#8B1E3F] flex items-center justify-center shrink-0">
            {isPdf ? (
              <FileText className="h-6 w-6 text-red-600" />
            ) : isImage ? (
              <ImageIcon className="h-6 w-6 text-[#8B1E3F]" />
            ) : (
              <FileText className="h-6 w-6 text-slate-600" />
            )}
          </div>
        )}

        <div className="min-w-0">
          {label && (
            <span className="text-[11px] font-medium text-black/60 uppercase tracking-wider block">
              {label}
            </span>
          )}
          <p className="text-xs font-medium text-black truncate max-w-[200px] sm:max-w-xs" title={file.name}>
            {file.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-black/70 font-normal">
              {formatFileSize(file.size)}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 uppercase font-normal text-black border-stone-300">
              {isPdf ? 'PDF' : file.type.split('/')[1] || 'File'}
            </Badge>
            <span className="inline-flex items-center text-[10px] font-normal text-emerald-700">
              <Check className="h-3 w-3 mr-0.5 stroke-[2]" /> Ready
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
        title="Remove file"
        aria-label="Remove file"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
