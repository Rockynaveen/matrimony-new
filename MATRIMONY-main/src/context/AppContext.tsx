import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Profile, NotificationItem, Interest, UserRole, MembershipTier } from '../types';
import type {
  RegisterRequest,
  LoginRequest,
  GoogleRegisterRequest,
  GoogleLoginRequest,
  PatchBasicProfileRequest,
  ProfileApiResponse
} from '../types/apiTypes';
import { MOCK_PROFILES } from '../data/mockProfiles';
import { MOCK_NOTIFICATIONS } from '../data/mockNotifications';
import { authApi } from '../api/authApi';
import { googleAuthApi } from '../api/googleAuthApi';
import { profileApi } from '../api/profileApi';
import { matchingApi } from '../api/matchingApi';
import { queryClient } from '../lib/queryClient';

interface AppContextType {
  currentUser: User;
  setCurrentUserRole: (role: UserRole) => void;
  setMembershipTier: (tier: MembershipTier) => void;
  profiles: Profile[];
  shortlistedIds: string[];
  toggleShortlist: (profileId: string) => void;
  interests: Interest[];
  sendInterest: (profileId: string) => void;
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  searchFilter: SearchFilterState;
  setSearchFilter: React.Dispatch<React.SetStateAction<SearchFilterState>>;
  resetSearchFilter: () => void;
  activeChatUserId: string | null;
  setActiveChatUserId: (id: string | null) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Authentication & Profile Status State
  isAuthenticated: boolean;
  profileStatus: {
    is_basic_complete: boolean;
    is_detailed_complete: boolean;
    completion_percentage: number;
  };
  loginUser: (payload: LoginRequest) => Promise<ProfileApiResponse>;
  registerUser: (payload: RegisterRequest) => Promise<any>;
  googleRegisterUser: (payload: GoogleRegisterRequest) => Promise<ProfileApiResponse>;
  googleLoginUser: (payload: GoogleLoginRequest) => Promise<ProfileApiResponse>;
  patchBasicProfile: (payload: PatchBasicProfileRequest) => Promise<void>;
  checkProfileStatus: () => Promise<ProfileApiResponse>;
  updateCurrentUserAvatar: (avatarUrl: string) => void;
  logout: () => void;
}

export interface SearchFilterState {
  gender: string;
  ageMin: number;
  ageMax: number;
  religion: string;
  caste: string;
  location: string;
  profession: string;
  education: string;
  verifiedOnly: boolean;
  maritalStatus: string;
  keyword: string;
}

const initialSearchFilter: SearchFilterState = {
  gender: 'Female',
  ageMin: 22,
  ageMax: 35,
  religion: 'All',
  caste: 'All',
  location: 'All',
  profession: 'All',
  education: 'All',
  verifiedOnly: false,
  maritalStatus: 'All',
  keyword: ''
};

