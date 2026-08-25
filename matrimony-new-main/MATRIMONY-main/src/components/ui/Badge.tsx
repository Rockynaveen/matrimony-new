import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'verified' | 'gold' | 'success' | 'danger';
}

export const Badge: React.FC<BadgeProps> = ({ children, className, variant = 'primary', ...props }) => {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none gap-1';
  
  const variants = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-[#8B1E3F]/10 text-[#8B1E3F] border border-[#8B1E3F]/20',
    secondary: 'bg-[#C44569]/10 text-[#C44569] border border-[#C44569]/20',
    outline: 'border border-border text-foreground',
    verified: 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs font-medium',
    gold: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold shadow-2xs',
    success: 'bg-emerald-100 text-emerald-800',
    danger: 'bg-red-100 text-red-700'
  };

  return (
    <div className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </div>
  );
};
