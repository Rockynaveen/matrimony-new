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
  CheckCircle2
} from 'lucide-react';
import type { MatchResponseSchema } from '../../types/matching.types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAddToShortlist, useRemoveFromShortlist, useSendInterest, useAddToIgnore, useBlockProfile } from '../../hooks/useMatching';
import { useApp } from '../../context/AppContext';

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

  const localSentSet = React.useMemo(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('local_sent_interest_user_ids') || '[]'));
    } catch {
      return new Set();
    }
  }, [isJustSent, isInterestSent]);

  const hasSentInterest = isInterestSent || isJustSent || localSentSet.has(match.user_id) || localSentSet.has(String(match.user_id));

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
      setIsJustSent(true);
      try {
        const stored = JSON.parse(localStorage.getItem('local_sent_interest_user_ids') || '[]');
        stored.push(match.user_id);
        stored.push(String(match.user_id));
        localStorage.setItem('local_sent_interest_user_ids', JSON.stringify(stored));
      } catch {}

      await sendInterestMutation.mutateAsync({ to_user: match.user_id, message: 'Hi, I am interested in your profile.' });
      addNotification({
        title: 'Interest Sent!',
        message: `Your interest request was sent to ${match.first_name || 'member'}.`,
        category: 'Interests',
        link: '/interests',
        avatar: match.profile_photo
      });
      showToast(`Interest expression sent to ${match.first_name || 'member'}!`);
    } catch (err: any) {
      setIsJustSent(true);
      showToast(err?.message || `Interest expression sent to ${match.first_name || 'member'}!`);
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

  const defaultPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600';
  const displayPhoto = match.profile_photo || defaultPhoto;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col justify-between border-stone-200/80 hover:border-[#8B1E3F]/40 shadow-none hover:shadow-md transition-all duration-300 group bg-white rounded-2xl overflow-hidden">
        <div>
          {/* Card Media Header */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-50">
            <img
              src={displayPhoto}
              alt={`${match.first_name} ${match.last_name}`}
              className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            {/* Shortlist Heart Button & Top Badges */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
              <div className="flex items-center gap-1.5">
                {match.is_mutual && (
                  <span className="inline-flex items-center gap-1 bg-[#8B1E3F]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                    <HeartHandshake className="h-2.5 w-2.5" /> Mutual
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleShortlistToggle}
                disabled={addShortlistMutation.isPending || removeShortlistMutation.isPending}
                className={`p-2 rounded-full backdrop-blur-md transition-all border border-stone-200/20 ${
                  isShortlisted
                    ? 'bg-[#8B1E3F] text-white shadow-sm'
                    : 'bg-white/75 text-stone-700 hover:bg-white hover:text-[#8B1E3F]'
                }`}
                title={isShortlisted ? 'Remove from shortlist' : 'Shortlist profile'}
              >
                {addShortlistMutation.isPending || removeShortlistMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Heart className={`h-3 w-3 ${isShortlisted ? 'fill-white stroke-none' : ''}`} />
                )}
              </button>
            </div>

            {/* Bottom Compatibility Badge */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white z-10">
              <span className="text-[9px] font-bold text-white/90 uppercase tracking-wider">ID: {match.user_id}</span>
              <div className="flex items-center gap-1 bg-[#8B1E3F]/90 text-[#D4AF37] px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm border border-[#D4AF37]/35">
                <Sparkles className="h-2.5 w-2.5 text-[#D4AF37]" /> {match.match_percentage}% Match
              </div>
            </div>
          </div>

          {/* Profile Details Content */}
          <div className="p-3 space-y-1.5">
            <div>
              <button
                type="button"
                onClick={() => navigate(`/profile/${match.user_id}`)}
                className="font-serif text-sm sm:text-base font-bold text-stone-900 hover:text-[#8B1E3F] transition-colors text-left truncate block w-full"
              >
                {match.first_name} {match.last_name}{match.age ? `, ${match.age}` : ''}
              </button>
              <p className="text-[10px] font-bold text-[#8B1E3F] tracking-wide uppercase mt-0.5 truncate">
                {match.religion} • {match.caste}
              </p>
            </div>

            {/* Matching parameters fields */}
            <div className="space-y-1 text-[11px] text-stone-600 pt-1 border-t border-stone-100">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-[#8B1E3F] shrink-0" />
                <span className="truncate">{match.city || 'Not specified'}, {match.state || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-3 w-3 text-[#8B1E3F] shrink-0" />
                <span className="truncate">{match.occupation || 'Professional'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-3 w-3 text-[#8B1E3F] shrink-0" />
                <span className="truncate">{match.education || 'Education Details'}</span>
              </div>
            </div>

            {match.matched_fields && match.matched_fields.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {match.matched_fields.slice(0, 2).map((field, i) => (
                  <span key={i} className="text-[8.5px] font-bold bg-[#8B1E3F]/5 text-[#8B1E3F] px-1.5 py-0.5 rounded-md border border-[#8B1E3F]/10 uppercase tracking-wide">
                    ✓ {field.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-3 pt-0 border-t border-stone-50">
          <div className="grid grid-cols-2 gap-1.5 mt-2 mb-1">
            {isInterestAccepted ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate(`/messages/${match.user_id}`)}
                className="w-full h-8 text-[11px] font-bold bg-[#8B1E3F] hover:bg-[#721733] text-white flex items-center justify-center gap-1 rounded-xl"
              >
                Open Chat
              </Button>
            ) : hasSentInterest ? (
              <Button
                size="sm"
                variant="secondary"
                disabled
                className="w-full h-8 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 font-bold rounded-xl"
              >
                <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> Sent
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={handleSendInterest}
                disabled={sendInterestMutation.isPending}
                className="w-full h-8 text-[11px] bg-[#8B1E3F] hover:bg-[#721733] text-white font-bold rounded-xl"
              >
                {sendInterestMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Heart className="h-3 w-3 mr-1 fill-white/20" />
                )}
                Interest
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/profile/${match.user_id}`)}
              className="w-full h-8 text-[11px] border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl"
            >
              View Profile
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-1 mt-1.5 pt-1 border-t border-stone-50/50">
            <button
              type="button"
              onClick={handleIgnore}
              disabled={ignoreMutation.isPending}
              className="text-[9.5px] font-bold text-stone-500 hover:text-amber-700 flex items-center justify-center gap-1 py-0.5"
            >
              <XCircle className="h-2.5 w-2.5" /> Ignore
            </button>
            <button
              type="button"
              onClick={handleBlock}
              disabled={blockMutation.isPending}
              className="text-[9.5px] font-bold text-stone-500 hover:text-rose-700 flex items-center justify-center gap-1 py-0.5"
            >
              <UserX className="h-2.5 w-2.5" /> Block
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
