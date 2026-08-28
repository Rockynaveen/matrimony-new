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
  ShieldCheck
} from 'lucide-react';
import { useShortlistStore } from '../../store/useShortlistStore';

export const Navbar: React.FC = () => {
  const { currentUser, verificationStatus, notifications, unreadCount, markNotificationRead, logout, isAuthenticated, onboardingStatus, getPendingRoute } = useApp();
  const shortlistedIds = useShortlistStore((state) => state.shortlistedIds);
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
                <Button size="sm" variant="outline" className="font-bold text-xs border-2 border-[#8B1E3F] text-[#8B1E3F] bg-white hover:bg-[#8B1E3F] hover:text-white transition-all shadow-xs">
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

              {/* User Account Link to Dashboard */}
              <Link
                to="/dashboard"
                className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-border/80 bg-white hover:border-[#8B1E3F]/50 transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer"
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
                  {displayName ? displayName.split(' ')[0] : 'Profile'}
                </span>
              </Link>
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
                <Button size="sm" variant="outline" className="w-full font-bold text-xs border-2 border-[#8B1E3F] text-[#8B1E3F] bg-white hover:bg-[#8B1E3F] hover:text-white transition-all shadow-xs">
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
