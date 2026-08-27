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
}

export const isDummyImage = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase().trim();
  if (!lower) return true;
  return (
    lower.includes('unsplash.com') ||
    lower.includes('placeholder') ||
    lower.includes('dummy') ||
    lower.includes('ui-avatars.com')
  );
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
  alt
}) => {
  const [hasError, setHasError] = useState(false);

  const isPhotoValid = !isDummyImage(photo) && !hasError;
  const initialLetter = getFirstLetter(firstName, lastName, name, email);
  const fullNameStr = (
    firstName
      ? `${firstName} ${lastName || ''}`
      : name || email || 'User Profile'
  ).trim();

  // If photo is valid and hasn't errored, render real image
  if (isPhotoValid && photo) {
    return (
      <img
        src={photo}
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
        className={`rounded-full bg-gradient-to-br from-[#8B1E3F] via-[#721733] to-stone-900 text-[#D4AF37] font-extrabold flex items-center justify-center border border-amber-400/40 shadow-inner select-none ${className}`}
        title={fullNameStr}
      >
        <span className="leading-none drop-shadow-xs">{initialLetter}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br from-[#8B1E3F] via-[#6d1832] to-[#2A0813] flex flex-col items-center justify-center overflow-hidden select-none ${className}`}
      title={fullNameStr}
    >
      {/* Decorative ambient background accents */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#8B1E3F]/40 rounded-full blur-xl pointer-events-none" />

      {/* Initial Letter Badge */}
      <div className="relative z-10 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-stone-950/40 border-2 border-[#D4AF37]/50 shadow-xl backdrop-blur-xs">
        <span className="font-serif text-3xl sm:text-4xl font-extrabold text-[#D4AF37] drop-shadow-md">
          {initialLetter}
        </span>
      </div>

      <span className="relative z-10 mt-2 text-[11px] font-bold text-amber-200/90 tracking-wide uppercase max-w-[85%] truncate text-center px-2">
        {firstName || name || 'Member'}
      </span>
    </div>
  );
};
