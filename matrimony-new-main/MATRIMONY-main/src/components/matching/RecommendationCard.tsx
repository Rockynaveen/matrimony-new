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
import { Card, CardContent, CardFooter } from '../ui/Card';

interface RecommendationCardProps {
  match: MatchResponseSchema;
  isShortlisted?: boolean;
  isInterestSent?: boolean;
  isInterestAccepted?: boolean;
  isViewed?: boolean;
  onViewProfile?: (userId: string | number) => void;
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
    const publicIdentifier = (match as any).user_uuid || match.member_id || (match as any).uuid || match.user_id;
    if (onViewProfile) {
      onViewProfile(publicIdentifier);
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
    navigate(`/profile/${publicIdentifier}`);
  };

  const locationStr = [match.city, match.state].filter(Boolean).join(', ') || match.country || 'Not Specified';
  const educationProfessionStr = [match.education, match.profession || (match as any).occupation].filter(Boolean).join(', ') || 'Not Specified';
  const rawMatchUserId = match.user_id || (match as any).id;
  const numericMatchId = rawMatchUserId ? parseInt(String(rawMatchUserId).replace(/\D/g, ''), 10) : 0;
  const displayId =
    (match as any).member_id ||
    (match as any).user_member_id ||
    (numericMatchId > 0 ? `KM${String(numericMatchId).padStart(6, '0')}` : 'Member');

  const genderLower = String((match as any).gender || '').toLowerCase();
  const genderSymbol = genderLower.startsWith('f') ? '♀' : genderLower.startsWith('m') ? '♂' : '';

  // Exact Match Percentage (ONLY authentic percentage from backend API, NEVER dummy fallback)
  const exactMatchPercentage = (() => {
    const rawVal =
      match.match_percentage ??
      (match as any).compatibility_percentage ??
      (match as any).matchPercentage ??
      (match as any).compatibility_score ??
      (match as any).match_score;

    if (rawVal === undefined || rawVal === null || rawVal === '') {
      return null;
    }

    const num = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal));
    if (isNaN(num) || num <= 0) {
      return null;
    }

    // If fraction between 0 and 1 (e.g. 0.88), format as percentage
    if (num > 0 && num <= 1) {
      return Math.round(num * 100);
    }

    return Math.round(num);
  })();

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
      <Card className="h-full flex flex-col justify-between bg-gradient-to-b from-white via-[#FFF8FA] to-[#FDF0F5] rounded-2xl border border-amber-300/80 hover:border-amber-400 shadow-[0_4px_16px_rgba(212,175,55,0.08)] hover:shadow-[0_12px_32px_rgba(212,175,55,0.18)] transition-all duration-300 overflow-hidden group p-0 gap-0">
        
        {/* Upper Visual Container: Photo with Badges & Action */}
        <div
          onClick={handleProfileUnlockFlow}
          className="relative aspect-[4/3.8] w-full overflow-hidden bg-gradient-to-b from-white via-[#FFF5F8] to-[#FCE7F0] border-b border-rose-100/60 cursor-pointer select-none"
        >
          {/* Candidate Photo (real photo or monogram avatar - no dummy images) */}
          <MatchAvatar
            photo={match.profile_photo}
            firstName={match.first_name}
            lastName={match.last_name}
            variant="card"
            imgClassName="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Soft White Sheen & Bottom Contrast Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20 pointer-events-none" />

          {/* Top-Left: Exact AI Match Percentage (Only if authentic percentage from backend exists) */}
          {exactMatchPercentage !== null && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#382104]/90 via-[#68430B]/90 to-[#8C5E13]/90 text-amber-200 border border-amber-300/60 text-[10.5px] font-black px-2.5 py-0.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.35)] backdrop-blur-xs">
                <Sparkles className="h-3 w-3 text-yellow-300 fill-yellow-300/50 shrink-0" />
                <span>{exactMatchPercentage}% Match</span>
              </span>
            </div>
          )}

          {/* Top-Right: Circular White Shortlist Heart Button with Gold Border */}
          <button
            type="button"
            onClick={handleShortlistToggle}
            disabled={addShortlistMutation.isPending || removeShortlistMutation.isPending}
            className="absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full bg-white/95 hover:bg-white shadow-md flex items-center justify-center text-stone-600 hover:text-rose-500 border border-amber-300/60 transition-all active:scale-90 cursor-pointer"
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

          {/* Bottom-Left: Verified or Premium Badge with Rich Gold & Rose */}
          <div className="absolute bottom-2.5 left-2.5 z-10">
            {match.is_verified ? (
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#7B5313] via-[#9E6E1F] to-[#C99738] text-amber-100 border border-amber-200/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-xs">
                <CheckCircle2 className="h-3 w-3 text-amber-200" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#B48128] via-[#D4AF37] to-[#F59E0B] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                <Sparkles className="h-3 w-3 text-yellow-100 fill-yellow-100" /> Premium
              </span>
            )}
          </div>
        </div>

        {/* Lower Info Details in Pink & White Gradient */}
        <CardContent className="p-3.5 flex-1 flex flex-col justify-between space-y-3 bg-gradient-to-b from-white via-[#FFF8FA] to-[#FDF0F5]">
          <div className="space-y-1">
            {/* Profile ID & Match Percentage Pill */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-sm text-stone-900 group-hover:text-[#B48128] transition-colors tracking-tight shrink-0">
                  {displayId}
                </span>
                {exactMatchPercentage !== null && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-amber-900 bg-amber-100/90 border border-amber-300/80 px-1.5 py-0.2 rounded-md shadow-2xs shrink-0">
                    {exactMatchPercentage}%
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-stone-500 truncate max-w-[110px]">
                {match.first_name} {match.last_name}
              </span>
            </div>

            {/* Gender Symbol, Age, Height */}
            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
              {genderSymbol && <span className="text-stone-500 font-bold">{genderSymbol}</span>}
              <span>{match.age ? `${match.age} yrs` : 'Age N/A'}, {formatHeightDisplay((match as any).height)}</span>
            </div>

            {/* Education & Profession */}
            <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium truncate pt-0.5">
              <Briefcase className="h-3.5 w-3.5 text-[#B48128] shrink-0" />
              <span className="truncate">{educationProfessionStr}</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium truncate">
              <MapPin className="h-3.5 w-3.5 text-[#B48128] shrink-0" />
              <span className="truncate">{locationStr}</span>
            </div>
          </div>
        </CardContent>

        {/* Action Button: Dual Rose-Pink & Royal Gold Gradient */}
        <CardFooter className="p-3.5 pt-0">
          <button
            type="button"
            onClick={handleProfileUnlockFlow}
            className="w-full py-2 bg-gradient-to-r from-[#8B1E3F] via-[#B83358] via-[#B48128] to-[#C99738] hover:from-[#761734] hover:to-[#B68428] text-white text-xs font-bold rounded-xl transition-all shadow-xs text-center cursor-pointer active:scale-[0.99]"
          >
            View Profile
          </button>
        </CardFooter>

      </Card>
    </motion.div>
  );
};
