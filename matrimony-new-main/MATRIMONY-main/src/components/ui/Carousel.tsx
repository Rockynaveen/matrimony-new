import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface CarouselProps {
  children: React.ReactNode;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
  itemsPerPage?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export const Carousel: React.FC<CarouselProps> = ({
  children,
  autoPlay = true,
  autoPlayInterval = 4500,
  className,
  itemsPerPage
}) => {
  const childrenArray = React.Children.toArray(children);
  const mobileCount = itemsPerPage?.mobile ?? 1;
  const tabletCount = itemsPerPage?.tablet ?? 2;
  const desktopCount = itemsPerPage?.desktop ?? 3;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [perPage, setPerPage] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const updatePerPage = () => {
      if (typeof window === 'undefined') return;
      const width = window.innerWidth;
      if (width < 640) {
        setPerPage(mobileCount);
      } else if (width < 1024) {
        setPerPage(tabletCount);
      } else {
        setPerPage(desktopCount);
      }
    };

    updatePerPage();
    window.addEventListener('resize', updatePerPage);
    return () => window.removeEventListener('resize', updatePerPage);
  }, [mobileCount, tabletCount, desktopCount]);

  const safePerPage = Math.max(1, perPage);
  const maxIndex = Math.max(0, childrenArray.length - safePerPage);

  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (!autoPlay || isPaused || maxIndex <= 0) return;
    const timer = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [autoPlay, autoPlayInterval, isPaused, nextSlide, maxIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 40) {
      nextSlide();
    } else if (diff < -40) {
      prevSlide();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  if (childrenArray.length === 0) return null;

  const totalDots = maxIndex + 1;
  const itemWidthPercent = 100 / safePerPage;

  return (
    <div
      className={clsx('relative group w-full overflow-hidden py-4 select-none', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Viewport */}
      <div className="overflow-hidden px-1">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${currentIndex * itemWidthPercent}%)`
          }}
        >
          {childrenArray.map((child, index) => (
            <div
              key={index}
              className="shrink-0 px-3 transition-all duration-300"
              style={{
                width: `${itemWidthPercent}%`
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {totalDots > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            type="button"
            className="absolute left-1 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/95 backdrop-blur-md border border-stone-200 shadow-xl flex items-center justify-center text-stone-700 hover:bg-[#8B1E3F] hover:text-white hover:border-[#8B1E3F] transition-all duration-300 z-20 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/95 backdrop-blur-md border border-stone-200 shadow-xl flex items-center justify-center text-stone-700 hover:bg-[#8B1E3F] hover:text-white hover:border-[#8B1E3F] transition-all duration-300 z-20 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {totalDots > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          {Array.from({ length: totalDots }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={clsx(
                'h-2.5 rounded-full transition-all duration-300 cursor-pointer',
                currentIndex === idx
                  ? 'w-8 bg-[#8B1E3F] shadow-sm'
                  : 'w-2.5 bg-stone-300 hover:bg-stone-400'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
