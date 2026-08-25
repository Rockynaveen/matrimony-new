import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp, extractNameFromEmail, isGenericName } from '../../context/AppContext';
import {
  User,
  Edit3,
  LayoutDashboard,
  Search,
  Heart,
  MessageSquare,
  Sliders,
  Star,
  EyeOff,
  Ban,
  Lock,
  LogOut,
  ShieldCheck
} from 'lucide-react';

import {
  useShortlist,
  useIgnoredProfiles,
  useBlockedProfiles,
  useSentInterests,
  useReceivedInterests
} from '../../hooks/useMatching';

interface UserSidebarProps {
  onNavClick?: () => void;
  className?: string;
}

export const UserSidebar: React.FC<UserSidebarProps> = ({ onNavClick, className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, verificationStatus, unreadCount, shortlistedIds, interests, logout } = useApp();

  const handleLogout = () => {
    if (onNavClick) onNavClick();
    logout();
    navigate('/login');
  };

  const { data: shortlistData } = useShortlist();
  const { data: ignoredData } = useIgnoredProfiles();
  const { data: blockedData } = useBlockedProfiles();
  const { data: sentInterests } = useSentInterests();
  const { data: receivedInterests } = useReceivedInterests();

  const shortlistCount = shortlistData?.length ?? shortlistedIds.length;
  const ignoredCount = ignoredData?.length ?? 0;
  const blockedCount = blockedData?.length ?? 0;
  const totalInterestsCount = (sentInterests?.length || 0) + (receivedInterests?.length || 0);

  const rawName = (currentUser.name && !isGenericName(currentUser.name))
    ? currentUser.name
    : extractNameFromEmail(currentUser.email || localStorage.getItem('logged_in_email'));

  const displayName = rawName.toUpperCase();
  const userEmail = currentUser.email || localStorage.getItem('logged_in_email') || '';

  const menuItems = [
    { label: 'My Profile', path: '/profile', icon: User },
    { label: 'Edit Profile', path: '/profile/edit', icon: Edit3 },
    { label: 'User Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Search Matches', path: '/search', icon: Search },
    { label: 'My Interests', path: '/interests', icon: Heart, badge: totalInterestsCount > 0 ? totalInterestsCount : undefined, badgeColor: 'bg-[#8B1E3F]/10 text-[#8B1E3F]' },
    { label: 'Chat Messages', path: '/messages', icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : undefined, badgeColor: 'bg-[#8B1E3F]/10 text-[#8B1E3F]' },
    { label: 'Partner Preferences', path: '/preferences', icon: Sliders },
    { label: 'Shortlisted Profiles', path: '/matching/shortlist', icon: Star, badge: shortlistCount > 0 ? shortlistCount : undefined, badgeColor: 'bg-[#8B1E3F]/10 text-[#8B1E3F]' },
    { label: 'Ignored Profiles', path: '/matching/ignored', icon: EyeOff, badge: ignoredCount > 0 ? ignoredCount : undefined, badgeColor: 'bg-[#8B1E3F]/10 text-[#8B1E3F]' },
    { label: 'Blocked Profiles', path: '/matching/blocked', icon: Ban, badge: blockedCount > 0 ? blockedCount : undefined, badgeColor: 'bg-[#8B1E3F]/10 text-[#8B1E3F]' },
    { label: 'Privacy Settings', path: '/privacy-settings', icon: Lock },
  ];

  return (
    <aside className={`w-full bg-white rounded-3xl border border-[#E8DDD5] shadow-sm overflow-hidden flex flex-col justify-between ${className}`}>
      <div>
        {/* Top Header Card - Theme Color Gradient */}
        <div className="bg-gradient-to-b from-[#8B1E3F] via-[#A0284C] to-[#721733] pt-8 pb-6 px-6 text-center relative flex flex-col items-center border-b border-[#D4AF37]/30">
          {/* Profile Picture */}
          <div className="relative mb-3">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={displayName}
                className="h-24 w-24 rounded-full object-cover ring-4 ring-white/90 shadow-md"
              />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300"
                alt="Profile Avatar"
                className="h-24 w-24 rounded-full object-cover ring-4 ring-white/90 shadow-md"
              />
            )}
          </div>

          {/* User Name & Email */}
          <h3 className="font-sans font-extrabold text-base tracking-wide text-white drop-shadow-xs line-clamp-1">
            {displayName || 'NAVEEN GANDHAM'}
          </h3>
          <p className="text-xs text-[#F5ECE5]/90 font-medium truncate max-w-full mt-0.5">
            {userEmail}
          </p>

          {(verificationStatus === 'VERIFIED' || currentUser.verified) && (
            <div className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-200 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-400/40">
              <ShieldCheck className="h-3 w-3 text-emerald-400" /> Approved Member
            </div>
          )}
        </div>

        {/* Navigation Items List */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavClick}
                className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#8B1E3F]/10 text-[#8B1E3F] font-bold shadow-2xs border-l-4 border-l-[#8B1E3F]'
                    : 'text-stone-700 hover:bg-[#F5ECE5]/60 hover:text-[#8B1E3F]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#8B1E3F]' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-[#8B1E3F]/10 text-[#8B1E3F]'}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Logout Action Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200 cursor-pointer mt-1 border border-transparent hover:border-rose-100/60"
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-4 w-4 text-rose-500" />
              <span>Logout</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Bottom Illustration Card */}
      <div className="p-4 pt-2">
        <div className="bg-gradient-to-b from-[#F5ECE5]/60 to-[#F5ECE5] rounded-2xl p-4 border border-[#E8DDD5] flex flex-col items-center justify-center relative overflow-hidden text-center min-h-[120px]">
          {/* Vector SVG illustration of Bride & Groom Silhouette */}
          <svg className="w-28 h-20 text-[#8B1E3F]/40" viewBox="0 0 200 140" fill="currentColor">
            <path d="M100 20 C90 10, 75 10, 70 25 C65 10, 50 10, 40 20 C30 35, 60 70, 70 80 C80 70, 110 35, 100 20 Z" fill="#C44569" opacity="0.25"/>
            <path d="M160 30 C155 22, 145 22, 140 32 C135 22, 125 22, 120 30 C112 42, 135 65, 140 72 C145 65, 168 42, 160 30 Z" fill="#D4AF37" opacity="0.3"/>
            <g fill="#8B1E3F">
              <circle cx="82" cy="45" r="10" />
              <path d="M70 60 C70 56, 94 56, 94 60 L92 110 L72 110 Z" />
              <circle cx="118" cy="48" r="9" />
              <path d="M106 62 C104 58, 130 58, 130 62 L136 110 C124 115, 112 115, 102 110 Z" />
              <path d="M92 70 Q100 75 108 70" stroke="#8B1E3F" strokeWidth="2" fill="none"/>
            </g>
            <path d="M10 120 Q100 100 190 120 L190 140 L10 140 Z" fill="#C44569" opacity="0.2" />
          </svg>
        </div>
      </div>
    </aside>
  );
};
