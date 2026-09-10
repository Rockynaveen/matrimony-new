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
  Crown,
  Zap,
  ArrowRight,
  ChevronRight,
  Star,
  Lock,
  Sliders,
  CheckCircle2,
  Users,
  Loader2,
  Send
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

  // Stats Counters
  const profileViewsCount = (apiProfile as any)?.profile_views ?? 0;
  const interestedInYouCount = receivedInterests?.length ?? 0;
  const newMessagesCount = unreadCount || 0;
  const profileMatchesCount = recommendations?.length ?? 0;

  // Profile Completion Calculation
  const completionPercentage =
    profileStatus.completion_percentage ||
    (apiProfile as any)?.profile_completion_percentage ||
    (apiProfile?.is_basic_complete ? 100 : 35);

  // Membership Data
  const planName = membershipData?.plan_name || 'Free Tier';
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
      showToast(`Interest expression sent to ${targetName}!`);
    } catch (err: any) {
      showToast(err?.message || `Failed to send interest expression`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">

      {/* ================= 1. UNIFIED HERO: GREETING & INTEGRATED STATS RIBBON ================= */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <MatchAvatar
              photo={apiProfile?.profile_photo || currentUser.avatar}
              firstName={apiProfile?.first_name || currentUser.name}
              lastName={apiProfile?.last_name}
              variant="circle"
              className="h-14 w-14 sm:h-16 sm:w-16 ring-3 ring-[#8B1E3F]/15 text-xl font-bold shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 truncate">
                  Welcome back, {firstName}! 👋
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" /> Verified Member
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Here is your live matchmaking activity and personalized recommendations today.
              </p>
            </div>
          </div>

          {/* Quick CTA Actions right in the header */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/search')}
              className="px-4 py-2 bg-gradient-to-r from-[#8B1E3F] to-[#C83259] hover:from-[#721733] hover:to-[#A82547] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" /> Find Matches
            </button>
            <button
              onClick={() => navigate('/profile/edit')}
              className="px-3.5 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5 text-stone-500" /> Edit Profile
            </button>
          </div>
        </div>

        {/* Integrated Stats Ribbon (Replaces 4 bulky individual boxes into 1 sleek bar) */}
        <div className="pt-4 border-t border-stone-100 grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-0 lg:divide-x divide-stone-100">
          
          {/* Stat 1: Profile Views */}
          <div
            onClick={() => navigate('/profile')}
            className="p-3 lg:px-4 lg:py-2 rounded-2xl hover:bg-stone-50/80 transition-colors cursor-pointer group"
          >
            <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-[#8B1E3F]" /> Profile Views
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-stone-900 group-hover:text-[#8B1E3F] transition-colors">
                {profileViewsCount}
              </span>
              <span className="text-[10px] font-bold text-stone-400">Total Visits</span>
            </div>
          </div>

          {/* Stat 2: Received Interests */}
          <div
            onClick={() => navigate('/interests')}
            className="p-3 lg:px-4 lg:py-2 rounded-2xl hover:bg-stone-50/80 transition-colors cursor-pointer group"
          >
            <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-rose-500" /> Received Interests
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-stone-900 group-hover:text-rose-600 transition-colors">
                {interestedInYouCount}
              </span>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                Expressions
              </span>
            </div>
          </div>

          {/* Stat 3: New Messages */}
          <div
            onClick={() => navigate('/messages')}
            className="p-3 lg:px-4 lg:py-2 rounded-2xl hover:bg-stone-50/80 transition-colors cursor-pointer group"
          >
            <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-purple-600" /> Conversations
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-stone-900 group-hover:text-purple-600 transition-colors">
                {newMessagesCount}
              </span>
              {newMessagesCount > 0 ? (
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md">
                  Unread
                </span>
              ) : (
                <span className="text-[10px] font-bold text-stone-400">Active</span>
              )}
            </div>
          </div>

          {/* Stat 4: AI Recommendations */}
          <div
            onClick={() => navigate('/matches')}
            className="p-3 lg:px-4 lg:py-2 rounded-2xl hover:bg-stone-50/80 transition-colors cursor-pointer group"
          >
            <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> AI Matches
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-stone-900 group-hover:text-amber-600 transition-colors">
                {profileMatchesCount}
              </span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md">
                Curated
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* ================= 2. STATUS & MEMBERSHIP BAR (Replaces 2 separate bulky containers) ================= */}
      <div className="bg-stone-900 text-white rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Profile Strength Indicator */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="relative h-11 w-11 shrink-0 flex items-center justify-center">
            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-stone-700"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-amber-400"
                strokeDasharray={`${completionPercentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[11px] font-extrabold text-amber-300">{completionPercentage}%</span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Profile Readiness</span>
              {completionPercentage < 100 && (
                <button
                  onClick={() => navigate('/profile/complete')}
                  className="text-[10px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                >
                  Complete Now →
                </button>
              )}
            </div>
            <p className="text-[11px] text-stone-300">
              {completionPercentage < 100
                ? 'Fill details and add photos to appear in more partner search results.'
                : 'Your profile is fully verified and optimized for high compatibility.'}
            </p>
          </div>
        </div>

        {/* Right: Credits & Membership Status */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-stone-800">
          <div className="text-left md:text-right">
            <span className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider flex items-center md:justify-end gap-1">
              <Crown className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> {planName}
            </span>
            <span className="text-xs font-semibold text-stone-300">
              {remainingCredits > 0 ? `${remainingCredits} Profile Credits Available` : '0 Profile Credits Left'}
            </span>
          </div>

          <button
            onClick={() => navigate('/membership')}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Zap className="h-3.5 w-3.5 fill-stone-950 text-stone-950" />
            {remainingCredits > 0 ? 'Upgrade' : 'Buy Credits'}
          </button>
        </div>

      </div>

      {/* ================= 3. CURATED RECOMMENDATIONS SHOWCASE ================= */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-stone-900">Recommended For You</h2>
            <p className="text-xs text-stone-500">Profiles aligned with your community, age, and lifestyle preferences</p>
          </div>
          <Link
            to="/matches"
            className="text-xs font-bold text-[#8B1E3F] hover:underline flex items-center gap-1 shrink-0"
          >
            View All ({profileMatchesCount}) <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isRecsLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-stone-400 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#8B1E3F]" />
            <p className="text-xs font-medium">Finding compatible matches...</p>
          </div>
        ) : curatedMatches.length === 0 ? (
          <div className="py-8 text-center space-y-3 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
            <Users className="h-8 w-8 text-stone-300 mx-auto" />
            <div>
              <p className="text-xs font-bold text-stone-700">No new recommendations right now</p>
              <p className="text-[11px] text-stone-400">Update your partner preferences to get matched with suitable profiles.</p>
            </div>
            <button
              onClick={() => navigate('/preferences')}
              className="px-4 py-1.5 bg-[#8B1E3F] text-white text-xs font-bold rounded-xl hover:bg-[#721733] transition-colors"
            >
              Update Preferences
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {curatedMatches.map((match) => {
              const fullName = `${match.first_name} ${match.last_name}`.trim();
              const hasSent = alreadySentIds.has(match.user_id) || Boolean(sentMap[match.user_id]);
              const isSending = sendInterestMutation.isPending && sendInterestMutation.variables?.to_user === match.user_id;

              return (
                <div
                  key={match.user_id}
                  onClick={() => navigate(`/profile/${match.user_id}`)}
                  className="group relative rounded-2xl border border-stone-200/80 hover:border-[#8B1E3F]/40 bg-white overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer flex flex-col justify-between"
                >
                  {/* Photo Header */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                    <MatchAvatar
                      photo={match.profile_photo}
                      firstName={match.first_name}
                      lastName={match.last_name}
                      variant="card"
                      imgClassName="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                    
                    {/* Compatibility Match Tag */}
                    {match.match_percentage && (
                      <div className="absolute top-2.5 right-2.5 bg-[#8B1E3F]/90 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-amber-300/30 shadow-xs flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5 text-amber-300" /> {match.match_percentage}%
                      </div>
                    )}

                    <div className="absolute bottom-2.5 left-2.5 text-white">
                      <h4 className="font-bold text-sm leading-tight text-white drop-shadow-xs">
                        {fullName}{match.age ? `, ${match.age}` : ''}
                      </h4>
                      <p className="text-[10px] text-white/80 font-medium">
                        {[match.religion, match.caste].filter(Boolean).join(' • ') || 'Community Member'}
                      </p>
                    </div>
                  </div>

                  {/* Body & Actions */}
                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="text-xs text-stone-500 space-y-0.5">
                      <p className="truncate font-medium text-stone-700">
                        💼 {match.occupation || 'Professional'}
                      </p>
                      <p className="truncate text-[11px] text-stone-500">
                        📍 {[match.city, match.state].filter(Boolean).join(', ') || 'India'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                      {hasSent ? (
                        <span className="flex-1 py-1.5 text-center text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200/80">
                          ✓ Interest Sent
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isSending}
                          onClick={(e) => handleQuickSendInterest(e, match.user_id, fullName)}
                          className="flex-1 py-1.5 bg-[#8B1E3F] hover:bg-[#721733] text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-2xs"
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
                          navigate(`/profile/${match.user_id}`);
                        }}
                        className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 text-[11px] font-bold rounded-xl border border-stone-200 transition-all"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ================= 4. STREAMLINED LOWER SECTION: RECENT ACTIVITY & SHORTCUTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Recent Expressions & Interactions (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900">Recent Interests Received</h3>
              <p className="text-xs text-stone-500">Profiles who recently expressed interest in connecting with you</p>
            </div>
            <Link to="/interests" className="text-xs font-bold text-[#8B1E3F] hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {!receivedInterests || receivedInterests.length === 0 ? (
              <div className="py-8 text-center space-y-2 bg-stone-50/50 rounded-2xl border border-stone-100">
                <Heart className="h-6 w-6 text-stone-300 mx-auto" />
                <p className="text-xs font-bold text-stone-600">No pending interest requests</p>
                <p className="text-[11px] text-stone-400">Keep your profile updated to attract matching proposals.</p>
              </div>
            ) : (
              receivedInterests.slice(0, 3).map((item) => {
                const senderName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Member';
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/profile/${item.from_user}`)}
                    className="p-3 rounded-2xl border border-stone-100 hover:border-[#8B1E3F]/30 hover:bg-stone-50/60 transition-all flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MatchAvatar
                        photo={item.profile_photo}
                        firstName={item.first_name}
                        lastName={item.last_name}
                        variant="circle"
                        className="h-10 w-10 text-sm ring-2 ring-stone-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs text-stone-900 truncate">
                          {senderName}{item.age ? `, ${item.age}` : ''}
                        </h5>
                        <p className="text-[11px] text-stone-500 truncate">
                          {item.occupation || 'Professional'} • {item.city || 'India'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {item.status || 'Pending'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/interests');
                        }}
                        className="text-xs font-bold text-[#8B1E3F] hover:underline"
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

        {/* Right: Quick Navigation & Account Health (5 Cols - sleek list style instead of 5 individual nested boxes) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900">Workspace Shortcuts</h3>
            <p className="text-xs text-stone-500">Quick access to key matchmaking sections</p>
          </div>

          <div className="divide-y divide-stone-100">
            {[
              {
                icon: Search,
                title: 'Advanced Search',
                desc: 'Filter matches by caste, education & location',
                link: '/search',
                badge: null
              },
              {
                icon: Star,
                title: 'Shortlisted Profiles',
                desc: 'View saved profiles for later review',
                link: '/matching/shortlist',
                badge: shortlist?.length ? `${shortlist.length} saved` : null
              },
              {
                icon: Sliders,
                title: 'Partner Preferences',
                desc: 'Fine-tune your automated match criteria',
                link: '/preferences',
                badge: null
              },
              {
                icon: ShieldCheck,
                title: 'Trust & Verification',
                desc: isVerified ? 'Identity verified badge active' : 'Verify ID to boost credibility',
                link: '/verification',
                badge: isVerified ? 'Verified' : 'Pending'
              }
            ].map((shortcut, idx) => {
              const Icon = shortcut.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(shortcut.link)}
                  className="py-2.5 flex items-center justify-between hover:bg-stone-50/80 -mx-2 px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center shrink-0 group-hover:bg-[#8B1E3F] group-hover:text-white transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-stone-800 group-hover:text-[#8B1E3F] transition-colors truncate">
                        {shortcut.title}
                      </h4>
                      <p className="text-[10px] text-stone-400 font-medium truncate">
                        {shortcut.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {shortcut.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        shortcut.badge === 'Verified'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {shortcut.badge}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-600 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
