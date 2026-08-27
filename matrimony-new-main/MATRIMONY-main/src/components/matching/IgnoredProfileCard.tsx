import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { MapPin, Briefcase, Eye, RotateCcw, Loader2 } from 'lucide-react';
import type { MatchResponseSchema } from '../../types/matching.types';
import { useRemoveFromIgnore } from '../../hooks/useMatching';
import { useApp } from '../../context/AppContext';

import { MatchAvatar } from '../ui/MatchAvatar';

interface IgnoredProfileCardProps {
  profile: MatchResponseSchema;
}

export const IgnoredProfileCard: React.FC<IgnoredProfileCardProps> = ({ profile }) => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const removeMutation = useRemoveFromIgnore();

  const handleRestore = async () => {
    try {
      await removeMutation.mutateAsync(profile.user_id);
      showToast(`Restored ${profile.first_name} to recommendations list.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to restore profile');
    }
  };

  return (
    <Card className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-stone-200/80 bg-white rounded-3xl hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-4">
        <MatchAvatar
          photo={profile.profile_photo}
          firstName={profile.first_name}
          lastName={profile.last_name}
          variant="circle"
          className="h-14 w-14 sm:h-16 sm:w-16 text-xl sm:text-2xl ring-2 ring-stone-100 shrink-0"
        />
        <div className="space-y-0.5">
          <h4 className="font-serif text-base font-bold text-stone-900">
            {profile.first_name} {profile.last_name}{profile.age ? `, ${profile.age}` : ''}
          </h4>
          <p className="text-[10px] font-bold text-[#8B1E3F] tracking-wide uppercase">
            {profile.religion} • {profile.caste}
          </p>
          <div className="flex items-center gap-3 text-xs text-stone-500 font-medium">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              {profile.city || 'Not specified'}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              {profile.occupation || 'Professional'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-50">
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/profile/${profile.user_id}`)}
          className="text-xs border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl"
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> View Profile
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={removeMutation.isPending}
          onClick={handleRestore}
          className="text-xs border-stone-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 rounded-xl font-bold"
        >
          {removeMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
          )}
          Restore Match
        </Button>
      </div>
    </Card>
  );
};
