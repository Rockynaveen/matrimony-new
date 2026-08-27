import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Eye,
  Trash2,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import type { MatchResponseSchema } from '../../types/matching.types';
import { useRemoveFromShortlist } from '../../hooks/useMatching';
import { useApp } from '../../context/AppContext';

import { MatchAvatar } from '../ui/MatchAvatar';

interface ShortlistCardProps {
  profile: MatchResponseSchema;
}

export const ShortlistCard: React.FC<ShortlistCardProps> = ({ profile }) => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const removeMutation = useRemoveFromShortlist();

  const handleRemove = async () => {
    try {
      await removeMutation.mutateAsync(profile.user_id);
      showToast(`Removed ${profile.first_name} from your shortlist.`);
      setIsConfirmOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to remove from shortlist');
    }
  };

  return (
    <>
      <Card className="flex flex-col justify-between border border-stone-200/80 bg-white hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden group">
        <div>
          {/* Media Head */}
          <div className="relative aspect-square w-full overflow-hidden bg-stone-50">
            <MatchAvatar
              photo={profile.profile_photo}
              firstName={profile.first_name}
              lastName={profile.last_name}
              variant="card"
              imgClassName="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 text-white">
              <span className="text-[10px] font-bold text-white/90">ID: {profile.user_id}</span>
            </div>
            {profile.match_percentage && (
              <div className="absolute top-3 right-3 bg-[#8B1E3F]/95 text-[#D4AF37] px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm border border-[#D4AF37]/30">
                {profile.match_percentage}% Match
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-4 space-y-1.5">
            <div>
              <h4 className="font-serif text-base font-bold text-stone-900 line-clamp-1">
                {profile.first_name} {profile.last_name}{profile.age ? `, ${profile.age}` : ''}
              </h4>
              <p className="text-[10px] font-bold text-[#8B1E3F] tracking-wide uppercase mt-0.5">
                {profile.religion} • {profile.caste}
              </p>
            </div>

            <div className="space-y-1 text-xs text-stone-500 pt-1 border-t border-stone-50">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{profile.city || 'Not specified'}, {profile.state || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{profile.occupation || 'Professional'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{profile.education || 'Education Details'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 grid grid-cols-2 gap-2 mt-1 border-t border-stone-50/50 pt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/profile/${profile.user_id}`)}
            className="w-full text-xs border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl"
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsConfirmOpen(true)}
            className="w-full text-xs border-stone-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
          </Button>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Remove Shortlist"
      >
        <div className="space-y-4 text-center">
          <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-100">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-stone-900">Are you sure you want to remove this profile?</p>
            <p className="text-xs text-stone-500">
              {profile.first_name} {profile.last_name} will be removed from your shortlisted matches list. You can add them back later.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              className="rounded-xl px-4 text-stone-750 font-bold border-stone-200"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={removeMutation.isPending}
              onClick={handleRemove}
              className="bg-[#8B1E3F] hover:bg-[#721733] text-white rounded-xl px-4 font-bold"
            >
              {removeMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-1" />
              )}
              Confirm Remove
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
