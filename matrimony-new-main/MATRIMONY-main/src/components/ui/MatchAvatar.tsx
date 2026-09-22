import React, { useState } from 'react';

interface MatchAvatarProps {
  photo?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
  variant?: 'card' | 'circle' | 'square';
  className?: string;
  imgClassName?: string;
  alt?: string;
  showName?: boolean;
}

export const isDummyImage = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase().trim();
  if (!lower) return true;
  return (
    lower.includes('placeholder') ||
    lower.includes('dummy') ||
    lower.includes('ui-avatars.com') ||
    lower.includes('recommended_bride') ||
    lower.includes('recommended_groom') ||
    lower.includes('default_avatar') ||
    lower.includes('avatar-placeholder') ||
    lower.includes('ananya_')
  );
};

export const formatPhotoUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (isDummyImage(trimmed)) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `https://matrimony-production-4b00.up.railway.app${cleanPath}`;
};

export const getFirstLetter = (
  firstName?: string | null,
  lastName?: string | null,
  name?: string | null,
  email?: string | null
): string => {
  if (firstName && firstName.trim()) {
    return firstName.trim().charAt(0).toUpperCase();
  }
  if (name && name.trim()) {
    return name.trim().charAt(0).toUpperCase();
  }
  if (lastName && lastName.trim()) {
    return lastName.trim().charAt(0).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().charAt(0).toUpperCase();
  }
  return 'U';
};

export const MatchAvatar: React.FC<MatchAvatarProps> = ({
  photo,
  firstName,
  lastName,
  name,
  email,
  variant = 'card',
  className = '',
  imgClassName = '',
  alt,
  showName = false
}) => {
  const [hasError, setHasError] = useState(false);

  const resolvedPhoto = formatPhotoUrl(photo);
  const isPhotoValid = !isDummyImage(resolvedPhoto) && !hasError;
  const initialLetter = getFirstLetter(firstName, lastName, name, email);
  const fullNameStr = (
    firstName
      ? `${firstName} ${lastName || ''}`
      : name || email || 'User Profile'
  ).trim();

  // If photo is valid and hasn't errored, render real image
  if (isPhotoValid && resolvedPhoto) {
    return (
      <img
        src={resolvedPhoto}
        alt={alt || fullNameStr}
        onError={() => setHasError(true)}
        className={
          imgClassName ||
          (variant === 'circle'
            ? 'h-full w-full object-cover rounded-full'
            : 'h-full w-full object-cover object-top')
        }
      />
    );
  }

  // Fallback: 1st Letter Avatar instead of dummy image
  if (variant === 'circle') {
    return (
      <div
        className={`rounded-full bg-gradient-to-b from-white via-[#FFF5F8] to-[#FCE7F0] text-[#B48128] font-extrabold flex items-center justify-center border border-amber-300/60 shadow-inner select-none ${className}`}
        title={fullNameStr}
      >
        <span className="leading-none drop-shadow-xs">{initialLetter}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-b from-white via-[#FFF5F8] to-[#FCE7F0] flex flex-col items-center justify-center overflow-hidden select-none ${className}`}
      title={fullNameStr}
    >
      {/* Decorative ambient background accents */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-300/25 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-300/25 rounded-full blur-xl pointer-events-none" />

      {/* Initial Letter Badge */}
      <div className="relative z-10 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 border-2 border-amber-300/80 shadow-[0_4px_20px_rgba(212,175,55,0.18)] backdrop-blur-xs">
        <span className="font-serif text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-[#8B1E3F] via-[#B48128] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-xs">
          {initialLetter}
        </span>
      </div>

      {showName && (
        <span className="relative z-10 mt-2 text-[11px] font-bold text-stone-700 tracking-wide uppercase max-w-[85%] truncate text-center px-2">
          {firstName || name || 'Member'}
        </span>
      )}
    </div>
  );
};
