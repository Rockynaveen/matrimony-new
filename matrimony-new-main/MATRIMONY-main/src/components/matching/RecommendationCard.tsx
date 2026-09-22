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
import { useApp, isGenericName } from '../../context/AppContext';
import { useUIStore } from '../../store/useUIStore';
import { MatchAvatar, isDummyImage } from '../ui/MatchAvatar';
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
  const { showToast, currentUser } = useApp();

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

  const fullName = `${match.first_name || ''} ${match.last_name || ''}`.trim() || 'Candidate Profile';

  const loggedInId = currentUser?.id ? String(currentUser.id) : (localStorage.getItem('user_id') || '');
  const loggedInMemberId = (currentUser as any)?.member_id || localStorage.getItem('member_id') || '';
  const loggedInEmail = currentUser?.email || localStorage.getItem('logged_in_email') || '';
  const loggedInName = currentUser?.name || localStorage.getItem('logged_in_name') || '';

  const isCurrentUser = Boolean(
    (loggedInId && (String(match.user_id) === loggedInId || String((match as any).id) === loggedInId)) ||
    (loggedInMemberId && (match as any).member_id && String((match as any).member_id) === loggedInMemberId) ||
    (loggedInEmail && (match as any).email && String((match as any).email).toLowerCase() === loggedInEmail.toLowerCase()) ||
    (loggedInName && !isGenericName(loggedInName) && fullName.toLowerCase() === loggedInName.toLowerCase())
  );

  const draftAvatar = (() => {
    try {
      const draft = localStorage.getItem('user_profile_draft');
      return draft ? JSON.parse(draft)?.profile_photo : '';
    } catch {
      return '';
    }
  })();

  const currentUserPhoto = currentUser?.avatar || localStorage.getItem('logged_in_avatar') || draftAvatar || '';

  const rawCandidatePhoto =
    match.profile_photo ||
    (match as any).profile_image ||
    (match as any).profileImage ||
    (match as any).photo ||
    (match as any).photo_url ||
    (match as any).avatar ||
    (match as any).image ||
    (match as any).image_url ||
    (match as any).user?.profile_photo ||
    (match as any).user?.photo ||
    (match as any).user?.avatar ||
    (match as any).photos?.[0] ||
    (match as any).gallery?.[0] ||
    (match as any).images?.[0];

  const resolvedCandidatePhoto = isCurrentUser
    ? ((currentUserPhoto && !isDummyImage(currentUserPhoto)) ? currentUserPhoto : (rawCandidatePhoto || currentUserPhoto))
    : (rawCandidatePhoto || (
        (match.user_id && String(match.user_id) === loggedInId && currentUserPhoto) ? currentUserPhoto : ''
      ));

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full flex flex-col"
    >
      <Card className="h-full flex flex-col justify-between bg-white rounded-2xl border border-stone-200 hover:border-[#8B1E3F]/40 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden group p-0 gap-0">
        
        {/* Upper Visual Container: Photo with Badges & Action */}
        <div
          onClick={handleProfileUnlockFlow}
          className="relative aspect-[4/3.8] w-full overflow-hidden bg-white border-b border-stone-100 cursor-pointer select-none"
        >
          {/* Candidate Photo (real photo or monogram avatar - no dummy images) */}
          <MatchAvatar
            photo={resolvedCandidatePhoto}
            firstName={match.first_name}
            lastName={match.last_name}
            variant="card"
            imgClassName="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Top-Left: Exact AI Match Percentage (Only if authentic percentage from backend exists) */}
          {exactMatchPercentage !== null && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="inline-flex items-center gap-1 bg-[#8B1E3F] text-white text-[10.5px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300 shrink-0" />
                <span>{exactMatchPercentage}% Match</span>
              </span>
            </div>
          )}

          {/* Top-Right: Circular White Shortlist Heart Button */}
          <button
            type="button"
            onClick={handleShortlistToggle}
            disabled={addShortlistMutation.isPending || removeShortlistMutation.isPending}
            className="absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full bg-white hover:bg-stone-50 shadow-sm flex items-center justify-center text-stone-600 hover:text-rose-500 border border-stone-200 transition-all active:scale-90 cursor-pointer"
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
              <span className="inline-flex items-center gap-1 bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                <CheckCircle2 className="h-3 w-3 text-emerald-200" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                <Sparkles className="h-3 w-3 text-amber-200 fill-amber-200" /> Premium
              </span>
            )}
          </div>
        </div>

        {/* Lower Info Details */}
        <CardContent className="p-3.5 flex-1 flex flex-col justify-between space-y-3 bg-white">
          <div className="space-y-1">
            {/* Candidate Name (Highlighted) & ID (Subtle Badge) */}
            <div className="flex items-center justify-between gap-1.5">
              <span
                className="font-bold text-sm sm:text-base text-stone-900 group-hover:text-[#8B1E3F] transition-colors tracking-tight truncate"
                title={fullName}
              >
                {fullName}
              </span>
              <span className="text-[11px] font-medium text-stone-500 bg-stone-100 border border-stone-200/60 px-1.5 py-0.5 rounded shrink-0">
                {displayId}
              </span>
            </div>

            {/* Gender Symbol, Age, Height */}
            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
              {genderSymbol && <span className="text-stone-500 font-bold">{genderSymbol}</span>}
              <span>{match.age ? `${match.age} yrs` : 'Age N/A'}, {formatHeightDisplay((match as any).height)}</span>
            </div>

            {/* Education & Profession */}
            <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium truncate pt-0.5">
              <Briefcase className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{educationProfessionStr}</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium truncate">
              <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{locationStr}</span>
            </div>
          </div>
        </CardContent>

        {/* Action Button: Solid Theme Button */}
        <CardFooter className="p-3.5 pt-0 bg-white">
          <button
            type="button"
            onClick={handleProfileUnlockFlow}
            className="w-full py-2 bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs font-bold rounded-xl transition-all shadow-xs text-center cursor-pointer active:scale-[0.99]"
          >
            View Profile
          </button>
        </CardFooter>

      </Card>
    </motion.div>
  );
};
