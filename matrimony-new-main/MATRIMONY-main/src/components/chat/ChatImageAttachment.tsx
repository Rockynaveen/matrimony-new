import React, { useState, useEffect } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { chatApi, formatMediaUrl } from '../../api/chatApi';

interface ChatImageAttachmentProps {
  roomId?: number | string;
  messageId?: number | string;
  src?: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  onResolvedUrl?: (url: string) => void;
}

export const ChatImageAttachment: React.FC<ChatImageAttachmentProps> = ({
  roomId,
  messageId,
  src,
  alt = 'Chat Image',
  className = '',
  onClick,
  onResolvedUrl
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    const resolveImage = async () => {
      setIsError(false);
      const cleanSrc = src ? formatMediaUrl(src) || src : '';

      // Case 1: Local blob URL or base64 data URL
      if (cleanSrc.startsWith('blob:') || cleanSrc.startsWith('data:')) {
        setResolvedSrc(cleanSrc);
        setIsLoading(false);
        onResolvedUrl?.(cleanSrc);
        return;
      }

      // Case 2: Requires authenticated GET /api/chat/send-image endpoint
      const isSendImageEndpoint = cleanSrc.includes('/chat/send-image') || (!cleanSrc && roomId && messageId);
      if (isSendImageEndpoint && roomId && messageId) {
        setIsLoading(true);
        try {
          const blobUrl = await chatApi.fetchImageBlobUrl(roomId, messageId);
          if (!isCancelled && blobUrl) {
            setResolvedSrc(blobUrl);
            setIsLoading(false);
            onResolvedUrl?.(blobUrl);
            return;
          }
        } catch (err) {
          console.warn('[ChatImageAttachment] Authenticated fetch failed, falling back to cleanSrc:', err);
        }
      }

      // Case 3: Standard external URL or direct Railway media URL
      if (cleanSrc) {
        setResolvedSrc(cleanSrc);
        setIsLoading(false);
        onResolvedUrl?.(cleanSrc);
      } else if (roomId && messageId) {
        // Fallback to raw endpoint URL
        const rawUrl = chatApi.getImageMessageUrl(roomId, messageId);
        setResolvedSrc(rawUrl);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setIsError(true);
      }
    };

    resolveImage();

    return () => {
      isCancelled = true;
    };
  }, [src, roomId, messageId]);

  const handleImageError = async () => {
    // If standard image tag error fired, try authenticated blob fetch if not already done
    if (roomId && messageId && (!resolvedSrc || !resolvedSrc.startsWith('blob:'))) {
      try {
        setIsLoading(true);
        const blobUrl = await chatApi.fetchImageBlobUrl(roomId, messageId);
        if (blobUrl) {
          setResolvedSrc(blobUrl);
          setIsLoading(false);
          setIsError(false);
          onResolvedUrl?.(blobUrl);
          return;
        }
      } catch (err) {
        console.warn('[ChatImageAttachment] Retry with blob fetch also failed:', err);
      }
    }
    setIsLoading(false);
    setIsError(true);
  };

  if (isLoading) {
    return (
      <div className={`min-h-[160px] w-full flex flex-col items-center justify-center bg-stone-100/80 rounded-2xl text-stone-400 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-[#8B1E3F] mb-1.5" />
        <span className="text-[11px] font-medium text-stone-500">Loading photo...</span>
      </div>
    );
  }

  if (isError || !resolvedSrc) {
    return (
      <div className={`min-h-[100px] w-full flex flex-col items-center justify-center bg-stone-100 rounded-2xl p-4 text-stone-400 ${className}`}>
        <ImageOff className="h-6 w-6 mb-1 text-stone-400" />
        <span className="text-[11px] font-medium text-stone-500">Photo unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleImageError}
      onClick={onClick}
    />
  );
};

export default ChatImageAttachment;
