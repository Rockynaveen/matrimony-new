import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'outline-white' | 'ghost' | 'gold' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none rounded-xl cursor-pointer';

  const variants = {
    // Royal Burgundy Brand Primary Variant
    default: 'bg-[#8B1E3F] text-white hover:bg-[#721733] hover:text-white shadow-md shadow-[#8B1E3F]/25 border border-[#8B1E3F]/30',
    primary: 'bg-gradient-to-r from-[#8B1E3F] via-[#A0234A] to-[#8B1E3F] text-white hover:from-[#721733] hover:via-[#8B1E3F] hover:to-[#721733] hover:text-white shadow-md shadow-[#8B1E3F]/25 hover:shadow-lg hover:shadow-[#8B1E3F]/35 border border-[#8B1E3F]/30',
    
    // Warm Ivory & Burgundy Brand Secondary Variant
    secondary: 'bg-[#F7EFE9] text-[#8B1E3F] hover:bg-[#8B1E3F] hover:text-white hover:border-[#8B1E3F] border border-[#EADBCE] font-bold shadow-2xs',
    
    // Crisp White + Burgundy Brand Outline Variant
    outline: 'border-2 border-[#8B1E3F] bg-white text-[#8B1E3F] hover:bg-[#8B1E3F] hover:text-white hover:border-[#8B1E3F] shadow-xs font-bold',
    
    // Dark Backdrop Brand Outline Variant (Hero & Dark Cards) -> Hovers to white background with Brand Burgundy text!
    'outline-white': 'border-2 border-white/60 bg-white/10 text-white hover:bg-white hover:text-[#8B1E3F] hover:border-white backdrop-blur-md shadow-md font-bold',
    
    // Minimal Theme Ghost
    ghost: 'text-stone-700 hover:bg-[#8B1E3F]/10 hover:text-[#8B1E3F] font-bold',
    
    // Luxury Metallic Gold Logo Accent Variant
    gold: 'bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#AA7C11] text-[#2C0A15] hover:brightness-105 hover:text-[#2C0A15] shadow-md shadow-[#D4AF37]/25 font-extrabold border border-[#D4AF37]/50',
    
    // Rose Red Brand Destructive Variant
    danger: 'bg-[#9E1C27] text-white hover:bg-[#7D141C] hover:text-white shadow-sm font-bold border border-[#9E1C27]'
  };

  const sizes = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 h-9',
    md: 'text-sm px-4 py-2.5 gap-2 h-10',
    lg: 'text-base px-6 py-3.5 gap-2.5 h-12 font-bold',
    icon: 'h-10 w-10 p-2'
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};
