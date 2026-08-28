import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { Card } from '../ui/Card';

interface ReligionCasteProps {
  preferences: any;
  onMultiToggle: (field: string, value: string) => void;
  religionOptions: string[];
}

export const ReligionCasteSection: React.FC<ReligionCasteProps> = ({
  preferences,
  onMultiToggle,
  religionOptions
}) => {
  return (
    <Card className="p-6 space-y-6 border-rose-100 bg-white shadow-xs">
      <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-lg text-gray-900">Religion & Community</h3>
          <p className="text-xs text-gray-500">Filter by religious and cultural preferences</p>
        </div>
      </div>

      {/* Religion Multi-Select */}
      <div>
        <label className="text-xs font-semibold text-gray-700 mb-2 block">Religion</label>
        <div className="flex flex-wrap gap-2">
          {religionOptions.map((rel) => {
            const isSelected = (preferences.religions || []).includes(rel);
            return (
              <button
                type="button"
                key={rel}
                onClick={() => onMultiToggle('religions', rel)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-gray-700 border-rose-100 hover:border-amber-300'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                {rel}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
