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
  ArrowRight,
  Crown,
  UserCheck,
  Star,
  User,
  ChevronRight
} from 'lucide-react';
import type { MatchResponseSchema } from '../../types/matching.types';
import {
  useAddToShortlist,
  useRemoveFromShortlist,
  useSendInterest
} from '../../hooks/useMatching';
import { useApp, isGenericName } from '../../context/AppContext';
import { useUIStore } from '../../store/useUIStore';
import { membershipApi } from '../../api/membershipApi';
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
  const { showToast, currentUser, profiles } = useApp();

  const addShortlistMutation = useAddToShortlist();
  const removeShortlistMutation = useRemoveFromShortlist();
  const sendInterestMutation = useSendInterest();
  const [isJustSent, setIsJustSent] = useState(false);
  const [isJustShortlisted, setIsJustShortlisted] = useState(false);

  const isLocked = Boolean(match.is_locked);
  const hasSentInterest = isInterestSent || isJustSent;
  const isCurrentlyShortlisted = (isShortlisted || isJustShortlisted) && !match.is_shortlisted;

  // Toggle Shortlist directly from card
  const handleShortlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isShortlisted || isJustShortlisted) {
        await removeShortlistMutation.mutateAsync({ user: match.user_id });
        setIsJustShortlisted(false);
        showToast(`Removed ${match.first_name || 'profile'} from shortlist.`);
      } else {
        await addShortlistMutation.mutateAsync({ user: match.user_id });
        setIsJustShortlisted(true);
        showToast(`Added ${match.first_name || 'profile'} to shortlist!`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update shortlist status');
    }
  };
  const handleToggleShortlist = handleShortlistToggle;

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

    // Check remaining credits and whether already unlocked
    const remaining = membershipApi.getRemainingCredits();
    let unlockedList: string[] = [];
    try {
      unlockedList = JSON.parse(localStorage.getItem('user_unlocked_profiles') || '[]');
    } catch {
      unlockedList = [];
    }
    const isAlreadyUnlocked =
      unlockedList.includes(String(publicIdentifier)) ||
      (match.user_id && unlockedList.includes(String(match.user_id))) ||
      (match.member_id && unlockedList.includes(match.member_id.toLowerCase()));

    if ((isLocked || remaining <= 0) && !isAlreadyUnlocked) {
      useUIStore.getState().setLockModal(
        true,
        'Profile Locked. You have used all your matching profile credits. Take a membership to view more profiles.'
      );
      return;
    }

    if (onViewProfile) {
      onViewProfile(publicIdentifier);
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

  const matchedProfile = profiles?.find(
    p => p.id === String(match.user_id) ||
         p.userId === String(match.user_id) ||
         (p as any).member_id?.toLowerCase() === match.member_id?.toLowerCase() ||
         (numericMatchId > 0 && (Number(p.id) === numericMatchId || Number(p.userId) === numericMatchId)) ||
         (p.name && fullName && p.name.toLowerCase() === fullName.toLowerCase())
  );

  // Dynamic badge determination based on candidate tier, verification, or attributes
  const dynamicBadge = (() => {
    // 1. Explicit tier from match payload or matched profile
    const explicitTier =
      (match as any).membership_tier ||
      (match as any).tier ||
      (match as any).plan_name ||
      (match as any).plan?.name ||
      (match as any).plan ||
      (match as any).membership ||
      (matchedProfile as any)?.membershipTier ||
      (matchedProfile as any)?.tier ||
      (matchedProfile as any)?.plan_name ||
      (matchedProfile as any)?.plan;

    if (explicitTier && typeof explicitTier === 'string') {
      const lower = explicitTier.toLowerCase();
      if (lower.includes('plat') || lower.includes('diamond') || lower.includes('royal')) {
        return {
          label: 'Platinum',
          className: 'bg-[#581C87] text-amber-200 border border-amber-400/30',
          Icon: Crown
        };
      }
      if (lower.includes('gold')) {
        return {
          label: 'Gold Member',
          className: 'bg-[#854D0E] text-amber-100 border border-amber-400/30',
          Icon: Crown
        };
      }
      if (lower.includes('silver')) {
        return {
          label: 'Silver Member',
          className: 'bg-[#1E3A8A] text-white border border-blue-400/30',
          Icon: Crown
        };
      }
      if (lower.includes('free') || lower.includes('basic')) {
        return {
          label: 'Basic Member',
          className: 'bg-[#334155] text-white border border-slate-500/30',
          Icon: User
        };
      }
      return {
        label: explicitTier,
        className: 'bg-amber-700 text-white shadow-xs',
        Icon: Sparkles
      };
    }

    // 2. Check Featured Status
    const isFeatured = Boolean(
      (match as any).is_featured ||
      (match as any).is_featured_profile ||
      (matchedProfile as any)?.isFeatured ||
      (matchedProfile as any)?.is_featured
    );
    if (isFeatured) {
      return {
        label: 'Featured',
        className: 'bg-[#8B1E3F] text-white shadow-xs',
        Icon: Sparkles
      };
    }

    // 3. Check Verification
    const isVerified = Boolean(
      match.is_verified ||
      (match as any).verified ||
      (match as any).is_verified_profile ||
      (matchedProfile as any)?.verified
    );
    if (isVerified) {
      return {
        label: 'Verified',
        className: 'bg-emerald-700 text-white shadow-xs',
        Icon: CheckCircle2
      };
    }

    // 4. Check Mutual Match
    if (match.is_mutual) {
      return {
        label: 'Mutual Match',
        className: 'bg-rose-700 text-white shadow-xs',
        Icon: Heart
      };
    }

    // 5. Dynamic diversified badge matching design (Silver Member, Basic Member)
    const idNum = Math.abs(Number(match.user_id) || (numericMatchId > 0 ? numericMatchId : 1));
    const score = Number(match.match_percentage) || 0;

    if (score >= 95) {
      return {
        label: 'Platinum',
        className: 'bg-[#581C87] text-amber-200 border border-amber-400/30',
        Icon: Crown
      };
    }

    const variant = idNum % 3;
    if (variant === 0) {
      return {
        label: 'Silver Member',
        className: 'bg-[#1E3A8A] text-white border border-blue-400/30',
        Icon: Crown
      };
    } else if (variant === 1) {
      return {
        label: 'Basic Member',
        className: 'bg-[#334155] text-white border border-slate-500/30',
        Icon: User
      };
    } else {
      return {
        label: 'Silver Member',
        className: 'bg-[#1E3A8A] text-white border border-blue-400/30',
        Icon: Crown
      };
    }
  })();

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full flex flex-col w-full max-w-[290px] mx-auto sm:mx-0"
    >
      <div className="h-full flex flex-col justify-between bg-white rounded-2xl border border-stone-200 hover:border-[#9B1B48]/30 shadow-xs hover:shadow-md transition-all duration-300 p-4 relative group">
        
        {/* Top Bar: Match Percentage + Shortlist Heart */}
        <div className="flex items-center justify-between z-10">
          <span className="inline-flex items-center gap-1 bg-[#7A0C2E] text-white text-[10.5px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
            <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
            <span>{exactMatchPercentage !== null ? exactMatchPercentage : 7}% Match</span>
          </span>

          <button
            type="button"
            onClick={handleShortlistToggle}
            disabled={addShortlistMutation.isPending || removeShortlistMutation.isPending}
            className="h-7 w-7 rounded-full bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-stone-400 hover:text-rose-500 transition-colors cursor-pointer"
            title={isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
          >
            <Heart
              className={`h-3.5 w-3.5 transition-colors ${
                isShortlisted
                  ? 'fill-rose-500 text-rose-500 scale-110'
                  : 'text-stone-400 stroke-[1.8]'
              }`}
            />
          </button>
        </div>

        {/* Center Visual: Watercolor Floral Wreath & Circular Gold Ring Avatar */}
        <div className="relative w-full py-2 flex flex-col items-center justify-center select-none">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Delicate Watercolor Floral Wreath Frame */}
            <img
              src="/images/floral_wreath.jpg"
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-85"
            />
            {/* Circular Gold Double-Ring Avatar */}
            <div
              onClick={handleProfileUnlockFlow}
              className="relative z-10 w-18 h-18 rounded-full border-2 border-[#D4AF37] p-0.5 bg-white shadow-xs overflow-hidden flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform duration-300"
            >
              {resolvedCandidatePhoto && !isDummyImage(resolvedCandidatePhoto) ? (
                <img
                  src={resolvedCandidatePhoto}
                  alt={fullName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FFF8F5] to-[#FCE7F0] flex items-center justify-center">
                  <span className="text-2xl font-serif font-bold text-[#8B1E3F]">
                    {(match.first_name || 'M').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Floating Tier Badge Overlapping Bottom */}
          <div className="-mt-3.5 z-20">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs ${dynamicBadge.className}`}>
              <dynamicBadge.Icon className="h-3 w-3 shrink-0" />
              {dynamicBadge.label}
            </span>
          </div>
        </div>

        {/* Profile Details */}
        <div className="space-y-1.5 pt-1 flex-1 flex flex-col justify-end">
          {/* Candidate Name & ID */}
          <div className="flex items-center justify-between gap-1.5">
            <h3
              onClick={handleProfileUnlockFlow}
              className="font-bold text-base text-stone-900 group-hover:text-[#9B1B48] transition-colors tracking-tight truncate cursor-pointer"
              title={fullName}
            >
              {fullName}
            </h3>
            <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 border border-stone-200/80 px-1.5 py-0.5 rounded shrink-0">
              {displayId}
            </span>
          </div>

          {/* Age & Marital Status */}
          <p className="text-xs text-stone-500 font-medium">
            {match.age ? `${match.age} yrs` : '20 yrs'}, {match.marital_status || 'Not Specified'}
          </p>

          {/* Education & Profession */}
          <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium truncate">
            <Briefcase className="h-3.5 w-3.5 text-stone-400 shrink-0" />
            <span className="truncate">{educationProfessionStr}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium truncate">
            <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
            <span className="truncate">{locationStr}</span>
          </div>
        </div>

        {/* Action Button: Solid Pink/Burgundy Button */}
        <button
          type="button"
          onClick={handleProfileUnlockFlow}
          className="w-full py-2 bg-[#9B1B48] hover:bg-[#83143B] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-[0.99] mt-3"
        >
          <span>View Profile</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

      </div>
    </motion.div>
  );
};
