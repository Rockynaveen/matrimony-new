import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export type AnimationVariant = 'fade-in' | 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'zoom-out';

interface ScrollRevealProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  variant?: AnimationVariant;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  variant,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 35,
  once = true,
  className = '',
  ...props
}) => {
  // Map variant shortcuts if provided
  const activeDirection = variant === 'fade-up' ? 'up' :
    variant === 'fade-down' ? 'down' :
    variant === 'fade-left' ? 'left' :
    variant === 'fade-right' ? 'right' :
    variant === 'fade-in' ? 'none' : direction;

  const initialScale = variant === 'zoom-in' ? 0.9 : variant === 'zoom-out' ? 1.08 : (activeDirection === 'none' ? 0.98 : 1);

  const getInitialPosition = () => {
    switch (activeDirection) {
      case 'up':
        return { y: distance, x: 0 };
      case 'down':
        return { y: -distance, x: 0 };
      case 'left':
        return { x: distance, y: 0 };
      case 'right':
        return { x: -distance, y: 0 };
      case 'none':
      default:
        return { x: 0, y: 0 };
    }
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...getInitialPosition(),
        scale: initialScale
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1
      }}
      viewport={{ once, margin: '-40px' }}
      transition={{
        duration,
        delay,
        ease: [0.215, 0.61, 0.355, 1]
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/* Dedicated Preset Convenience Components */
export const FadeIn: React.FC<Omit<ScrollRevealProps, 'variant' | 'direction'>> = (props) => (
  <ScrollReveal variant="fade-in" {...props} />
);

export const FadeUp: React.FC<Omit<ScrollRevealProps, 'variant' | 'direction'>> = (props) => (
  <ScrollReveal variant="fade-up" {...props} />
);

export const FadeDown: React.FC<Omit<ScrollRevealProps, 'variant' | 'direction'>> = (props) => (
  <ScrollReveal variant="fade-down" {...props} />
);

export const FadeLeft: React.FC<Omit<ScrollRevealProps, 'variant' | 'direction'>> = (props) => (
  <ScrollReveal variant="fade-left" {...props} />
);

export const FadeRight: React.FC<Omit<ScrollRevealProps, 'variant' | 'direction'>> = (props) => (
  <ScrollReveal variant="fade-right" {...props} />
);

export const ZoomIn: React.FC<Omit<ScrollRevealProps, 'variant' | 'direction'>> = (props) => (
  <ScrollReveal variant="zoom-in" {...props} />
);
