import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp, extractNameFromEmail, isGenericName } from '../../context/AppContext';
import { useProfile } from '../../hooks/useProfile';
import { useMyMembership } from '../../hooks/useMembership';
import {
  useShortlist,
  useIgnoredProfiles,
  useBlockedProfiles,
  useSentInterests,
  useReceivedInterests,
  useRecommendations
} from '../../hooks/useMatching';
import { usePhotoRequests } from '../../hooks/usePrivacyReports';
import { MatchAvatar } from '../ui/MatchAvatar';
import {
  User,
  Edit3,
  LayoutDashboard,
  Search,
  Heart,
  MessageSquare,
  Bell,
  Sliders,
  Star,
  EyeOff,
  Ban,
  Lock,
  LogOut,
  ShieldCheck,
  Camera,
  Crown,
  Sparkles,
  ChevronRight,
  Eye
} from 'lucide-react';

interface UserSidebarProps {
  onNavClick?: () => void;
  className?: string;
}

export const UserSidebar: React.FC<UserSidebarProps> = ({ onNavClick, className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, verificationStatus, unreadCount, shortlistedIds, profileStatus, logout } = useApp();

  const handleLogout = () => {
    if (onNavClick) onNavClick();
    logout();
    navigate('/login');
  };

  const { data: apiProfile } = useProfile();
  const { data: membershipData } = useMyMembership();
  const { data: recommendations } = useRecommendations();
  const { data: shortlistData } = useShortlist();
  const { data: ignoredData } = useIgnoredProfiles();
  const { data: blockedData } = useBlockedProfiles();
  const { data: sentInterests } = useSentInterests();
  const { data: receivedInterests } = useReceivedInterests();
  const { data: photoRequestsData } = usePhotoRequests();

  const shortlistCount = shortlistData?.length ?? shortlistedIds.length;
  const ignoredCount = ignoredData?.length ?? 0;
  const blockedCount = blockedData?.length ?? 0;
  const totalInterestsCount = (sentInterests?.length || 0) + (receivedInterests?.length || 0);
  const pendingPhotoRequestsCount = (photoRequestsData || []).filter(
    (r) => !r.status || r.status.toLowerCase() === 'pending'
  ).length;

  const profileViewsCount = (apiProfile as any)?.profile_views ?? 0;

  // Kalyan Matrimony ID format: KM102948
  const numericId =
    apiProfile?.id ||
    (currentUser?.id ? parseInt(String(currentUser.id).replace(/\D/g, ''), 10) : 0) ||
    104829;
  const kmId = `KM${String(numericId).padStart(6, '0')}`;

  const rawName =
    (apiProfile?.first_name ? `${apiProfile.first_name} ${apiProfile.last_name || ''}`.trim() : null) ||
    (currentUser.name && !isGenericName(currentUser.name) ? currentUser.name : null) ||
    extractNameFromEmail(currentUser.email || localStorage.getItem('logged_in_email'));

  const displayName = rawName.toUpperCase();
  const userEmail = currentUser.email || localStorage.getItem('logged_in_email') || '';

  const planName = membershipData?.plan_name || 'Free Member';

  const completionPercentage =
    profileStatus.completion_percentage ||
    (apiProfile as any)?.profile_completion_percentage ||
    (apiProfile?.is_basic_complete ? 100 : 35);

  const isVerified =
    verificationStatus === 'VERIFIED' ||
    Boolean((apiProfile as any)?.is_verified) ||
    Boolean(currentUser.verified);

  // Kalyan Matrimony Grouped Navigation Sections
  const navSections = [
    {
      title: 'MATCHES & DISCOVERY',
      items: [
        { label: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard },
        {
          label: 'Recommendations',
          path: '/matches',
          icon: Sparkles,
          badge: recommendations?.length ? `${recommendations.length}` : undefined,
          badgeColor: 'bg-amber-100 text-amber-900 border border-amber-200'
        },
        { label: 'Search Profiles', path: '/search', icon: Search },
      ]
    },
    {
      title: 'MY PROFILE',
      items: [
        { label: 'View Profile', path: '/profile', icon: User },
        { label: 'Edit Profile', path: '/profile/edit', icon: Edit3 },
        { label: 'Manage Photos', path: '/photos', icon: Camera },
        { label: 'Partner Preferences', path: '/preferences', icon: Sliders },
        {
          label: 'Trust & Verification',
          path: '/verification',
          icon: ShieldCheck,
          badge: isVerified ? 'Verified' : 'Pending',
          badgeColor: isVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
        },
      ]
    },
    {
      title: 'COMMUNICATION',
      items: [
        {
          label: 'Expressions of Interest',
          path: '/interests',
          icon: Heart,
          badge: totalInterestsCount > 0 ? totalInterestsCount : undefined,
          badgeColor: 'bg-[#8B1E3F]/10 text-[#8B1E3F]'
        },
        {
          label: 'Chat Messages',
          path: '/messages',
          icon: MessageSquare,
          badge: unreadCount > 0 ? unreadCount : undefined,
          badgeColor: 'bg-[#8B1E3F] text-white'
        },
        {
          label: 'Photo Requests',
          path: '/privacy-settings',
          icon: Camera,
          badge: pendingPhotoRequestsCount > 0 ? pendingPhotoRequestsCount : undefined,
          badgeColor: 'bg-[#8B1E3F] text-white'
        },
        {
          label: 'Notifications',
          path: '/notifications',
          icon: Bell,
          badge: unreadCount > 0 ? unreadCount : undefined,
          badgeColor: 'bg-[#8B1E3F]/10 text-[#8B1E3F]'
        },
      ]
    },
    {
      title: 'SAVED & PRIVACY',
      items: [
        {
          label: 'Shortlisted Profiles',
          path: '/matching/shortlist',
          icon: Star,
          badge: shortlistCount > 0 ? shortlistCount : undefined,
          badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200'
        },
        {
          label: 'Ignored Profiles',
          path: '/matching/ignored',
          icon: EyeOff,
          badge: ignoredCount > 0 ? ignoredCount : undefined,
          badgeColor: 'bg-stone-100 text-stone-600'
        },
        {
          label: 'Blocked Profiles',
          path: '/matching/blocked',
          icon: Ban,
          badge: blockedCount > 0 ? blockedCount : undefined,
          badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200'
        },
        { label: 'Privacy Settings', path: '/privacy-settings', icon: Lock },
      ]
    }
  ];

  return (
    <aside className={`w-full bg-white rounded-3xl border border-[#E8DDD5] shadow-xs overflow-hidden flex flex-col justify-between select-none ${className}`}>
      <div>
        
        {/* ================= 1. KALYAN MATRIMONY ROYAL MAROON & GOLD HEADER ================= */}
        <div className="relative bg-gradient-to-b from-[#690E26] via-[#8B1E3F] to-[#5A0C20] pt-6 pb-5 px-5 text-center flex flex-col items-center border-b-2 border-[#D4AF37]/40 shadow-inner">
          
          {/* Decorative Gold Top Accent Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37] to-[#D4AF37]/10" />

          {/* Profile Picture with Kalyan Traditional Golden Ring Frame */}
          <div className="relative mb-2.5 group">
            <MatchAvatar
              photo={apiProfile?.profile_photo || currentUser.avatar}
              firstName={apiProfile?.first_name || currentUser.name}
              lastName={apiProfile?.last_name}
              variant="circle"
              className="h-20 w-20 text-2xl font-extrabold ring-3 ring-[#D4AF37] ring-offset-2 ring-offset-[#8B1E3F] shadow-lg"
            />
            <Link
              to="/photos"
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#D4AF37] text-stone-950 flex items-center justify-center shadow-md hover:bg-amber-300 transition-colors border-2 border-white"
              title="Manage Photos"
            >
              <Camera className="h-3 w-3 text-stone-950" />
            </Link>
          </div>

          {/* Member Name */}
          <h3 className="font-serif font-bold text-base tracking-wide text-white drop-shadow-xs truncate max-w-full px-1">
            {displayName}
          </h3>

          {/* Kalyan Matrimony ID */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[11px] font-extrabold tracking-wider text-amber-200 bg-black/30 px-2.5 py-0.5 rounded-full border border-amber-300/30">
              KM ID: {kmId}
            </span>
          </div>

          {/* Plan / Membership Badge */}
          <div className="mt-2 flex items-center gap-1.5 flex-wrap justify-center">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-stone-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 px-2.5 py-0.5 rounded-full shadow-xs">
              <Crown className="h-3 w-3 text-stone-950 fill-stone-950" /> {planName}
            </span>

            {isVerified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-200 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-400/40">
                <ShieldCheck className="h-3 w-3 text-emerald-400" /> Verified
              </span>
            )}
          </div>

          {/* Profile Completeness Progress Bar */}
          <div className="w-full mt-3.5 pt-3 border-t border-white/10 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-semibold text-white/90">
              <span>Profile Completeness</span>
              <span className="text-amber-300 font-bold">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden border border-white/15">
              <div
                className="h-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <Link
              to="/profile/edit"
              className="text-[10px] text-amber-200/90 hover:text-white font-semibold flex items-center justify-center gap-0.5 mt-0.5 transition-colors"
            >
              Edit Profile <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

        </div>

        {/* ================= 2. KALYAN MATRIMONY 3-COLUMN QUICK METRICS STRIP ================= */}
        <div className="grid grid-cols-3 divide-x divide-[#E8DDD5] border-b border-[#E8DDD5] bg-[#FDFBF9] py-2 text-center">
          <Link
            to="/matching/shortlist"
            onClick={onNavClick}
            className="hover:bg-[#F5ECE5]/60 transition-colors py-1 group"
          >
            <span className="block text-xs font-extrabold text-[#8B1E3F] group-hover:scale-105 transition-transform">
              {shortlistCount}
            </span>
            <span className="text-[10px] font-medium text-stone-500">Shortlisted</span>
          </Link>

          <Link
            to="/interests"
            onClick={onNavClick}
            className="hover:bg-[#F5ECE5]/60 transition-colors py-1 group"
          >
            <span className="block text-xs font-extrabold text-[#8B1E3F] group-hover:scale-105 transition-transform">
              {totalInterestsCount}
            </span>
            <span className="text-[10px] font-medium text-stone-500">Interests</span>
          </Link>

          <Link
            to="/profile"
            onClick={onNavClick}
            className="hover:bg-[#F5ECE5]/60 transition-colors py-1 group"
          >
            <span className="block text-xs font-extrabold text-[#8B1E3F] group-hover:scale-105 transition-transform">
              {profileViewsCount}
            </span>
            <span className="text-[10px] font-medium text-stone-500">Views</span>
          </Link>
        </div>

        {/* ================= 3. STRUCTURED KALYAN MATRIMONY GROUPED NAVIGATION ================= */}
        <nav className="p-3 space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <h4 className="text-[10px] font-extrabold text-[#8B1E3F]/75 uppercase tracking-wider px-3 pb-1">
                {section.title}
              </h4>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onNavClick}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-[#8B1E3F]/10 text-[#8B1E3F] font-bold border-l-3 border-l-[#8B1E3F] shadow-2xs'
                          : 'text-stone-700 hover:bg-[#F5ECE5]/70 hover:text-[#8B1E3F]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-[#8B1E3F]' : 'text-stone-400'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-[#8B1E3F]/10 text-[#8B1E3F]'}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

      </div>

      {/* ================= 4. KALYAN MATRIMONY PREMIUM CLUB BANNER & LOGOUT ================= */}
      <div className="p-3 space-y-2 border-t border-[#E8DDD5] bg-[#FDFBF9]">
        
        {/* Kalyan Matrimony Signature Premium Club Banner */}
        <div
          onClick={() => {
            if (onNavClick) onNavClick();
            navigate('/membership');
          }}
          className="p-3 bg-gradient-to-br from-[#FFFDF5] to-[#FAF3E0] rounded-2xl border border-[#D4AF37]/60 shadow-2xs hover:border-[#D4AF37] transition-all cursor-pointer group space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#8B1E3F] bg-amber-100 px-2 py-0.5 rounded-md uppercase tracking-wider border border-[#D4AF37]/30">
              <Crown className="h-3 w-3 text-[#D4AF37] fill-[#D4AF37]" /> Premium Club
            </span>
            <span className="text-[10px] font-extrabold text-[#8B1E3F] group-hover:underline flex items-center">
              Upgrade <ChevronRight className="h-3 w-3" />
            </span>
          </div>

          <p className="text-[11px] font-bold text-stone-900 leading-tight">
            Connect directly with Verified Brides & Grooms
          </p>
          <p className="text-[10px] text-stone-600 font-medium">
            Unlock verified mobile numbers, direct SMS & horoscopes.
          </p>
        </div>

        {/* Logout Action Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="h-4 w-4 text-rose-500" />
            <span>Logout</span>
          </div>
          <span className="text-[10px] text-stone-400 font-normal">End Session</span>
        </button>

      </div>
    </aside>
  );
};

export default UserSidebar;
