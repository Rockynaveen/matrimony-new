import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

export interface AccordionItemData {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface AccordionProps {
  items: AccordionItemData[];
  defaultOpenId?: string;
  allowMultiple?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  defaultOpenId,
  allowMultiple = false
}) => {
  const [openIds, setOpenIds] = useState<string[]>(
    defaultOpenId ? [defaultOpenId] : [items[0]?.id || '']
  );

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else {
      setOpenIds(prev => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className="space-y-4">
      {items.map(item => {
        const isOpen = openIds.includes(item.id);

        return (
          <div
            key={item.id}
            className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
              isOpen
                ? 'bg-white border-[#8B1E3F]/30 shadow-lg ring-1 ring-[#8B1E3F]/10'
                : 'bg-white/80 border-stone-200 hover:border-stone-300 hover:bg-white'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              className="w-full p-5 text-left flex items-center justify-between gap-4 font-serif text-base sm:text-lg font-bold text-stone-900 focus:outline-none group"
            >
              <span className="flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isOpen
                      ? 'bg-[#8B1E3F] text-white shadow-md'
                      : 'bg-stone-100 text-stone-500 group-hover:bg-[#8B1E3F]/10 group-hover:text-[#8B1E3F]'
                  }`}
                >
                  <HelpCircle className="h-4 w-4" />
                </div>
                <span className={isOpen ? 'text-[#8B1E3F]' : 'text-stone-900 group-hover:text-[#8B1E3F]'}>
                  {item.question}
                </span>
              </span>

              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                  isOpen ? 'bg-[#8B1E3F]/10 rotate-180' : 'bg-stone-100'
                }`}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-colors ${
                    isOpen ? 'text-[#8B1E3F]' : 'text-stone-500'
                  }`}
                />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="px-6 pb-6 pt-2 text-sm text-stone-600 leading-relaxed font-sans border-t border-stone-100 bg-stone-50/50">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
