import React from 'react';
import { Loader2 } from 'lucide-react';

interface DotsLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Clean & Minimalist 3-Dot Staggered Pulsing Loader
 */
export const DotsLoader: React.FC<DotsLoaderProps> = ({
  size = 'md',
  className = ''
}) => {
  const dotSizes = {
    sm: 'h-1.5 w-1.5 gap-1',
    md: 'h-2.5 w-2.5 gap-1.5',
    lg: 'h-3.5 w-3.5 gap-2',
    xl: 'h-4 w-4 gap-2.5'
  };

  return (
    <div className={`inline-flex items-center justify-center ${dotSizes[size].split(' ').pop()} ${className}`}>
      <span className={`${dotSizes[size].split(' ')[0]} ${dotSizes[size].split(' ')[1]} rounded-full bg-[#8B1E3F] pulse-dot-1 inline-block`} />
      <span className={`${dotSizes[size].split(' ')[0]} ${dotSizes[size].split(' ')[1]} rounded-full bg-[#B3395B] pulse-dot-2 inline-block`} />
      <span className={`${dotSizes[size].split(' ')[0]} ${dotSizes[size].split(' ')[1]} rounded-full bg-[#D4AF37] pulse-dot-3 inline-block`} />
    </div>
  );
};

interface LoadingScreenProps {
  title?: string;
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * Minimalist, Clean Loading Screen & Section Loader
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  title,
  message = 'Loading...',
  fullScreen = false,
  className = ''
}) => {
  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xs p-6 ${className}`}>
        <div className="flex flex-col items-center text-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#8B1E3F] animate-spin" />
          {title && <h3 className="font-serif font-bold text-base text-stone-900">{title}</h3>}
          <p className="text-xs text-stone-500 font-medium">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[220px] w-full flex flex-col items-center justify-center p-6 text-center space-y-3 ${className}`}>
      <DotsLoader size="md" />
      {title && <h4 className="font-serif font-bold text-sm text-stone-900">{title}</h4>}
      <p className="text-xs text-stone-500 font-medium">{message}</p>
    </div>
  );
};
