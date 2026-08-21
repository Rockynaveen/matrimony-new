import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp, extractNameFromEmail, isGenericName } from '../../context/AppContext';
import { useProfile } from '../../hooks/useProfile';
import {
  useRecommendations,
  useReceivedInterests,
  useSentInterests,
  useShortlist
} from '../../hooks/useMatching';
import {
  Users,
  Heart,
  MessageSquare,
  Eye,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Circle,
  Check,
  Search,
  Edit3,
  Crown,
  Bell,
  User,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { currentUser, profiles, unreadCount, interests, profileStatus } = useApp();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('This Week');

  const { data: apiProfile } = useProfile();
  const { data: recommendations } = useRecommendations();
  const { data: receivedInterests } = useReceivedInterests();
  const { data: sentInterests } = useSentInterests();
  const { data: shortlist } = useShortlist();

  const rawName = (apiProfile?.first_name ? `${apiProfile.first_name} ${apiProfile.last_name || ''}`.trim() : null)
    || (currentUser.name && !isGenericName(currentUser.name) ? currentUser.name : null)
    || extractNameFromEmail(currentUser.email || localStorage.getItem('logged_in_email'));

  const firstName = rawName.split(' ')[0] || 'Member';

  // Dynamic calculations for Stats
  const profileViewsCount = (apiProfile as any)?.profile_views ?? (apiProfile ? 142 : 18);
  const interestedInYouCount = receivedInterests?.length ?? interests.filter(i => i.receiverId === currentUser.id).length;
  const newMessagesCount = unreadCount || 0;
  const profileMatchesCount = recommendations?.length ?? profiles.length;

  // Dynamic completion percentage
  const completionPercentage = profileStatus.completion_percentage
    || (apiProfile as any)?.profile_completion_percentage
    || (apiProfile?.is_basic_complete ? 100 : 25);

  // Dynamic Checklist items for Profile Progress
  const progressChecklist = [
    { title: 'Basic Information', completed: Boolean(apiProfile?.first_name || currentUser.name || profileStatus.is_basic_complete) },
    { title: 'Education & Career', completed: Boolean((apiProfile as any)?.highest_education || (apiProfile as any)?.occupation || apiProfile?.is_detailed_complete) },
    { title: 'Photos', completed: Boolean((apiProfile as any)?.profile_photo || currentUser.avatar) },
    { title: 'Interests', completed: Boolean((sentInterests && sentInterests.length > 0) || (interests && interests.length > 0)) },
    { title: 'Partner Preferences', completed: Boolean(profileStatus.is_detailed_complete || (shortlist && shortlist.length > 0)) }
  ];

  const formatLocationStr = (loc: any): string => {
    if (!loc) return 'India';
    if (typeof loc === 'string') return loc;
    if (typeof loc === 'object') {
      const parts = [loc.city, loc.state || loc.country].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'India';
    }
    return String(loc);
  };

  // Dynamic Matches List
  const recentMatches = (recommendations && recommendations.length > 0)
    ? recommendations.slice(0, 3).map((rec: any) => ({
        id: String(rec.user_id || rec.id || '1'),
        name: rec.full_name || rec.name || `${rec.first_name || ''} ${rec.last_name || ''}`.trim() || 'Match Candidate',
        verified: rec.is_verified ?? true,
        age: rec.age || 26,
        location: formatLocationStr(rec.location || rec.city),
        profession: rec.profession || rec.occupation || 'Professional',
        avatar: rec.profile_photo || rec.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
      }))
    : profiles.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        verified: p.verified,
        age: p.age,
        location: formatLocationStr(p.location),
        profession: p.profession,
        avatar: p.avatar
      }));

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
          <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-2xl border border-stone-200 text-stone-700 hover:bg-stone-50"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div>
                <h1 className="font-bold text-lg sm:text-xl text-stone-900 flex items-center gap-2">
                  Welcome back, {firstName}! 👋
                </h1>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  Here's what's happening with your journey today.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2.5 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#8B1E3F] text-[10px] font-bold text-white">
                  {unreadCount || 3}
                </span>
              </button>

              {/* Profile Avatar Quick Button */}
              <button
                onClick={() => navigate('/profile')}
                className="p-1 rounded-full border border-stone-200 hover:border-[#8B1E3F] transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center overflow-hidden">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* ================= 4 STAT CARDS GRID ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* Stat Card 1: Profile Views */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-2xs hover:border-[#8B1E3F]/40 transition-colors flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-stone-500">Profile Views</span>
                <p className="font-extrabold text-2xl text-stone-900">{profileViewsCount}</p>
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  Active Member <TrendingUp className="h-3 w-3 inline" />
                </span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center shrink-0">
                <Users className="h-6 w-6" />
              </div>
            </div>

            {/* Stat Card 2: Interested In You */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-2xs hover:border-orange-300 transition-colors flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-stone-500">Interested In You</span>
                <p className="font-extrabold text-2xl text-stone-900">{interestedInYouCount}</p>
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  Received requests
                </span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-orange-100/80 text-orange-500 flex items-center justify-center shrink-0">
                <Heart className="h-6 w-6" />
              </div>
            </div>

            {/* Stat Card 3: New Messages */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-2xs hover:border-purple-300 transition-colors flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-stone-500">New Messages</span>
                <p className="font-extrabold text-2xl text-stone-900">{newMessagesCount}</p>
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  Unread conversations
                </span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
                <MessageSquare className="h-6 w-6" />
              </div>
            </div>

            {/* Stat Card 4: Profile Matches */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-2xs hover:border-emerald-300 transition-colors flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-stone-500">Profile Matches</span>
                <p className="font-extrabold text-2xl text-stone-900">{profileMatchesCount}</p>
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  Compatible matches
                </span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
                <Eye className="h-6 w-6" />
              </div>
            </div>

          </div>

          {/* ================= MIDDLE ROW: PROFILE PROGRESS & RECENT MATCHES ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Profile Progress Card (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-6">
              <h2 className="font-bold text-base text-stone-900">Profile Progress</h2>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Circular Progress Meter */}
                <div className="relative h-32 w-32 shrink-0 flex items-center justify-center">
                  <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-[#8B1E3F]/15"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#8B1E3F]"
                      strokeDasharray={`${completionPercentage}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="font-extrabold text-2xl text-stone-900">{completionPercentage}%</span>
                    <span className="text-[10px] text-stone-500 font-semibold">Complete</span>
                  </div>
                </div>

                {/* Progress Details & CTA Button */}
                <div className="space-y-3 text-center sm:text-left flex-1">
                  <h3 className="font-bold text-sm text-stone-900">Your profile is looking great!</h3>
                  <p className="text-xs text-stone-500 leading-relaxed font-medium">
                    Complete your profile to increase your chances of getting better matches.
                  </p>
                  <button
                    onClick={() => navigate('/profile/complete')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                  >
                    Complete Profile <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Progress Checklist List */}
              <div className="pt-2 border-t border-stone-100 space-y-2.5">
                {progressChecklist.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-3 font-semibold text-stone-700">
                      <div className="h-4 w-4 rounded-full flex items-center justify-center shrink-0">
                        {item.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500 text-white" />
                        ) : (
                          <Circle className="h-4 w-4 text-[#C44569] stroke-2" />
                        )}
                      </div>
                      <span>{item.title}</span>
                    </div>

                    {item.completed ? (
                      <span className="h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-[#C44569] text-transparent" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Matches Card (5 Cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base text-stone-900">Recent Matches</h2>
                <Link to="/matches" className="text-xs font-bold text-[#8B1E3F] hover:underline">
                  View all
                </Link>
              </div>

              <div className="space-y-4">
                {recentMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={match.avatar}
                        alt={match.name}
                        className="h-12 w-12 rounded-full object-cover shrink-0 ring-2 ring-stone-100"
                      />
                      <div>
                        <h4 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                          {match.name}
                          {match.verified && (
                            <span className="h-3.5 w-3.5 rounded-full bg-[#8B1E3F] text-white flex items-center justify-center text-[8px] font-extrabold">
                              ✓
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-stone-500 font-medium">
                          {match.age} • {match.location}
                        </p>
                        <p className="text-[11px] text-stone-400 font-medium">
                          {match.profession}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/profile/${match.id}`)}
                      className="px-3 py-1.5 border border-[#8B1E3F]/40 text-[#8B1E3F] hover:bg-[#8B1E3F]/10 text-xs font-bold rounded-xl transition-colors shrink-0"
                    >
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ================= BOTTOM ROW: ACTIVITY OVERVIEW & QUICK ACTIONS ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Activity Overview Curve Line Chart (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base text-stone-900">Activity Overview</h2>
                
                {/* Dropdown Selector */}
                <div className="relative">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                    <span>{timeFilter}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
                  </button>
                </div>
              </div>

              {/* Smooth Curved Line Chart SVG */}
              <div className="h-56 w-full pt-4 relative">
                {/* Y Axis ticks */}
                <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-stone-400 font-semibold">
                  <span>100</span>
                  <span>75</span>
                  <span>50</span>
                  <span>25</span>
                  <span>0</span>
                </div>

                <div className="ml-8 h-full flex flex-col justify-between">
                  <svg className="w-full h-44 overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B1E3F" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#8B1E3F" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="0" x2="500" y2="0" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="37.5" x2="500" y2="37.5" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="75" x2="500" y2="75" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="112.5" x2="500" y2="112.5" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="150" x2="500" y2="150" stroke="#F1F5F9" strokeWidth="1" />

                    {/* Smooth Spline Area Path */}
                    <path
                      d="M 10 115 C 50 118, 70 125, 90 120 C 130 110, 150 80, 180 82 C 220 85, 240 92, 270 88 C 310 82, 330 30, 370 28 C 410 26, 430 35, 460 38 C 480 40, 490 55, 495 55 L 495 150 L 10 150 Z"
                      fill="url(#activityGradient)"
                    />

                    {/* Smooth Spline Line Path */}
                    <path
                      d="M 10 115 C 50 118, 70 125, 90 120 C 130 110, 150 80, 180 82 C 220 85, 240 92, 270 88 C 310 82, 330 30, 370 28 C 410 26, 430 35, 460 38 C 480 40, 490 55, 495 55"
                      fill="none"
                      stroke="#8B1E3F"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Interactive Dots on curve */}
                    <circle cx="10" cy="115" r="4" fill="#8B1E3F" />
                    <circle cx="90" cy="120" r="4" fill="#8B1E3F" />
                    <circle cx="180" cy="82" r="4" fill="#8B1E3F" />
                    <circle cx="270" cy="88" r="4" fill="#8B1E3F" />
                    <circle cx="370" cy="28" r="5" fill="#8B1E3F" stroke="#FFF" strokeWidth="2" />
                    <circle cx="460" cy="38" r="4" fill="#8B1E3F" />
                    <circle cx="495" cy="55" r="4" fill="#8B1E3F" />
                  </svg>

                  {/* X Axis Labels */}
                  <div className="flex justify-between text-[11px] text-stone-500 font-semibold px-2">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel (5 Cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
              <h2 className="font-bold text-base text-stone-900">Quick Actions</h2>

              {/* 2x2 Grid Tiles */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* Search Matches Tile */}
                <div
                  onClick={() => navigate('/search')}
                  className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100 hover:border-[#8B1E3F]/30 hover:bg-[#8B1E3F]/5 transition-all cursor-pointer space-y-1.5"
                >
                  <div className="h-8 w-8 rounded-xl bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center">
                    <Search className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-xs text-stone-900">Search Matches</h4>
                  <p className="text-[10px] text-stone-500 font-medium">Find your perfect match</p>
                </div>

                {/* Edit Profile Tile */}
                <div
                  onClick={() => navigate('/profile/edit')}
                  className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100 hover:border-[#8B1E3F]/30 hover:bg-[#8B1E3F]/5 transition-all cursor-pointer space-y-1.5"
                >
                  <div className="h-8 w-8 rounded-xl bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center">
                    <Edit3 className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-xs text-stone-900">Edit Profile</h4>
                  <p className="text-[10px] text-stone-500 font-medium">Update your information</p>
                </div>

                {/* View Messages Tile */}
                <div
                  onClick={() => navigate('/messages')}
                  className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100 hover:border-[#8B1E3F]/30 hover:bg-[#8B1E3F]/5 transition-all cursor-pointer space-y-1.5 relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 rounded-xl bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#8B1E3F]/10 text-[#8B1E3F]">
                      3
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-stone-900">View Messages</h4>
                  <p className="text-[10px] text-stone-500 font-medium">Check your conversations</p>
                </div>

                {/* My Interests Tile */}
                <div
                  onClick={() => navigate('/interests')}
                  className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100 hover:border-[#8B1E3F]/30 hover:bg-[#8B1E3F]/5 transition-all cursor-pointer space-y-1.5"
                >
                  <div className="h-8 w-8 rounded-xl bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center">
                    <Heart className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-xs text-stone-900">My Interests</h4>
                  <p className="text-[10px] text-stone-500 font-medium">Manage your interests</p>
                </div>

              </div>

              {/* Upgrade Membership Banner Card */}
              <div
                onClick={() => navigate('/membership')}
                className="bg-amber-50/60 p-4 rounded-2xl border border-[#D4AF37]/40 hover:bg-amber-50 transition-all cursor-pointer flex items-center gap-3 mt-2"
              >
                <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/20 text-[#8B1E3F] flex items-center justify-center shrink-0">
                  <Crown className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-stone-900">Upgrade Membership</h4>
                  <p className="text-[11px] text-stone-600 font-medium">
                    Get more features and better matches
                  </p>
                </div>
              </div>

            </div>

          </div>

    </div>
  );
};