export const extractNameFromEmail = (email: string | undefined | null): string => {
  if (!email || !email.includes('@')) return 'Member';
  const username = email.split('@')[0];
  const words = username
    .replace(/[._-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[0-9]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  
  if (words.length === 0) return 'Member';

  const formatted = words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return formatted || 'Member';
};

const defaultEmptyUser: User = {
  id: '',
  name: '',
  email: '',
  phone: '',
  role: 'user',
  membershipTier: 'GOLD',
  avatar: '',
  is2FAEnabled: true,
  status: 'Active',
  joinedDate: ''
};

const getInitialUser = (): User => {
  const loggedInName = localStorage.getItem('logged_in_name');
  const loggedInEmail = localStorage.getItem('logged_in_email') || '';
  const loggedInAvatar = localStorage.getItem('logged_in_avatar');
  const draftPhoto = (() => {
    try {
      const draft = localStorage.getItem('user_profile_draft');
      return draft ? JSON.parse(draft)?.profile_photo : '';
    } catch {
      return '';
    }
  })();
  const avatarUrl = loggedInAvatar || draftPhoto || '';
  const emailName = extractNameFromEmail(loggedInEmail);
  const resolvedName = (loggedInName && loggedInName !== 'User') ? loggedInName : emailName;

  if (localStorage.getItem('access_token')) {
    return {
      ...defaultEmptyUser,
      name: resolvedName,
      email: loggedInEmail,
      avatar: avatarUrl
    };
  }
  return defaultEmptyUser;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(getInitialUser);
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>(['MAT-1001', 'MAT-1003']);
  const [interests, setInterests] = useState<Interest[]>([
    {
      id: 'INT-1',
      senderId: 'USER-CURRENT-101',
      senderName: 'User',
      senderImage: '',
      senderAge: 29,
      senderProfession: 'Product Manager',
      senderLocation: 'Bengaluru',
      receiverId: 'MAT-1001',
      status: 'accepted',
      sentAt: '2 days ago'
    },
    {
      id: 'INT-2',
      senderId: 'MAT-1002',
      senderName: 'Rohan Verma',
      senderImage: '/images/profiles/recommended_groom.jpg',
      senderAge: 29,
      senderProfession: 'Product Manager',
      senderLocation: 'Bengaluru',
      receiverId: 'USER-CURRENT-101',
      status: 'pending',
      sentAt: '1 day ago'
    }
  ]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [searchFilter, setSearchFilter] = useState<SearchFilterState>(initialSearchFilter);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>('MAT-1001');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('access_token'));
  });

  const [profileStatus, setProfileStatus] = useState<{
    is_basic_complete: boolean;
    is_detailed_complete: boolean;
    completion_percentage: number;
  }>(() => {
    const isDone = localStorage.getItem('user_profile_completed') === 'true';
    const token = Boolean(localStorage.getItem('access_token'));
    return {
      is_basic_complete: token ? isDone : false,
      is_detailed_complete: token ? isDone : false,
      completion_percentage: token && isDone ? 90 : 0
    };
  });

  const checkProfileStatus = async (): Promise<ProfileApiResponse> => {
    try {
      const res = await profileApi.getProfile();
      const isDetailedDone = res.is_detailed_complete || localStorage.getItem('user_profile_completed') === 'true';
      
      setProfileStatus({
        is_basic_complete: res.is_basic_complete,
        is_detailed_complete: isDetailedDone,
        completion_percentage: res.profile_completion_percentage
      });
      const storedName = localStorage.getItem('logged_in_name');
      const storedEmail = localStorage.getItem('logged_in_email') || res.email || '';
      const emailName = extractNameFromEmail(storedEmail);
      const apiName = `${res.first_name || ''} ${res.last_name || ''}`.trim();
      const finalName = (apiName && apiName !== 'User')
        ? apiName
        : ((storedName && storedName !== 'User') ? storedName : emailName);
      
      if (finalName) {
        localStorage.setItem('logged_in_name', finalName);
      }
      if (storedEmail) {
        localStorage.setItem('logged_in_email', storedEmail);
      }

      const photoUrl = (res as any).profile_photo || res.detailed_profile?.profile_photo || '';
      setCurrentUser(prev => ({
        ...prev,
        name: finalName,
        email: res.email || storedEmail || prev.email,
        phone: res.phone || prev.phone,
        avatar: photoUrl || prev.avatar
      }));
      return {
        ...res,
        is_detailed_complete: isDetailedDone
      };
    } catch (err: any) {
      console.error('Error fetching profile status:', err);
      // Handle unauthorized or missing token
      if (err?.status === 401 || err?.response?.status === 401) {
        logout();
      }
      return {
        id: '',
        first_name: currentUser.name || 'User',
        last_name: '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        gender: '',
        date_of_birth: '',
        is_basic_complete: false,
        is_detailed_complete: false,
        profile_completion_percentage: 0
      };
    }
  };

  useEffect(() => {
    if (isAuthenticated && profileStatus.is_basic_complete) {
      checkProfileStatus();
    }
  }, [isAuthenticated, profileStatus.is_basic_complete]);

  const loginUser = async (payload: LoginRequest): Promise<ProfileApiResponse> => {
    const res = await authApi.login(payload);
    const userEmail = res.user?.email || payload.email || '';
    const prevEmail = localStorage.getItem('logged_in_email');

    // If logging in with a new user account, clear old user profile flags!
    if (!prevEmail || prevEmail.toLowerCase() !== userEmail.toLowerCase()) {
      localStorage.removeItem('user_profile_completed');
      localStorage.removeItem('user_partner_preferences');
      localStorage.removeItem('user_profile_draft');
      localStorage.removeItem('vivah_mock_profile');
      localStorage.removeItem('vivah_mock_user');
    }

    const apiName = `${res.user?.first_name || ''} ${res.user?.last_name || ''}`.trim();
    const emailName = extractNameFromEmail(userEmail);
    const finalName = (apiName && apiName !== 'User') ? apiName : emailName;

    localStorage.setItem('logged_in_name', finalName);
    if (userEmail) {
      localStorage.setItem('logged_in_email', userEmail);
    }
    localStorage.setItem('login_method', 'email');
    setIsAuthenticated(true);
    setCurrentUser(prev => ({
      ...prev,
      name: finalName,
      email: userEmail
    }));
    showToast('Logged in successfully!');
    const profileRes = await checkProfileStatus();

    // If backend reports profile is not detailed complete, clear local completion flag!
    if (!profileRes.is_detailed_complete && !(res.user as any)?.is_detailed_complete) {
      localStorage.removeItem('user_profile_completed');
    }

    return profileRes;
  };

  const registerUser = async (payload: RegisterRequest) => {
    const res = await authApi.register(payload);
    if (res.access_token) {
      const name = `${payload.first_name} ${payload.last_name || ''}`.trim();
      localStorage.setItem('logged_in_name', name);
      localStorage.setItem('logged_in_email', payload.email);
      localStorage.setItem('login_method', 'email');
      setIsAuthenticated(true);
      setCurrentUser(prev => ({
        ...prev,
        name,
        email: payload.email || prev.email,
        phone: payload.phone || prev.phone
      }));
      setProfileStatus({
        is_basic_complete: true,
        is_detailed_complete: false,
        completion_percentage: 20
      });
    }
    showToast('Registration successful! Welcome.');
    return res;
  };

  const googleRegisterUser = async (payload: GoogleRegisterRequest): Promise<ProfileApiResponse> => {
    await googleAuthApi.googleRegister(payload);
    const name = `${payload.first_name} ${payload.last_name || ''}`.trim();
    localStorage.setItem('logged_in_name', name);
    localStorage.setItem('logged_in_email', payload.email);
    localStorage.setItem('login_method', 'google_register');
    setIsAuthenticated(true);
    setCurrentUser(prev => ({
      ...prev,
      name,
      email: payload.email
    }));
    setProfileStatus({
      is_basic_complete: false,
      is_detailed_complete: false,
      completion_percentage: 15
    });
    return {
      id: 'PRO-NEW',
      first_name: payload.first_name,
      last_name: payload.last_name || '',
      email: payload.email,
      phone: '',
      gender: '',
      date_of_birth: '',
      is_basic_complete: false,
      is_detailed_complete: false,
      profile_completion_percentage: 15
    };
  };

  const googleLoginUser = async (payload: GoogleLoginRequest): Promise<ProfileApiResponse> => {
    const res = await googleAuthApi.googleLogin(payload);
    if (res.user) {
      const name = `${res.user.first_name || ''} ${res.user.last_name || ''}`.trim();
      if (name) {
        localStorage.setItem('logged_in_name', name);
      }
      if (res.user.email) {
        localStorage.setItem('logged_in_email', res.user.email);
      }
    }
    localStorage.setItem('login_method', 'google');
    setIsAuthenticated(true);
    showToast('Google Login successful!');
    return await checkProfileStatus();
  };

  const patchBasicProfile = async (payload: PatchBasicProfileRequest) => {
    await profileApi.patchBasicProfile(payload);
    await checkProfileStatus();
    showToast('✓ Profile Updated Successfully');
  };

  const updateCurrentUserAvatar = (avatarUrl: string) => {
    if (!avatarUrl) return;
    localStorage.setItem('logged_in_avatar', avatarUrl);
    setCurrentUser(prev => ({ ...prev, avatar: avatarUrl }));
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('[AppContext] Backend logout notice:', err);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('login_method');
    localStorage.removeItem('logged_in_name');
    localStorage.removeItem('logged_in_email');
    localStorage.removeItem('logged_in_avatar');
    localStorage.removeItem('user_profile_draft');
    localStorage.removeItem('user_profile_completed');
    localStorage.removeItem('user_partner_preferences');
    localStorage.removeItem('vivah_mock_profile');
    localStorage.removeItem('vivah_mock_user');
    setIsAuthenticated(false);
    setProfileStatus({
      is_basic_complete: false,
      is_detailed_complete: false,
      completion_percentage: 0
    });
    setCurrentUser(defaultEmptyUser);
    showToast('Logged out successfully.');
  };

  const setCurrentUserRole = (role: UserRole) => {
    setCurrentUser(prev => ({ ...prev, role }));
    showToast(`Switched user mode to ${role.toUpperCase()}`);
  };

  const setMembershipTier = (membershipTier: MembershipTier) => {
    setCurrentUser(prev => ({ ...prev, membershipTier }));
    showToast(`Membership updated to ${membershipTier}`);
  };

  const toggleShortlist = async (profileId: string) => {
    const numericId = parseInt(profileId, 10);
    if (!isNaN(numericId) && String(numericId) === profileId) {
      const exists = shortlistedIds.includes(profileId);
      try {
        if (exists) {
          await matchingApi.removeFromShortlist(numericId);
          setShortlistedIds(prev => prev.filter(id => id !== profileId));
          showToast('Profile removed from shortlist');
        } else {
          await matchingApi.addToShortlist({ user: numericId });
          setShortlistedIds(prev => [...prev, profileId]);
          showToast('Profile added to shortlist ✨');
        }
        queryClient.invalidateQueries({ queryKey: ['matching'] });
      } catch (err: any) {
        showToast(err?.message || 'Failed to update shortlist');
      }
      return;
    }

    setShortlistedIds(prev => {
      const exists = prev.includes(profileId);
      const updated = exists ? prev.filter(id => id !== profileId) : [...prev, profileId];
      showToast(exists ? 'Profile removed from shortlist' : 'Profile added to shortlist ✨');
      return updated;
    });
  };

  const sendInterest = async (profileId: string) => {
    const target = profiles.find(p => p.id === profileId);
    const numericId = parseInt(profileId, 10);
    
    if (!isNaN(numericId) && String(numericId) === profileId) {
      try {
        await matchingApi.sendInterest({ to_user: numericId, message: 'Hi, I am interested in your profile.' });
        
        // Populate local state to match immediately
        const newInterest: Interest = {
          id: `INT-${Date.now()}`,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderImage: currentUser.avatar || '',
          senderAge: 29,
          senderProfession: 'Professional',
          senderLocation: 'Mumbai',
          receiverId: profileId,
          status: 'pending',
          sentAt: 'Just now'
        };
        setInterests(prev => [newInterest, ...prev]);
        setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, interestSent: true } : p));
        showToast(`Interest sent successfully to ${target ? target.name : 'member'} 💕`);
        
        queryClient.invalidateQueries({ queryKey: ['matching'] });
      } catch (err: any) {
        showToast(err?.message || 'Failed to send interest to backend');
      }
      return;
    }

    if (!target) return;
    const existing = interests.find(i => i.receiverId === profileId && i.senderId === currentUser.id);
    if (existing) {
      showToast(`Interest already sent to ${target.name}`);
      return;
    }

    const newInterest: Interest = {
      id: `INT-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderImage: currentUser.avatar || '',
      senderAge: 29,
      senderProfession: 'Professional',
      senderLocation: 'Mumbai',
      receiverId: profileId,
      status: 'pending',
      sentAt: 'Just now'
    };

    setInterests(prev => [newInterest, ...prev]);
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, interestSent: true } : p));
    showToast(`Interest sent successfully to ${target.name} 💕`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const resetSearchFilter = () => {
    setSearchFilter(initialSearchFilter);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUserRole,
        setMembershipTier,
        profiles,
        shortlistedIds,
        toggleShortlist,
        interests,
        sendInterest,
        notifications,
        markNotificationRead,
        searchFilter,
        setSearchFilter,
        resetSearchFilter,
        activeChatUserId,
        setActiveChatUserId,
        toastMessage,
        showToast,

        isAuthenticated,
        profileStatus,
        loginUser,
        registerUser,
        googleRegisterUser,
        googleLoginUser,
        patchBasicProfile,
        checkProfileStatus,
        updateCurrentUserAvatar,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
