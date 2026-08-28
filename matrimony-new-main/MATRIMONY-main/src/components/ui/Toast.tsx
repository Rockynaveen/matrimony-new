import React from 'react';
import { useUIStore } from '../../store/useUIStore';
import { Bell, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const Toast: React.FC = () => {
  const toastMessage = useUIStore((state) => state.toastMessage);
  const clearToast = useUIStore((state) => state.clearToast);

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, x: 20, scale: 0.9 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed top-24 right-6 z-[60] flex items-start gap-3.5 bg-white/95 text-stone-900 p-4 rounded-2xl shadow-2xl border border-[#8B1E3F]/20 backdrop-blur-xl max-w-sm w-full ring-1 ring-black/5"
        >
          {/* Toast Icon Badge */}
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#C44569] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#8B1E3F]/20 mt-0.5">
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="flex-1 space-y-0.5 pr-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8B1E3F] uppercase tracking-wider flex items-center gap-1">
                <Bell className="h-3 w-3" /> Vivah Notification
              </span>
            </div>
            <p className="text-xs font-semibold text-stone-800 leading-snug">
              {toastMessage}
            </p>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={clearToast}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
