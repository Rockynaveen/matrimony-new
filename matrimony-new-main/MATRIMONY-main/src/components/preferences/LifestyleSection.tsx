import React from 'react';
import { Coffee, Check } from 'lucide-react';
import { Card } from '../ui/Card';

interface LifestyleProps {
  preferences: any;
  onMultiToggle: (field: string, value: string) => void;
  dietOptions: readonly string[];
  smokingOptions: readonly string[];
  drinkingOptions: readonly string[];
}

export const LifestyleSection: React.FC<LifestyleProps> = ({
  preferences,
  onMultiToggle,
  dietOptions,
  smokingOptions,
  drinkingOptions
}) => {
  return (
    <Card className="p-6 space-y-6 border-rose-100 bg-white shadow-xs">
      <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
          <Coffee className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-lg text-gray-900">Lifestyle Preferences</h3>
          <p className="text-xs text-gray-500">Diet, smoking, and drinking preferences</p>
        </div>
      </div>

      {/* Diet */}
      <div>
        <label className="text-xs font-semibold text-gray-700 mb-2 block">Diet Habits</label>
        <div className="flex flex-wrap gap-2">
          {dietOptions.map((diet) => {
            const isSelected = (preferences.diet || []).includes(diet);
            return (
              <button
                type="button"
                key={diet}
                onClick={() => onMultiToggle('diet', diet)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-gray-700 border-rose-100 hover:border-emerald-300'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                {diet}
              </button>
            );
          })}
        </div>
      </div>

      {/* Smoking & Drinking */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-2 block">Smoking Habits</label>
          <div className="flex flex-wrap gap-2">
            {smokingOptions.map((opt) => {
              const isSelected = (preferences.smoking || []).includes(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => onMultiToggle('smoking', opt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-rose-100'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 mb-2 block">Drinking Habits</label>
          <div className="flex flex-wrap gap-2">
            {drinkingOptions.map((opt) => {
              const isSelected = (preferences.drinking || []).includes(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => onMultiToggle('drinking', opt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-rose-100'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};
