import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '../../types';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import {
  Heart,
  ShieldCheck,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

import { MatchAvatar } from '../ui/MatchAvatar';

interface ProfileCardProps {
  profile: Profile;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const { shortlistedIds, toggleShortlist, interests, sendInterest, isAuthenticated } = useApp();
  const navigate = useNavigate();

  const [isSending, setIsSending] = React.useState(false);
  const [isJustSent, setIsJustSent] = React.useState(false);

  const isShortlisted = shortlistedIds.includes(profile.id);
  const hasSentInterest = isJustSent || profile.interestSent || interests.some(i => String(i.receiverId) === String(profile.id) || String(i.user_id) === String(profile.id) || String(i.to_user) === String(profile.id));

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
      <Card className="h-full flex flex-col justify-between border-border/70 hover:border-[#8B1E3F]/40 shadow-none hover:shadow-none transition-all duration-300 group bg-white">
        <div>
          {/* Card Media Header */}
          <div className="relative aspect-[4/4.2] w-full overflow-hidden bg-stone-100">
            <MatchAvatar
              photo={profile.profileImage}
              name={profile.name}
              variant="card"
              imgClassName="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Dark Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

            {/* Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-1.5">
                {profile.verified && (
                  <Badge variant="verified" className="bg-white/90 text-emerald-800 backdrop-blur-xs font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 fill-emerald-100" /> Verified
                  </Badge>
                )}
                {profile.online && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" /> Online
                  </span>
                )}
              </div>

              {/* Shortlist Heart Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleProtectedAction(`/profile/${profile.id}`, () => toggleShortlist(profile.id));
                }}
                className={`p-2 rounded-full backdrop-blur-md transition-all ${
                  isShortlisted
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-white/70 text-gray-700 hover:bg-white hover:text-rose-500'
                }`}
                title={isShortlisted ? 'Remove from shortlist' : 'Shortlist profile'}
              >
                <Heart className={`h-4 w-4 ${isShortlisted ? 'fill-white stroke-none' : ''}`} />
              </button>
            </div>

            {/* Bottom Media Meta */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white z-10">
              <div>
                <span className="text-xs font-medium text-white/90">ID: {profile.id}</span>
              </div>
              <div className="flex items-center gap-1 bg-[#8B1E3F]/90 text-[#D4AF37] px-2.5 py-1 rounded-full text-xs font-bold shadow-md border border-[#D4AF37]/30">
                <Sparkles className="h-3.5 w-3.5" /> {profile.compatibilityScore}% Match
              </div>
            </div>
          </div>

          {/* Profile Details Content */}
          <div className="p-4 space-y-2.5">
            <div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleProtectedAction(`/profile/${profile.id}`)}
                  className="font-serif text-base sm:text-lg font-bold text-foreground hover:text-[#8B1E3F] transition-colors line-clamp-1 text-left cursor-pointer"
                >
                  {profile.name}, {profile.age}
                </button>
              </div>
              <p className="text-xs font-medium text-[#8B1E3F] mt-0.5">
                {profile.religion} • {profile.caste} {profile.subcaste ? `(${profile.subcaste})` : ''}
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-stone-800 font-semibold pt-1 border-t border-border/40">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#8B1E3F] shrink-0" />
                <span className="truncate">{profile.location.city}, {profile.location.state}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-[#8B1E3F] shrink-0" />
                <span className="truncate">{profile.profession} ({profile.annualIncome})</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-[#8B1E3F] shrink-0" />
                <span className="truncate">{profile.education}</span>
              </div>
            </div>

            <p className="text-xs text-stone-700 font-medium line-clamp-2 pt-0.5">
              "{profile.about}"
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 pt-0 grid grid-cols-2 gap-2 border-t border-border/30 mt-1 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleProtectedAction(`/profile/${profile.id}`)}
            className="w-full text-xs"
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
              onClick={() => handleProtectedAction(`/profile/${profile.id}`, handleSendInterestClick)}
              className="w-full text-xs"
            >
              <Heart className="h-3.5 w-3.5 mr-1 fill-white/20" /> Send Interest
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
