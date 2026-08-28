import React from 'react';
import { Briefcase, MapPin, GraduationCap } from 'lucide-react';
import { Card } from '../ui/Card';

interface LocationProfessionProps {
  preferences: any;
  onChange: (field: string, value: any) => void;
}

export const LocationProfessionSection: React.FC<LocationProfessionProps> = ({
  preferences,
  onChange
}) => {
  return (
    <Card className="p-6 space-y-6 border-rose-100 bg-white shadow-xs">
      <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-lg text-gray-900">Career & Location</h3>
          <p className="text-xs text-gray-500">Education, occupation, income, and geographical location</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-purple-600" /> Minimum Education
          </label>
          <input
            type="text"
            placeholder="e.g. Bachelor's Degree"
            value={preferences.educationMin || ''}
            onChange={(e) => onChange('educationMin', e.target.value)}
            className="w-full bg-rose-50/40 border border-rose-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-purple-600" /> Preferred Location
          </label>
          <input
            type="text"
            placeholder="e.g. Mumbai, Bengaluru"
            value={preferences.location || ''}
            onChange={(e) => onChange('location', e.target.value)}
            className="w-full bg-rose-50/40 border border-rose-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>
    </Card>
  );
};
