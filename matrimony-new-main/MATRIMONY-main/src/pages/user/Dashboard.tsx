import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp, extractNameFromEmail, isGenericName } from '../../context/AppContext';
import { useProfile } from '../../hooks/useProfile';
import {
  useRecommendations,
  useReceivedInterests,
  useSentInterests,
  useShortlist,
  useSendInterest
} from '../../hooks/useMatching';
import { useMyMembership } from '../../hooks/useMembership';
import {
  Search,
  Edit3,
  Eye,
  Heart,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Users,
  Loader2,
  Send,
  Check,
  CheckCircle2
} from 'lucide-react';
import { MatchAvatar } from '../../components/ui/MatchAvatar';

export const Dashboard: React.FC = () => {
  const { currentUser, verificationStatus, unreadCount, profileStatus, showToast } = useApp();
  const navigate = useNavigate();

  const { data: apiProfile } = useProfile();
  const { data: recommendations, isLoading: isRecsLoading } = useRecommendations();
  const { data: receivedInterests } = useReceivedInterests();
  const { data: sentInterests } = useSentInterests();
  const { data: shortlist } = useShortlist();
  const { data: membershipData } = useMyMembership();
  const sendInterestMutation = useSendInterest();

  const [sentMap, setSentMap] = useState<Record<number, boolean>>({});

  // Display Name Calculation
  const rawName =
    (apiProfile?.first_name ? `${apiProfile.first_name} ${apiProfile.last_name || ''}`.trim() : null) ||
    (currentUser.name && !isGenericName(currentUser.name) ? currentUser.name : null) ||
    extractNameFromEmail(currentUser.email || localStorage.getItem('logged_in_email'));

  const firstName = rawName.split(' ')[0] || 'Member';

  // Numeric and KM ID
  const numericId =
    apiProfile?.id ||
    (currentUser?.id ? parseInt(String(currentUser.id).replace(/\D/g, ''), 10) : 0) ||
    24;
  const kmId = `KM${String(numericId).padStart(6, '0')}`;

  // Stats Counters
  const profileViewsCount = (apiProfile as any)?.profile_views ?? 142;
  const interestedInYouCount = receivedInterests?.length ?? 0;
  const newMessagesCount = unreadCount || 0;
  const profileMatchesCount = recommendations?.length ?? 0;

  // Profile Completion Calculation
  const completionPercentage =
    profileStatus.completion_percentage ||
    (apiProfile as any)?.profile_completion_percentage ||
    (apiProfile?.is_basic_complete ? 95 : 75);

  // Membership Data
  const planName = membershipData?.plan_name || 'Free Member';
  const remainingCredits = membershipData?.remaining_credits ?? 0;
  const isVerified =
    verificationStatus === 'VERIFIED' ||
    Boolean((apiProfile as any)?.is_verified) ||
    Boolean(currentUser.verified);

  // Top 3 Curated Matches
  const curatedMatches = (recommendations || []).slice(0, 3);

  // Already sent list IDs
  const alreadySentIds = new Set(
    (sentInterests || []).map((i) => Number(i.to_user || (i as any).user_id))
  );

  const handleQuickSendInterest = async (e: React.MouseEvent, targetUserId: number, targetName: string) => {
    e.stopPropagation();
    try {
      setSentMap((prev) => ({ ...prev, [targetUserId]: true }));
      await sendInterestMutation.mutateAsync({
        to_user: targetUserId,
        message: 'Hi, I am interested in your profile.'
      });
      showToast(`Interest sent to ${targetName}`);
    } catch (err: any) {
      showToast(err?.message || `Failed to send interest`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-sans text-stone-900 space-y-8">

      {/* ─────────────────────────────────────────────────────────────
          1. CLEAN HEADER: GREETING & SIMPLE ACTIONS
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Welcome, {firstName}
            </h1>
            {isVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-stone-500 font-medium">
            ID: <span className="font-mono text-stone-700 font-semibold">{kmId}</span> • {planName} • {profileMatchesCount} matching profiles found
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="px-4 py-2 bg-[#8B1E3F] hover:bg-[#731834] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" /> Find Matches
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile/edit')}
            className="px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5 text-stone-500" /> Edit Profile
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SIMPLE STATS STRIP (CLEAN FLAT DESIGN, NO BULKY CARDS)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 sm:p-5 bg-stone-50/70 border border-stone-200 rounded-xl">
        
        <div
          onClick={() => navigate('/profile')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="text-xs text-stone-500 font-medium flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-stone-400" /> Profile Views
          </span>
          <p className="text-xl font-bold text-stone-900 mt-1">
            {profileViewsCount}
          </p>
          <span className="text-[11px] text-stone-400">Total visits</span>
        </div>

        <div
          onClick={() => navigate('/interests')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="text-xs text-stone-500 font-medium flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-rose-500" /> Interests
          </span>
          <p className="text-xl font-bold text-stone-900 mt-1">
            {interestedInYouCount}
          </p>
          <span className="text-[11px] text-stone-400">Received requests</span>
        </div>

        <div
          onClick={() => navigate('/messages')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="text-xs text-stone-500 font-medium flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-stone-400" /> Messages
          </span>
          <p className="text-xl font-bold text-stone-900 mt-1">
            {newMessagesCount}
          </p>
          <span className="text-[11px] text-stone-400">
            {newMessagesCount > 0 ? 'Unread messages' : 'All caught up'}
          </span>
        </div>

        <div
          onClick={() => navigate('/matches')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="text-xs text-stone-500 font-medium flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Match Proposals
          </span>
          <p className="text-xl font-bold text-stone-900 mt-1">
            {profileMatchesCount}
          </p>
          <span className="text-[11px] text-stone-400">Recommended for you</span>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. RECOMMENDED MATCHES (CLEAN, MINIMALIST LISTING)
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-900 tracking-tight">
              Recommended Matches
            </h2>
            <p className="text-xs text-stone-500">
              Compatible profiles based on your community, location, and lifestyle preferences
            </p>
          </div>
          <Link
            to="/matches"
            className="text-xs font-medium text-[#8B1E3F] hover:underline flex items-center gap-1"
          >
            View all ({profileMatchesCount}) <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isRecsLoading ? (
          <div className="py-12 text-center text-stone-400 flex items-center justify-center gap-2 text-xs">
            <Loader2 className="h-4 w-4 animate-spin text-[#8B1E3F]" />
            <span>Loading recommendations...</span>
          </div>
        ) : curatedMatches.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-stone-200 rounded-xl space-y-2 bg-stone-50/40">
            <Users className="h-6 w-6 text-stone-400 mx-auto" />
            <p className="text-xs font-semibold text-stone-700">No matching recommendations right now</p>
            <p className="text-xs text-stone-500">Update your partner preferences to see better match suggestions.</p>
            <button
              type="button"
              onClick={() => navigate('/preferences')}
              className="mt-2 text-xs font-semibold text-[#8B1E3F] hover:underline cursor-pointer"
            >
              Update Preferences →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {curatedMatches.map((match) => {
              const fullName = `${match.first_name} ${match.last_name}`.trim();
              const profileIdentifier = (match as any).user_uuid || (match as any).member_id || (match as any).uuid || match.user_id;
              const hasSent = alreadySentIds.has(match.user_id) || Boolean(sentMap[match.user_id]);
              const isSending =
                sendInterestMutation.isPending && sendInterestMutation.variables?.to_user === match.user_id;

              return (
                <div
                  key={match.user_id}
                  onClick={() => navigate(`/profile/${profileIdentifier}`)}
                  className="p-4 bg-white border border-stone-200 hover:border-stone-400 rounded-xl transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <MatchAvatar
                      photo={match.profile_photo}
                      firstName={match.first_name}
                      lastName={match.last_name}
                      variant="circle"
                      className="h-12 w-12 text-sm shrink-0 border border-stone-200"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-sm font-semibold text-stone-900 truncate">
                          {fullName}{match.age ? `, ${match.age}` : ''}
                        </h4>
                        {match.match_percentage && (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                            {match.match_percentage}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 truncate">
                        {[match.religion, match.caste].filter(Boolean).join(' • ') || 'Community Member'}
                      </p>
                      <p className="text-xs text-stone-500 truncate">
                        {match.occupation || 'Professional'} • {[match.city, match.state].filter(Boolean).join(', ') || 'India'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                    {hasSent ? (
                      <span className="flex-1 py-1.5 text-center text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg">
                        ✓ Sent
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isSending}
                        onClick={(e) => handleQuickSendInterest(e, match.user_id, fullName)}
                        className="flex-1 py-1.5 bg-[#8B1E3F] hover:bg-[#731834] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {isSending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        Send Interest
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${profileIdentifier}`);
                      }}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. RECENT INTERESTS RECEIVED
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
            Recent Interests Received
          </h3>
          <Link to="/interests" className="text-xs text-[#8B1E3F] hover:underline font-medium">
            View all
          </Link>
        </div>

        <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 bg-white overflow-hidden">
          {!receivedInterests || receivedInterests.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500 space-y-1">
              <Heart className="h-5 w-5 text-stone-300 mx-auto" />
              <p className="font-medium text-stone-700">No pending interest requests</p>
              <p className="text-[11px] text-stone-400">Keep your profile updated to attract match requests.</p>
            </div>
          ) : (
            receivedInterests.slice(0, 5).map((item) => {
              const senderName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Member';
              const senderIdentifier = (item as any).from_user_uuid || (item as any).user_uuid || (item as any).from_user_member_id || (item as any).member_id || item.from_user;
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/profile/${senderIdentifier}`)}
                  className="p-3.5 hover:bg-stone-50/80 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MatchAvatar
                      photo={item.profile_photo}
                      firstName={item.first_name}
                      lastName={item.last_name}
                      variant="circle"
                      className="h-10 w-10 text-xs shrink-0 border border-stone-200"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-900 truncate">
                        {senderName}{item.age ? `, ${item.age}` : ''}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate">
                        {item.occupation || 'Professional'} • {item.city || 'India'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      {item.status || 'Pending'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/interests');
                      }}
                      className="text-xs font-semibold text-[#8B1E3F] hover:underline"
                    >
                      Respond
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
