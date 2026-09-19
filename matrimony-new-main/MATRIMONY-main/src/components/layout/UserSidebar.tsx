import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp, extractNameFromEmail, isGenericName } from '../../context/AppContext';
import { useProfile } from '../../hooks/useProfile';
import { useMyMembership } from '../../hooks/useMembership';
import {
  useShortlist,
  useSentInterests,
  useReceivedInterests,
  useRecommendations
} from '../../hooks/useMatching';
import { MatchAvatar } from '../ui/MatchAvatar';
import {
  Sparkles,
  Search,
  Heart,
  MessageSquare,
  Star,
  User,
  Sliders,
  ShieldCheck,
  Lock,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface UserSidebarProps {
  onNavClick?: () => void;
  className?: string;
}

export const UserSidebar: React.FC<UserSidebarProps> = ({ onNavClick, className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, verificationStatus, unreadCount, shortlistedIds, logout } = useApp();

  const handleLogout = () => {
    if (onNavClick) onNavClick();
    logout();
    navigate('/login');
  };

  const { data: apiProfile } = useProfile();
  const { data: membershipData } = useMyMembership();
  const { data: recommendations } = useRecommendations();
  const { data: shortlistData } = useShortlist();
  const { data: sentInterests } = useSentInterests();
  const { data: receivedInterests } = useReceivedInterests();

  const shortlistCount = shortlistData?.length ?? shortlistedIds.length;
  const totalInterestsCount = (sentInterests?.length || 0) + (receivedInterests?.length || 0);

  // Resolve Member ID & Numeric ID
  const resolvedMemberId =
    (apiProfile as any)?.member_id ||
    (currentUser as any)?.member_id ||
    localStorage.getItem('member_id');

  const resolvedUserId =
    (apiProfile as any)?.user_id ||
    apiProfile?.id ||
    currentUser?.id ||
    localStorage.getItem('user_id');

  const numericId = resolvedUserId ? parseInt(String(resolvedUserId).replace(/\D/g, ''), 10) : 0;
  const kmId = resolvedMemberId
    ? String(resolvedMemberId)
    : numericId > 0
    ? `KM${String(numericId).padStart(6, '0')}`
    : 'KM-MEMBER';

  const rawName =
    (apiProfile?.first_name ? `${apiProfile.first_name} ${apiProfile.last_name || ''}`.trim() : null) ||
    (currentUser.name && !isGenericName(currentUser.name) ? currentUser.name : null) ||
    extractNameFromEmail(currentUser.email || localStorage.getItem('logged_in_email'));

  const displayName = rawName.split(' ')[0] || 'Member';
  const planName = membershipData?.plan_name || 'Free Member';

  const isVerified =
    verificationStatus === 'VERIFIED' ||
    Boolean((apiProfile as any)?.is_verified) ||
    Boolean(currentUser.verified);

  // Clean, focused navigation list
  const navItems = [
    {
      label: 'Recommendations',
      path: '/matches',
      icon: Sparkles,
      badge: recommendations?.length ? String(recommendations.length) : undefined
    },
    { label: 'Search Profiles', path: '/search', icon: Search },
    {
      label: 'Interests',
      path: '/interests',
      icon: Heart,
      badge: totalInterestsCount > 0 ? String(totalInterestsCount) : undefined
    },
    {
      label: 'Messages',
      path: '/messages',
      icon: MessageSquare,
      badge: unreadCount > 0 ? String(unreadCount) : undefined,
      badgeColor: 'bg-[#8B1E3F] text-white'
    },
    {
      label: 'Shortlisted',
      path: '/matching/shortlist',
      icon: Star,
      badge: shortlistCount > 0 ? String(shortlistCount) : undefined
    },
    { label: 'My Profile', path: '/profile', icon: User },
    { label: 'Preferences', path: '/preferences', icon: Sliders },
    { label: 'Verification', path: '/verification', icon: ShieldCheck },
    { label: 'Settings', path: '/privacy-settings', icon: Lock },
  ];

  return (
    <aside className={`w-full bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between font-sans ${className}`}>
      
      {/* ── 1. Clean Profile Summary Header ── */}
      <div>
        <Link
          to="/profile"
          onClick={onNavClick}
          className="p-4 flex items-center gap-3 border-b border-stone-200 hover:bg-stone-50 transition-colors group"
        >
          <MatchAvatar
            photo={apiProfile?.profile_photo || currentUser.avatar}
            firstName={apiProfile?.first_name || currentUser.name}
            lastName={apiProfile?.last_name}
            variant="circle"
            className="h-11 w-11 text-sm border border-stone-300 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-black truncate">
                {displayName}
              </h3>
              {isVerified && (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-black font-mono font-medium truncate">
              {kmId} • {planName}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-black/40 group-hover:text-black transition-colors shrink-0" />
        </Link>

        {/* ── 2. Simple Navigation List (Black Font) ── */}
        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavClick}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-stone-100 text-black font-bold border-l-2 border-black'
                    : 'text-black font-semibold hover:bg-stone-100 hover:text-black'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? 'text-black' : 'text-black/70'
                    }`}
                  />
                  <span className="text-black">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-black/10 text-black'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── 3. Simple Footer: Membership & Logout ── */}
      <div className="p-2 border-t border-stone-200 space-y-1 bg-stone-50/60">
        <Link
          to="/membership"
          onClick={onNavClick}
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-black hover:bg-stone-100 transition-colors"
        >
          <span className="text-black">👑 Membership</span>
          <span className="text-[11px] font-bold text-black bg-stone-200/80 px-2 py-0.5 rounded">
            {membershipData?.remaining_credits !== undefined
              ? `${membershipData.remaining_credits} credits`
              : 'Upgrade'}
          </span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-black hover:text-rose-600 hover:bg-rose-50/60 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4 text-black" />
          <span className="text-black hover:text-rose-600">Logout</span>
        </button>
      </div>

    </aside>
  );
};

export default UserSidebar;
