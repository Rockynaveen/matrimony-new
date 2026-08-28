import React from 'react';
import { UserCheck, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface BasicCriteriaProps {
  preferences: any;
  onChange: (field: string, value: any) => void;
  onMultiToggle: (field: string, value: string) => void;
  heightOptions: string[];
  maritalOptions: readonly string[];
}

export const BasicCriteriaSection: React.FC<BasicCriteriaProps> = ({
  preferences,
  onChange,
  onMultiToggle,
  heightOptions,
  maritalOptions
}) => {
  return (
    <Card className="p-6 space-y-6 border-rose-100 bg-white shadow-xs">
      <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-lg text-gray-900">Basic Criteria</h3>
          <p className="text-xs text-gray-500">Set preferred age, height, and marital status</p>
        </div>
      </div>

      {/* Age Range Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm font-semibold text-gray-800">
          <span>Age Range</span>
          <Badge variant="pink">
            {preferences.ageMin || 22} - {preferences.ageMax || 35} years old
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Minimum Age</label>
            <input
              type="range"
              min="18"
              max="60"
              value={preferences.ageMin || 22}
              onChange={(e) => onChange('ageMin', Number(e.target.value))}
              className="w-full accent-rose-600"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Maximum Age</label>
            <input
              type="range"
              min="18"
              max="60"
              value={preferences.ageMax || 35}
              onChange={(e) => onChange('ageMax', Number(e.target.value))}
              className="w-full accent-rose-600"
            />
          </div>
        </div>
      </div>

      {/* Height Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block">Min Height</label>
          <select
            value={preferences.heightMin || "5' 2\""}
            onChange={(e) => onChange('heightMin', e.target.value)}
            className="w-full bg-rose-50/40 border border-rose-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            {heightOptions.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block">Max Height</label>
          <select
            value={preferences.heightMax || "6' 0\""}
            onChange={(e) => onChange('heightMax', e.target.value)}
            className="w-full bg-rose-50/40 border border-rose-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            {heightOptions.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Marital Status Multi-Toggle */}
      <div className="pt-2">
        <label className="text-xs font-semibold text-gray-700 mb-2 block">Marital Status</label>
        <div className="flex flex-wrap gap-2">
          {maritalOptions.map((status) => {
            const isSelected = (preferences.maritalStatuses || []).includes(status);
            return (
              <button
                type="button"
                key={status}
                onClick={() => onMultiToggle('maritalStatuses', status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-gray-700 border-rose-100 hover:border-rose-300'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                {status}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
