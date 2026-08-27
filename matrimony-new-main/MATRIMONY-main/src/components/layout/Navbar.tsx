import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp, extractNameFromEmail, isGenericName } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  useSentInterests,
  useReceivedInterests,
  useShortlist,
  useIgnoredProfiles,
  useBlockedProfiles
} from '../../hooks/useMatching';
import {
  Heart,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  Lock,
  Sliders,
  User,
  Edit3,
  ChevronDown,
  Crown,
  Check,
  Star,
  EyeOff,
  Ban,
  ShieldCheck
} from 'lucide-react';
export const Navbar: React.FC = () => {
  const { currentUser, verificationStatus, notifications, unreadCount, markNotificationRead, logout, isAuthenticated, shortlistedIds, onboardingStatus, getPendingRoute } = useApp();
  const { data: sentInterests } = useSentInterests();
  const { data: receivedInterests } = useReceivedInterests();
  const { data: shortlistData } = useShortlist();
  const { data: ignoredData } = useIgnoredProfiles();
  const { data: blockedData } = useBlockedProfiles();

  const shortlistCount = shortlistData?.length ?? shortlistedIds.length;
  const ignoredCount = ignoredData?.length ?? 0;
  const blockedCount = blockedData?.length ?? 0;

  const displayName = (currentUser.name && !isGenericName(currentUser.name))
    ? currentUser.name
    : extractNameFromEmail(currentUser.email || localStorage.getItem('logged_in_email'));

  const totalInterestsCount = (sentInterests?.length || 0) + (receivedInterests?.length || 0);
  const unreadNotifs = unreadCount > 0 ? unreadCount : notifications.filter(n => !n.read).length;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Search', path: '/search' },
    { label: 'Matches', path: '/matches' },
    { label: 'Success Stories', path: '/success-stories' },
    { label: 'Membership', path: '/membership' }
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD5]/80 bg-white/95 backdrop-blur-xl transition-all duration-300 shadow-2xs">
      {/* Top Thin Golden Accent Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-[#8B1E3F] via-[#D4AF37] to-[#C44569]" />

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center h-full py-0 my-0 group overflow-hidden">
          <img
            src="/images/logo.png"
            alt="Matrimony Logo"
            className="h-20 w-auto object-contain max-h-20 py-0 my-0 group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#F5ECE5]/60 p-1.5 rounded-2xl border border-[#E8DDD5]/60 shadow-inner">
          {navLinks.map(link => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => {
                  setIsUserDropdownOpen(false);
                  setIsNotifDropdownOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                className={`relative px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-[#8B1E3F] shadow-sm font-bold scale-[1.02]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/70'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-[#8B1E3F] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls & Role Switcher */}
        <div className="flex items-center gap-3">
          
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button size="sm" variant="outline" className="font-bold text-xs border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#8B1E3F]/5">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" variant="primary" className="font-bold text-xs bg-[#8B1E3F] hover:bg-[#721733] text-white shadow-md">
                  Register Free
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Notifications Bell Button & Dropdown */}
              <div className="relative" ref={notifDropdownRef}>
                <button
                  onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                  className="relative p-2.5 rounded-2xl border border-border/70 bg-white hover:bg-muted text-foreground transition-all duration-200 hover:scale-105 shadow-2xs"
                >
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#C44569] text-[10px] font-bold text-white shadow-xs animate-bounce">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {isNotifDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl border border-border/80 bg-white shadow-2xl z-50 p-4 space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-border/60">
                      <h4 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                        <Bell className="h-4 w-4 text-[#8B1E3F]" /> Notifications
                      </h4>
                      <Badge variant="primary" className="text-[10px]">{unreadNotifs} Unread</Badge>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-border/40 space-y-1">
                      {notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (n.link) navigate(n.link);
                            setIsNotifDropdownOpen(false);
                          }}
                          className={`p-3 rounded-2xl cursor-pointer hover:bg-muted/70 transition-all flex items-start gap-3 ${
                            !n.read ? 'bg-[#8B1E3F]/5 border-l-3 border-l-[#8B1E3F]' : ''
                          }`}
                        >
                          {n.avatar ? (
                            <img src={n.avatar} className="h-9 w-9 rounded-full object-cover shrink-0 ring-2 ring-primary/20" />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <Sparkles className="h-4 w-4" />
                            </div>
                          )}
                          <div className="flex-1 text-xs">
                            <p className="font-bold text-foreground">{n.title}</p>
                            <p className="text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                            <span className="text-[10px] text-muted-foreground/70 mt-1 block font-medium">{n.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Link
                      to="/notifications"
                      onClick={() => setIsNotifDropdownOpen(false)}
                      className="block text-center text-xs font-bold text-[#8B1E3F] hover:underline pt-2 border-t border-border/60"
                    >
                      View All Notifications
                    </Link>
                  </div>
                )}
              </div>

              {/* User Account / Navigation Button */}
              <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(!isUserDropdownOpen);
                      setIsNotifDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-border/80 bg-white hover:border-[#8B1E3F]/40 transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer"
                  >
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={displayName}
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-[#8B1E3F]/30"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-[#8B1E3F] text-white flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-[#8B1E3F]/30">
                        {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                      </div>
                    )}
                    <span className="hidden sm:inline-block text-xs font-bold text-foreground">
                      {displayName ? displayName.split(' ')[0] : 'Account'}
                    </span>
                    <Badge variant="gold" className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider">
                      {currentUser.membershipTier}
                    </Badge>
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-stone-200 bg-white shadow-2xl z-50 overflow-hidden divide-y divide-stone-100 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Top Header Card - Theme Color Gradient */}
                      <div className="bg-gradient-to-b from-[#8B1E3F] via-[#A0284C] to-[#721733] p-5 text-center flex flex-col items-center relative border-b border-[#D4AF37]/30">
                        <div className="relative mb-2">
                          {currentUser.avatar ? (
                            <img
                              src={currentUser.avatar}
                              alt={displayName}
                              className="h-16 w-16 rounded-full object-cover ring-4 ring-white/90 shadow-md"
                            />
                          ) : (
                            <img
                              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300"
                              alt="Profile Avatar"
                              className="h-16 w-16 rounded-full object-cover ring-4 ring-white/90 shadow-md"
                            />
                          )}
                        </div>
                        <h4 className="font-extrabold text-sm tracking-wide text-white drop-shadow-xs line-clamp-1">
                          {displayName ? displayName.toUpperCase() : 'NAVEEN GANDHAM'}
                        </h4>
                        <p className="text-[11px] text-[#F5ECE5]/90 font-medium truncate max-w-full mt-0.5">
                          {currentUser.email || 'naveengandham970@gmail.com'}
                        </p>
                        {(verificationStatus === 'VERIFIED' || currentUser.verified) && (
                          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-200 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                            <ShieldCheck className="h-3 w-3 text-emerald-400" /> Approved Member
                          </span>
                        )}
                      </div>

                      {/* Menu Navigation Links */}
                      <div className="p-2 space-y-0.5 max-h-[380px] overflow-y-auto">
                        {(!onboardingStatus.partner_preferences_completed || (onboardingStatus.verification_status !== 'PENDING' && onboardingStatus.verification_status !== 'VERIFIED')) && (
                          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 mb-2 space-y-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                              <span>Profile Setup in Progress</span>
                            </div>
                            <p className="text-[10px] text-amber-700 font-medium">
                              Complete required profile & verification steps to unlock matches.
                            </p>
                            <Link
                              to={getPendingRoute()}
                              onClick={() => setIsUserDropdownOpen(false)}
                              className="block text-center py-1.5 px-3 bg-[#8B1E3F] text-white text-xs font-bold rounded-xl hover:bg-[#721733] transition-colors"
                            >
                              Resume Setup →
                            </Link>
                          </div>
                        )}
                        <Link
                          to="/profile"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-[#F5ECE5]/60 hover:text-[#8B1E3F] rounded-xl transition-colors"
                        >
                          <User className="h-4 w-4 text-stone-400" />
                          <span>My Profile</span>
                        </Link>

                        <Link
                          to="/profile/edit"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-[#F5ECE5]/60 hover:text-[#8B1E3F] rounded-xl transition-colors"
                        >
                          <Edit3 className="h-4 w-4 text-stone-400" />
                          <span>Edit Profile</span>
                        </Link>

                        <Link
                          to="/dashboard"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-[#8B1E3F] bg-[#8B1E3F]/10 border-l-4 border-l-[#8B1E3F] rounded-xl transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 text-[#8B1E3F]" />
                          <span>User Dashboard</span>
                        </Link>

                        <Link
                          to="/search"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-[#F5ECE5]/60 hover:text-[#8B1E3F] rounded-xl transition-colors"
                        >
                          <Search className="h-4 w-4 text-stone-400" />
                          <span>Search Matches</span>
                        </Link>

                        <Link
                          to="/interests"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-[#F5ECE5]/60 hover:text-[#8B1E3F] rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Heart className="h-4 w-4 text-stone-400" />
                            <span>My Interests</span>
                          </div>
                          {totalInterestsCount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8B1E3F]/10 text-[#8B1E3F]">
                              {totalInterestsCount}
                            </span>
                          )}
                        </Link>

                        <Link
                          to="/messages"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-[#F5ECE5]/60 hover:text-[#8B1E3F] rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <MessageSquare className="h-4 w-4 text-stone-400" />
                            <span>Chat Messages</span>
                          </div>
                          {unreadNotifs > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8B1E3F]/10 text-[#8B1E3F]">
                              {unreadNotifs}
                            </span>
                          )}
                        </Link>

                        <Link
                          to="/preferences"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-[#F5ECE5]/60 hover:text-[#8B1E3F] rounded-xl transition-colors"
                        >
                          <Sliders className="h-4 w-4 text-stone-400" />
                          <span>Partner Preferences</span>
                        </Link>

                        <Link
                          to="/matching/shortlist"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-[#F5ECE5]/60 hover:text-[#8B1E3F] rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Star className="h-4 w-4 text-stone-400" />
                            <span>Shortlisted Profiles</span>
                          </div>
                          {shortlistCount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8B1E3F]/10 text-[#8B1E3F]">
                              {shortlistCount}
                            </span>
                          )}
                        </Link>

                        <Link
                          to="/matching/ignored"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-[#F5ECE5]/60 hover:text-[#8B1E3F] rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <EyeOff className="h-4 w-4 text-stone-400" />
                            <span>Ignored Profiles</span>
                          </div>
                          {ignoredCount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8B1E3F]/10 text-[#8B1E3F]">
                              {ignoredCount}
                            </span>
                          )}
                        </Link>

                        <Link
                          to="/matching/blocked"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-[#F5ECE5]/60 hover:text-[#8B1E3F] rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Ban className="h-4 w-4 text-stone-400" />
                            <span>Blocked Profiles</span>
                          </div>
                          {blockedCount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8B1E3F]/10 text-[#8B1E3F]">
                              {blockedCount}
                            </span>
                          )}
                        </Link>

                        <Link
                          to="/privacy-settings"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-[#F5ECE5]/60 hover:text-[#8B1E3F] rounded-xl transition-colors"
                        >
                          <Lock className="h-4 w-4 text-stone-400" />
                          <span>Privacy Settings</span>
                        </Link>
                      </div>

                      {/* Bottom Logout Button */}
                      <div className="p-2 bg-stone-50/80">
                        <Link
                          to="/login"
                          onClick={() => {
                            logout();
                            setIsUserDropdownOpen(false);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <LogOut className="h-4 w-4 text-red-500" /> Sign Out
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
            </>
          )}

          {/* Mobile Drawer Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-2xl border border-border text-foreground hover:bg-muted shadow-2xs"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

        </div>

      </div>

      {/* Mobile Drawer Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-white p-5 space-y-4 shadow-2xl">
          {isAuthenticated ? (
            <div className="flex items-center justify-between p-3 bg-[#8B1E3F]/10 rounded-2xl border border-[#8B1E3F]/20 mb-2">
              <div className="flex items-center gap-3">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={displayName} className="h-10 w-10 rounded-full object-cover ring-2 ring-[#8B1E3F]" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-[#8B1E3F] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                  </div>
                )}
                <div>
                  <p className="font-serif font-bold text-xs text-stone-900">{displayName}</p>
                  <p className="text-[10px] text-stone-600 font-semibold">{currentUser.email}</p>
                </div>
              </div>
              <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                <Button size="sm" variant="primary" className="text-xs font-bold py-1.5 px-3 bg-[#8B1E3F]">
                  Profile 👤
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex-1">
                <Button size="sm" variant="outline" className="w-full font-bold text-xs border-[#8B1E3F] text-[#8B1E3F]">
                  Login
                </Button>
              </Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="flex-1">
                <Button size="sm" variant="primary" className="w-full font-bold text-xs bg-[#8B1E3F] text-white">
                  Register Free
                </Button>
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 text-xs font-semibold text-foreground rounded-xl bg-muted/50 text-center hover:bg-[#8B1E3F] hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
