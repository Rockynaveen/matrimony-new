import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '../../types';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardFooter } from '../ui/Card';
import {
  Heart,
  ShieldCheck,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Eye,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

import { MatchAvatar, isDummyImage } from '../ui/MatchAvatar';

import { useShortlistStore } from '../../store/useShortlistStore';

interface ProfileCardProps {
  profile: Profile;
}

const toSafeString = (val: any, fallback = ''): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val.trim() || fallback;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (val.city || val.state || val.country) {
      return [val.city, val.state, val.country].filter(Boolean).join(', ') || fallback;
    }
    if (val.name || val.title || val.label || val.value) {
      return String(val.name || val.title || val.label || val.value || fallback);
    }
    return fallback;
  }
  return String(val);
};

export const ProfileCard: React.FC<ProfileCardProps> = React.memo(({ profile }) => {
  const { interests, sendInterest, isAuthenticated, currentUser } = useApp();
  const isShortlisted = useShortlistStore((state) => state.shortlistedIds.includes(profile.id));
  const toggleShortlist = useShortlistStore((state) => state.toggleShortlist);
  const navigate = useNavigate();

  const loggedInId = currentUser?.id ? String(currentUser.id) : (localStorage.getItem('user_id') || '');
  const isCurrentUser = Boolean(
    (loggedInId && (String(profile.id) === loggedInId || String((profile as any).user_id) === loggedInId)) ||
    (currentUser?.name && profile.name && profile.name.toLowerCase() === currentUser.name.toLowerCase())
  );

  const currentUserAvatar = currentUser?.avatar || localStorage.getItem('logged_in_avatar') || '';

  const rawProfilePhoto =
    profile.profileImage ||
    (profile as any).avatar ||
    (profile as any).profile_photo ||
    (profile as any).photo ||
    (profile as any).photo_url ||
    (profile as any).image;

  const resolvedPhoto = isCurrentUser
    ? ((currentUserAvatar && !isDummyImage(currentUserAvatar)) ? currentUserAvatar : (rawProfilePhoto || currentUserAvatar))
    : (rawProfilePhoto || ((String(profile.id) === loggedInId && currentUserAvatar) ? currentUserAvatar : ''));

  const [isSending, setIsSending] = React.useState(false);
  const [isJustSent, setIsJustSent] = React.useState(false);

  const profileIdentifier = (profile as any).uuid || (profile as any).member_id || (profile as any).user_uuid || profile.id;
  const hasSentInterest = isJustSent || profile.interestSent || interests.some(i => String(i.receiverId) === String(profile.id) || String(i.user_id) === String(profile.id) || String(i.to_user) === String(profile.id));

  const resolvedLocation = React.useMemo(() => {
    if (typeof profile.city === 'string' && profile.city.trim()) return profile.city.trim();
    if (typeof profile.location === 'string' && profile.location.trim()) return profile.location.trim();
    if (profile.location && typeof profile.location === 'object') {
      return [profile.location.city, profile.location.state, profile.location.country]
        .filter(Boolean)
        .join(', ') || 'India';
    }
    return toSafeString(profile.city || profile.location, 'India');
  }, [profile.city, profile.location]);

  const resolvedCommunity = React.useMemo(() => {
    return toSafeString((profile as any).community || profile.caste || profile.religion, 'Community');
  }, [profile]);

  const resolvedEducation = React.useMemo(() => {
    return toSafeString(profile.education, 'Not specified');
  }, [profile.education]);

  const resolvedProfession = React.useMemo(() => {
    return toSafeString(profile.profession, 'Not specified');
  }, [profile.profession]);

  const handleSendInterestClick = async () => {
    setIsSending(true);
    setIsJustSent(true);
    try {
      await sendInterest(profile.id);
    } catch {
      setIsJustSent(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleProtectedAction = (targetUrl: string, actionCallback?: () => void) => {
    if (!isAuthenticated) {
      navigate(`/register?redirect=${encodeURIComponent(targetUrl)}`);
      return;
    }
    if (actionCallback) {
      actionCallback();
    } else {
      navigate(targetUrl);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col justify-between rounded-2xl border border-stone-200 hover:border-[#8B1E3F]/40 shadow-xs hover:shadow-md transition-all duration-300 group bg-white overflow-hidden p-0 gap-0">
        <div>
          {/* Card Media Header */}
          <div className="relative aspect-[4/4.2] w-full overflow-hidden bg-white border-b border-stone-100">
            <MatchAvatar
              photo={resolvedPhoto}
              name={profile.name}
              variant="card"
              imgClassName="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Top Badges with Gold Accents */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-1.5">
                {profile.verified && (
                  <Badge variant="verified" className="bg-emerald-700 text-white border border-emerald-600 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" /> Verified
                  </Badge>
                )}
                {profile.online && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" /> Online
                  </span>
                )}
              </div>

              {/* Shortlist Heart Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleProtectedAction(`/profile/${profileIdentifier}`, () => toggleShortlist(profile.id));
                }}
                className={`p-2 rounded-full transition-all border border-stone-200 ${
                  isShortlisted
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-stone-50 hover:text-rose-500'
                }`}
                title={isShortlisted ? 'Remove from shortlist' : 'Shortlist profile'}
              >
                <Heart
                  className={`h-4 w-4 transition-transform ${
                    isShortlisted ? 'fill-current scale-110' : ''
                  }`}
                />
              </button>
            </div>

            {/* AI Match Compatibility Badge (Only if authentic percentage exists) */}
            {typeof profile.matchScore === 'number' && profile.matchScore > 0 && (
              <div className="absolute bottom-3 right-3 z-10">
                <div className="bg-[#8B1E3F] text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-bold shadow-xs">
                  <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300" />
                  <span>{Math.round(profile.matchScore)}% Match</span>
                </div>
              </div>
            )}
          </div>

          {/* Profile Details in Pure White */}
          <CardContent className="p-4 space-y-2.5 bg-white">
            <div>
              <h3 className="font-bold text-base text-gray-900 line-clamp-1 group-hover:text-[#8B1E3F] transition-colors">
                {profile.name}, {profile.age}
              </h3>
              <p className="text-xs text-stone-600 font-medium line-clamp-1">
                {resolvedCommunity}
              </p>
            </div>

            <div className="space-y-1 text-xs text-stone-500 font-normal">
              <div className="flex items-center gap-1.5 truncate">
                <GraduationCap className="h-3.5 w-3.5 text-[#8B1E3F] shrink-0" />
                <span className="truncate">{resolvedEducation}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Briefcase className="h-3.5 w-3.5 text-[#8B1E3F] shrink-0" />
                <span className="truncate">{resolvedProfession}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 text-[#8B1E3F] shrink-0" />
                <span className="truncate">{resolvedLocation}</span>
              </div>
            </div>
          </CardContent>
        </div>

        {/* Action Buttons in shadcn CardFooter */}
        <CardFooter className="p-3 pt-0 grid grid-cols-2 gap-2 mt-auto bg-white">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleProtectedAction(`/profile/${profileIdentifier}`)}
            className="w-full text-xs border border-[#8B1E3F] text-[#8B1E3F] bg-white hover:bg-[#8B1E3F] hover:text-white transition-all font-bold shadow-2xs cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> View Profile
          </Button>

          {isSending ? (
            <Button
              size="sm"
              variant="secondary"
              disabled
              className="w-full text-xs text-emerald-800 bg-emerald-50 border border-emerald-200"
            >
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin text-emerald-600" /> Sending...
            </Button>
          ) : hasSentInterest ? (
            <Button
              size="sm"
              variant="secondary"
              disabled
              className="w-full text-xs text-emerald-700 bg-emerald-50 border border-emerald-200"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Sent
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleProtectedAction(`/profile/${profileIdentifier}`, handleSendInterestClick)}
              className="w-full text-xs bg-[#8B1E3F] hover:bg-[#721733] text-white border-none shadow-xs cursor-pointer font-bold"
            >
              <Heart className="h-3.5 w-3.5 mr-1 fill-white/20" /> Send Interest
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
});

ProfileCard.displayName = 'ProfileCard';
