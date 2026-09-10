import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  HeartHandshake,
  XCircle,
  UserX,
  Ban,
  Loader2,
  CheckCircle2,
  Lock,
  Star
} from 'lucide-react';
import type { MatchResponseSchema } from '../../types/matching.types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAddToShortlist, useRemoveFromShortlist, useSendInterest, useAddToIgnore, useBlockProfile } from '../../hooks/useMatching';
import { useApp } from '../../context/AppContext';
import { useUIStore } from '../../store/useUIStore';

import { MatchAvatar } from '../ui/MatchAvatar';

interface RecommendationCardProps {
  match: MatchResponseSchema;
  isShortlisted?: boolean;
  isInterestSent?: boolean;
  isInterestAccepted?: boolean;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  match,
  isShortlisted = false,
  isInterestSent = false,
  isInterestAccepted = false
}) => {
  const navigate = useNavigate();
  const { showToast, addNotification } = useApp();

  const addShortlistMutation = useAddToShortlist();
  const removeShortlistMutation = useRemoveFromShortlist();
  const sendInterestMutation = useSendInterest();
  const ignoreMutation = useAddToIgnore();
  const blockMutation = useBlockProfile();

  const [isJustSent, setIsJustSent] = React.useState(false);

  const hasSentInterest = isInterestSent || isJustSent;

  const handleShortlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isShortlisted) {
        await removeShortlistMutation.mutateAsync(match.user_id);
        showToast(`Removed ${match.first_name} from shortlist.`);
      } else {
        await addShortlistMutation.mutateAsync({ user: match.user_id });
        showToast(`Added ${match.first_name} to shortlist!`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update shortlist status');
    }
  };

  const handleSendInterest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!match.user_id || match.user_id <= 0) {
      showToast('Invalid profile recipient ID.');
      return;
    }
    try {
      await sendInterestMutation.mutateAsync({ to_user: match.user_id, message: 'Hi, I am interested in your profile.' });
      setIsJustSent(true);
      showToast(`Interest expression sent to ${match.first_name || 'member'}!`);
    } catch (err: any) {
      showToast(err?.message || `Failed to send interest to ${match.first_name || 'member'}`);
    }
  };

  const handleIgnore = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ignoreMutation.mutateAsync({ user: match.user_id, reason: 'Not interested' });
      showToast(`Profile ignored.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to ignore profile');
    }
  };

  const handleBlock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Are you sure you want to block ${match.first_name}? They will not be able to contact you.`);
    if (!confirmed) return;
    try {
      await blockMutation.mutateAsync({ user: match.user_id, reason: 'Blocked by user' });
      showToast(`${match.first_name} has been blocked.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to block profile');
    }
  };

  const isLocked = match.is_unlocked === false;

  const handleProfileUnlockFlow = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col justify-between border border-stone-200/90 hover:border-[#8B1E3F]/40 shadow-xs hover:shadow-md transition-all duration-300 group bg-white rounded-2xl overflow-hidden">
        <div>
          {/* Card Media Header */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
            <MatchAvatar
              photo={match.profile_photo}
              firstName={match.first_name}
              lastName={match.last_name}
              variant="card"
              imgClassName={`h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ${isLocked ? 'filter blur-[3px] opacity-85' : ''}`}
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            {/* Shortlist Heart Button & Top Badges */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
              <div className="flex items-center gap-1.5">
                {isLocked && (
                  <span className="inline-flex items-center gap-1 bg-amber-500 text-stone-950 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-amber-400/40 backdrop-blur-xs shadow-xs">
                    <Lock className="h-2.5 w-2.5 text-stone-950" /> Locked
                  </span>
                )}
                {match.is_mutual && (
                  <span className="inline-flex items-center gap-1 bg-[#C44569] text-white text-[9.5px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs shadow-xs">
                    <HeartHandshake className="h-2.5 w-2.5" /> Mutual
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleShortlistToggle}
                disabled={addShortlistMutation.isPending || removeShortlistMutation.isPending}
                className={`p-2 rounded-full backdrop-blur-md transition-all shadow-xs cursor-pointer ${
                  isShortlisted
                    ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300 shadow-sm scale-105'
                    : 'bg-white/90 text-stone-600 hover:bg-white hover:text-amber-500'
                }`}
                title={isShortlisted ? 'Shortlisted (Click to remove)' : 'Shortlist profile'}
              >
                {addShortlistMutation.isPending || removeShortlistMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Star className={`h-3.5 w-3.5 ${isShortlisted ? 'fill-stone-950 text-stone-950' : 'text-stone-700'}`} />
                )}
              </button>
            </div>

            {/* Bottom Compatibility Badge */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white z-10">
              <span className="text-[10px] font-semibold text-white/90 uppercase tracking-wider">ID: {match.user_id}</span>
              <div className="flex items-center gap-1 bg-[#8B1E3F] text-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs border border-amber-300/30">
                <Sparkles className="h-2.5 w-2.5 text-amber-300" /> {match.match_percentage}% Match
              </div>
            </div>
          </div>

          {/* Profile Details Content */}
          <div className="p-3.5 space-y-2">
            <div>
              <button
                type="button"
                onClick={handleProfileUnlockFlow}
                className="text-base font-bold text-stone-900 hover:text-[#8B1E3F] transition-colors text-left truncate block w-full"
              >
                {match.first_name} {match.last_name}{match.age ? `, ${match.age}` : ''}
              </button>
              {Boolean(match.religion || match.caste) && (
                <p className="text-xs font-semibold text-[#8B1E3F] tracking-wide uppercase mt-0.5 truncate">
                  {[match.religion, match.caste].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>

            {/* Matching parameters fields */}
            {(match.city || match.state || match.occupation || match.education) && (
              <div className="space-y-1.5 text-xs text-stone-600 pt-1 border-t border-stone-100">
                {(match.city || match.state) && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#8B1E3F] shrink-0" />
                    <span className="truncate">{[match.city, match.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {match.occupation && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-[#8B1E3F] shrink-0" />
                    <span className="truncate">{match.occupation}</span>
                  </div>
                )}
                {match.education && (
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-[#8B1E3F] shrink-0" />
                    <span className="truncate">{match.education}</span>
                  </div>
                )}
              </div>
            )}

            {match.matched_fields && match.matched_fields.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {match.matched_fields.slice(0, 2).map((field, i) => (
                  <span key={i} className="text-[9.5px] font-semibold bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200 uppercase tracking-wide">
                    ✓ {field.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-3.5 pt-0 border-t border-stone-100">
          <div className="grid grid-cols-2 gap-2 mt-2 mb-1.5">
            {isInterestAccepted ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate(`/messages/${match.user_id}`)}
                className="w-full h-9 text-xs font-bold bg-[#8B1E3F] hover:bg-[#731834] text-white flex items-center justify-center gap-1 rounded-xl shadow-xs"
              >
                Open Chat
              </Button>
            ) : hasSentInterest ? (
              <Button
                size="sm"
                variant="secondary"
                disabled
                className="w-full h-9 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold rounded-xl"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Sent
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={handleSendInterest}
                disabled={sendInterestMutation.isPending}
                className="w-full h-9 text-xs bg-[#8B1E3F] hover:bg-[#731834] text-white font-bold rounded-xl shadow-xs"
              >
                {sendInterestMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <Heart className="h-3.5 w-3.5 mr-1 fill-white/30" />
                )}
                Interest
              </Button>
            )}

            {isLocked ? (
              <Button
                size="sm"
                variant="gold"
                onClick={handleProfileUnlockFlow}
                className="w-full h-9 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 flex items-center justify-center gap-1 rounded-xl shadow-xs"
              >
                <Lock className="h-3.5 w-3.5 text-stone-950" /> Unlock
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleProfileUnlockFlow}
                className="w-full h-9 text-xs border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 font-bold rounded-xl shadow-xs"
              >
                View Profile
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1 mt-1.5 pt-1.5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleIgnore}
              disabled={ignoreMutation.isPending}
              className="text-[10px] font-semibold text-slate-500 hover:text-amber-600 flex items-center justify-center gap-1 py-0.5 transition-colors cursor-pointer"
            >
              <XCircle className="h-3 w-3" /> Ignore
            </button>
            <button
              type="button"
              onClick={handleBlock}
              disabled={blockMutation.isPending}
              className="text-[10px] font-semibold text-slate-500 hover:text-rose-600 flex items-center justify-center gap-1 py-0.5 transition-colors cursor-pointer"
            >
              <UserX className="h-3 w-3" /> Block
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
