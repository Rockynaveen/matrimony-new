import React from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'danger';
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
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none rounded-xl';

  const variants = {
    default: 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20',
    primary: 'bg-gradient-to-r from-[#8B1E3F] to-[#C44569] text-white hover:opacity-95 shadow-md shadow-[#8B1E3F]/25 hover:shadow-lg hover:shadow-[#8B1E3F]/35',
    secondary: 'bg-[#F5ECE5] text-[#8B1E3F] hover:bg-[#EADBD1] font-semibold',
    outline: 'border border-[#E8DDD5] bg-white text-foreground hover:bg-[#FFF9F5] hover:border-primary/50 hover:text-primary shadow-sm',
    ghost: 'text-foreground hover:bg-muted hover:text-primary',
    gold: 'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-white hover:brightness-105 shadow-md shadow-[#D4AF37]/30 font-semibold',
    danger: 'bg-destructive text-white hover:bg-destructive/90 shadow-sm'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-4 py-2.5 gap-2 h-10',
    lg: 'text-base px-6 py-3.5 gap-2.5 h-12 font-semibold',
    icon: 'h-10 w-10 p-2'
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
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
