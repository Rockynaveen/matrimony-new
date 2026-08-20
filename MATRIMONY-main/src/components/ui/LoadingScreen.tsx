import React from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface DotsLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  dotColorClass?: string;
}

/**
 * 3rd Loading State: 4 Staggered Pulsing Dots Loader
 * Matches Box 3 from ReactJS Loading Screen specification.
 */
export const DotsLoader: React.FC<DotsLoaderProps> = ({
  size = 'md',
  className = '',
  dotColorClass
}) => {
  const dotSizes = {
    sm: 'h-2 w-2 gap-1.5',
    md: 'h-3.5 w-3.5 gap-2.5',
    lg: 'h-5 w-5 gap-3.5',
    xl: 'h-7 w-7 gap-4'
  };

  const dotColors = [
    dotColorClass || 'bg-[#8B1E3F]', // Dark burgundy/rose
    dotColorClass || 'bg-[#B3395B]', // Medium rose
    dotColorClass || 'bg-[#D97706]', // Warm amber/gold
    dotColorClass || 'bg-[#FBBF24]'  // Bright gold
  ];

  return (
    <div className={`inline-flex items-center justify-center ${dotSizes[size].split(' ').pop()} ${className}`}>
      {dotColors.map((color, index) => (
        <span
          key={index}
          className={`${dotSizes[size].split(' ')[0]} ${dotSizes[size].split(' ')[1]} rounded-full ${color} pulse-dot-${index + 1} shadow-xs inline-block`}
        />
      ))}
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
 * Global Full-Page & Section Loading Screen
 * Displays the 3rd Loading State (Pulsing Dots Loader) with Vivah Matrimonial branding.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  title = 'Vivah Matrimonial',
  message = 'Loading verified profile matches...',
  fullScreen = false,
  className = ''
}) => {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF6F0]/95 backdrop-blur-md p-6'
    : 'min-h-[350px] w-full flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-xs rounded-3xl border border-stone-200/80 shadow-md my-4';

  return (
    <div className={`${containerClasses} ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center text-center space-y-5 max-w-sm mx-auto"
      >
        {/* Brand Icon Header */}
        <div className="relative">
          <div className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-[#8B1E3F] via-[#B3395B] to-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#8B1E3F]/20 border border-white/40">
            <Heart className="h-8 w-8 text-white fill-white animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 bg-amber-400 p-1 rounded-full text-amber-950 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 fill-current" />
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1">
          <h3 className="font-serif font-bold text-xl text-[#8B1E3F] tracking-wide">
            {title}
          </h3>
          {message && (
            <p className="text-xs text-stone-500 font-medium leading-relaxed">
              {message}
            </p>
          )}
        </div>

        {/* 3rd Loading State: 4 Staggered Pulsing Dots */}
        <div className="pt-2 pb-1">
          <DotsLoader size="lg" />
        </div>

        {/* Sub-badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-[10px] font-bold text-stone-600 uppercase tracking-widest">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Secured Matrimonial Network</span>
        </div>
      </motion.div>
    </div>
  );
};
