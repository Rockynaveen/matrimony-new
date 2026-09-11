import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ArrowRight
} from 'lucide-react';
import type { MatchResponseSchema } from '../../types/matching.types';
import {
  useAddToShortlist,
  useRemoveFromShortlist,
  useSendInterest
} from '../../hooks/useMatching';
import { useApp } from '../../context/AppContext';
import { useUIStore } from '../../store/useUIStore';
import { MatchAvatar } from '../ui/MatchAvatar';

interface RecommendationCardProps {
  match: MatchResponseSchema;
  isShortlisted?: boolean;
  isInterestSent?: boolean;
  isInterestAccepted?: boolean;
  isViewed?: boolean;
  onViewProfile?: (userId: number) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  match,
  isShortlisted = false,
  isInterestSent = false,
  isInterestAccepted = false,
  isViewed = false,
  onViewProfile
}) => {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const addShortlistMutation = useAddToShortlist();
  const removeShortlistMutation = useRemoveFromShortlist();
  const sendInterestMutation = useSendInterest();
  const [isJustSent, setIsJustSent] = useState(false);

  const isLocked = match.is_unlocked === false;
  const hasSentInterest = isJustSent || isInterestSent;

  // Shortlist Toggle
  const handleShortlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isShortlisted) {
        await removeShortlistMutation.mutateAsync(match.user_id);
        showToast(`Removed ${match.first_name || 'profile'} from shortlist.`);
      } else {
        await addShortlistMutation.mutateAsync({ user: match.user_id });
        showToast(`Added ${match.first_name || 'profile'} to shortlist!`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update shortlist status');
    }
  };

  // Express Interest directly from card
  const handleSendInterest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasSentInterest || isInterestAccepted) return;
    try {
      await sendInterestMutation.mutateAsync({
        to_user: match.user_id,
        message: 'Hi, I found your profile matching and would like to connect.'
      });
      setIsJustSent(true);
      showToast(`Interest sent to ${match.first_name || 'member'}!`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to express interest.');
    }
  };

  const handleProfileUnlockFlow = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onViewProfile) {
      onViewProfile(match.user_id);
    }
    if (isLocked) {
      if (match.lock_reason === 'NO_PROFILE_CREDITS') {
        useUIStore.getState().setLockModal(
          true,
          'Profile Locked. You have used all your matching profile credits. Take a membership to view more profiles.'
        );
        return;
      }
    }
    navigate(`/profile/${match.user_id}`);
  };

  const locationStr = [match.city, match.state].filter(Boolean).join(', ') || match.country || 'Not Specified';
  const educationProfessionStr = [match.education, match.profession || (match as any).occupation].filter(Boolean).join(', ') || 'Not Specified';
  const genderSymbol = match.gender?.toLowerCase().startsWith('f') ? '♀' : '♂';
  const displayId = (match as any).member_id || (match.user_id ? `KM${String(match.user_id).padStart(6, '0')}` : 'Member');

  const formatHeightDisplay = (h?: string | number | null): string => {
    if (!h) return 'Not Specified';
    if (typeof h === 'number') {
      const totalInches = h / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return `${feet}.${inches} ft`;
    }
    const str = String(h).trim();
    if (str.toLowerCase().includes('cm')) {
      const num = parseFloat(str);
      if (!isNaN(num)) {
        const totalInches = num / 2.54;
        const feet = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        return `${feet}.${inches} ft`;
      }
    }
    return str;
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full flex flex-col"
    >
      <div className="h-full flex flex-col justify-between bg-white rounded-2xl border border-stone-200/90 hover:border-[#8B1E3F]/40 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden group">
        
        {/* Upper Visual Container: Photo with Top-Right Heart and Bottom-Left Badge */}
        <div
          onClick={handleProfileUnlockFlow}
          className="relative aspect-[4/3.8] w-full overflow-hidden bg-stone-100 cursor-pointer select-none"
        >
          {/* Candidate Photo (real photo or monogram avatar - no dummy images) */}
          <MatchAvatar
            photo={match.profile_photo}
            firstName={match.first_name}
            lastName={match.last_name}
            variant="card"
            imgClassName="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Top-Right: Circular White Shortlist Heart Button */}
          <button
            type="button"
            onClick={handleShortlistToggle}
            disabled={addShortlistMutation.isPending || removeShortlistMutation.isPending}
            className="absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full bg-white/95 hover:bg-white shadow-md flex items-center justify-center text-stone-600 hover:text-rose-500 transition-all active:scale-90 cursor-pointer"
            title={isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isShortlisted
                  ? 'fill-rose-500 text-rose-500 scale-110'
                  : 'text-stone-600 stroke-[1.8]'
              }`}
            />
          </button>

          {/* Bottom-Left: Verified or Premium Badge */}
          <div className="absolute bottom-2.5 left-2.5 z-10">
            {match.is_verified ? (
              <span className="inline-flex items-center gap-1 bg-[#8B1E3F] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-[#9A6B2F] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                <Sparkles className="h-3 w-3 text-amber-200 fill-amber-200" /> Premium
              </span>
            )}
          </div>
        </div>

        {/* Lower Info & Action Details */}
        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3 bg-white">
          <div className="space-y-1">
            {/* Profile ID */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-stone-900 tracking-tight">
                {displayId}
              </span>
              <span className="text-[11px] font-semibold text-stone-500 truncate max-w-[110px]">
                {match.first_name} {match.last_name}
              </span>
            </div>

            {/* Gender Symbol, Age, Height */}
            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
              <span className="text-stone-500 font-bold">{genderSymbol}</span>
              <span>{match.age ? `${match.age} yrs` : 'Age N/A'}, {formatHeightDisplay(match.height)}</span>
            </div>

            {/* Education & Profession */}
            <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium truncate pt-0.5">
              <Briefcase className="h-3.5 w-3.5 text-[#8B1E3F] shrink-0" />
              <span className="truncate">{educationProfessionStr}</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium truncate">
              <MapPin className="h-3.5 w-3.5 text-[#8B1E3F] shrink-0" />
              <span className="truncate">{locationStr}</span>
            </div>
          </div>

          {/* Full-width View Profile Button */}
          <button
            type="button"
            onClick={handleProfileUnlockFlow}
            className="w-full py-2 bg-[#8B1E3F] hover:bg-[#721833] text-white text-xs font-bold rounded-xl transition-all shadow-xs text-center cursor-pointer active:scale-[0.99]"
          >
            View Profile
          </button>
        </div>

      </div>
    </motion.div>
  );
};
