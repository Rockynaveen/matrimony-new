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
import { authApi } from '../api/authApi';
import { googleAuthApi } from '../api/googleAuthApi';
import { profileApi } from '../api/profileApi';
import { matchingApi } from '../api/matchingApi';
import { notificationApi } from '../api/notificationApi';
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
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => void;
  addNotification: (item: { title: string; message: string; category: NotificationItem['category']; link?: string; avatar?: string }) => void;
  fetchNotifications: () => Promise<void>;
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
  markProfileCompleted: () => void;
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

export const isUserProfileCompleted = (email?: string): boolean => {
  if (localStorage.getItem('user_profile_completed') === 'true') return true;
  if (!email) {
    email = localStorage.getItem('logged_in_email') || '';
  }
  if (email) {
    const key = `user_profile_completed_${email.toLowerCase().trim()}`;
    if (localStorage.getItem(key) === 'true') return true;
  }
  return false;
};

export const markUserProfileCompleted = (email?: string): void => {
  localStorage.setItem('user_profile_completed', 'true');
  if (!email) {
    email = localStorage.getItem('logged_in_email') || '';
  }
  if (email) {
    const key = `user_profile_completed_${email.toLowerCase().trim()}`;
    localStorage.setItem(key, 'true');
  }
};

export const isGenericName = (name?: string | null): boolean => {
  if (!name) return true;
  const lower = name.trim().toLowerCase();
  return (
    lower === '' ||
    lower === 'user' ||
    lower === 'member' ||
    lower === 'user profile' ||
    lower === 'matrimonial member' ||
    lower === 'verified member' ||
    lower === 'null' ||
    lower === 'undefined'
  );
};

export const decodeGoogleIdToken = (idToken?: string | null): { name?: string; given_name?: string; family_name?: string; email?: string; picture?: string; sub?: string } | null => {
  if (!idToken) return null;
  try {
    const parts = idToken.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('[AppContext] Failed to decode Google ID Token:', err);
    return null;
  }
};

export const extractNameFromEmail = (email: string | undefined | null): string => {
  if (!email || !email.includes('@')) return 'User';
  const username = email.split('@')[0];
  if (!username) return 'User';

  // Replace separators with spaces
  let cleaned = username.replace(/[._\-+]/g, ' ');

  // If numbers exist, strip trailing digits if alphabetic chars remain
  const alphabeticOnly = cleaned.replace(/[0-9]/g, '').trim();
  const targetStr = alphabeticOnly.length >= 2 ? alphabeticOnly : cleaned;

  // Handle camelCase / PascalCase
  const expanded = targetStr.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  const words = expanded.split(/\s+/).filter(Boolean);

  if (words.length === 0) return 'User';

  const formatted = words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  if (isGenericName(formatted)) {
    return 'User';
  }

  return formatted || 'User';
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
  const resolvedName = (loggedInName && !isGenericName(loggedInName)) ? loggedInName : emailName;

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
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('local_user_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [unreadCount, setUnreadCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('local_user_notifications');
      const list: NotificationItem[] = saved ? JSON.parse(saved) : [];
      return list.filter(n => !n.read).length;
    } catch {
      return 0;
    }
  });

  const saveNotificationsToStorage = (list: NotificationItem[]) => {
    try {
      localStorage.setItem('local_user_notifications', JSON.stringify(list));
    } catch {}
  };

  const [searchFilter, setSearchFilter] = useState<SearchFilterState>(initialSearchFilter);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>('MAT-1001');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('access_token'));
  });

  const fetchNotifications = async () => {
    if (!localStorage.getItem('access_token')) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const [remoteData, apiCount] = await Promise.all([
        notificationApi.getNotifications(),
        notificationApi.getUnreadCount()
      ]);

      setNotifications(prev => {
        if (!remoteData || remoteData.length === 0) {
          return prev;
        }
        const existingIds = new Set(prev.map(n => n.id));
        const newRemoteItems = remoteData.filter(n => !existingIds.has(n.id));
        const merged = [...newRemoteItems, ...prev];
        saveNotificationsToStorage(merged);
        return merged;
      });

      setUnreadCount(prev => {
        const calculated = notifications.filter(n => !n.read).length;
        return apiCount > 0 ? apiCount : calculated;
      });
    } catch {
      // Keep existing local notifications intact
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      let deviceToken = localStorage.getItem('device_token');
      if (!deviceToken) {
        deviceToken = `web_device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('device_token', deviceToken);
      }
      notificationApi.registerDeviceToken(deviceToken, 'web').catch(() => {});
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const [profileStatus, setProfileStatus] = useState<{
    is_basic_complete: boolean;
    is_detailed_complete: boolean;
    completion_percentage: number;
  }>(() => {
    const email = localStorage.getItem('logged_in_email') || '';
    const isDone = isUserProfileCompleted(email);
    const token = Boolean(localStorage.getItem('access_token'));
    return {
      is_basic_complete: token ? isDone : false,
      is_detailed_complete: token ? isDone : false,
      completion_percentage: token && isDone ? 100 : 0
    };
  });

  const markProfileCompleted = () => {
    const email = localStorage.getItem('logged_in_email') || currentUser.email || '';
    markUserProfileCompleted(email);
    setProfileStatus({
      is_basic_complete: true,
      is_detailed_complete: true,
      completion_percentage: 100
    });
  };

  const checkProfileStatus = async (): Promise<ProfileApiResponse> => {
    const email = (localStorage.getItem('logged_in_email') || currentUser.email || '').toLowerCase();
    const isDoneLocally = isUserProfileCompleted(email);

    try {
      const res = await profileApi.getProfile();
      const isBasicDone = res.is_basic_complete || isDoneLocally;
      const isDetailedDone = res.is_detailed_complete || isDoneLocally;
      
      setProfileStatus({
        is_basic_complete: isBasicDone,
        is_detailed_complete: isDetailedDone,
        completion_percentage: isDoneLocally ? 100 : res.profile_completion_percentage
      });
      const storedName = localStorage.getItem('logged_in_name');
      const storedEmail = localStorage.getItem('logged_in_email') || res.email || currentUser.email || '';
      const emailName = extractNameFromEmail(storedEmail);
      const apiName = `${res.first_name || ''} ${res.last_name || ''}`.trim();
      
      let finalName = '';
      if (apiName && !isGenericName(apiName)) {
        finalName = apiName;
      } else if (storedName && !isGenericName(storedName)) {
        finalName = storedName;
      } else if (currentUser.name && !isGenericName(currentUser.name)) {
        finalName = currentUser.name;
      } else {
        finalName = emailName;
      }
      
      if (finalName && !isGenericName(finalName)) {
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
        is_basic_complete: isBasicDone,
        is_detailed_complete: isDetailedDone
      };
    } catch (err: any) {
      console.error('Error fetching profile status:', err);
      // Handle unauthorized or missing token
      if (err?.status === 401 || err?.response?.status === 401) {
        logout();
      }
      const emailName = extractNameFromEmail(currentUser.email || localStorage.getItem('logged_in_email'));
      const fallbackName = (currentUser.name && !isGenericName(currentUser.name)) ? currentUser.name : emailName;
      return {
        id: '',
        first_name: fallbackName,
        last_name: '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        gender: '',
        date_of_birth: '',
        is_basic_complete: isDoneLocally,
        is_detailed_complete: isDoneLocally,
        profile_completion_percentage: isDoneLocally ? 100 : 0
      };
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      checkProfileStatus();
    }
  }, [isAuthenticated]);

  const loginUser = async (payload: LoginRequest): Promise<ProfileApiResponse> => {
    const res = await authApi.login(payload);
    const userEmail = res.user?.email || payload.email || '';
    const prevEmail = localStorage.getItem('logged_in_email');

    // If logging in with a new user account, clear transient draft items
    if (!prevEmail || prevEmail.toLowerCase() !== userEmail.toLowerCase()) {
      localStorage.removeItem('user_profile_draft');
      localStorage.removeItem('vivah_mock_profile');
      localStorage.removeItem('vivah_mock_user');
    }

    const apiName = `${res.user?.first_name || ''} ${res.user?.last_name || ''}`.trim();
    const storedName = localStorage.getItem('logged_in_name');
    const emailName = extractNameFromEmail(userEmail);

    let finalName = '';
    if (apiName && !isGenericName(apiName)) {
      finalName = apiName;
    } else if (storedName && !isGenericName(storedName)) {
      finalName = storedName;
    } else {
      finalName = emailName;
    }

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
    const isDoneLocally = isUserProfileCompleted(userEmail);
    if (isDoneLocally) {
      markUserProfileCompleted(userEmail);
      profileRes.is_basic_complete = true;
      profileRes.is_detailed_complete = true;
      setProfileStatus({
        is_basic_complete: true,
        is_detailed_complete: true,
        completion_percentage: 100
      });
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
    const fullNamePayload = `${payload.first_name || ''} ${payload.last_name || ''}`.trim();
    const emailName = extractNameFromEmail(payload.email);
    const finalName = (fullNamePayload && !isGenericName(fullNamePayload)) ? fullNamePayload : emailName;

    localStorage.setItem('logged_in_name', finalName);
    localStorage.setItem('logged_in_email', payload.email);
    localStorage.setItem('login_method', 'google_register');
    setIsAuthenticated(true);
    setCurrentUser(prev => ({
      ...prev,
      name: finalName,
      email: payload.email
    }));
    setProfileStatus({
      is_basic_complete: false,
      is_detailed_complete: false,
      completion_percentage: 15
    });
    return {
      id: 'PRO-NEW',
      first_name: payload.first_name || finalName.split(' ')[0],
      last_name: payload.last_name || finalName.split(' ').slice(1).join(' ') || '',
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
    let googleName = '';
    let googleEmail = '';
    let googleAvatar = '';

    if (payload.id_token) {
      const decoded = decodeGoogleIdToken(payload.id_token);
      if (decoded) {
        if (decoded.name) {
          googleName = decoded.name;
        } else if (decoded.given_name) {
          googleName = `${decoded.given_name} ${decoded.family_name || ''}`.trim();
        }
        if (decoded.email) googleEmail = decoded.email;
        if (decoded.picture) googleAvatar = decoded.picture;
      }
    }

    const res = await googleAuthApi.googleLogin(payload);
    let userEmail = res.user?.email || googleEmail || localStorage.getItem('logged_in_email') || '';
    const apiName = `${res.user?.first_name || ''} ${res.user?.last_name || ''}`.trim();
    const storedName = localStorage.getItem('logged_in_name');
    const emailName = extractNameFromEmail(userEmail);

    let finalName = '';
    if (apiName && !isGenericName(apiName)) {
      finalName = apiName;
    } else if (googleName && !isGenericName(googleName)) {
      finalName = googleName;
    } else if (storedName && !isGenericName(storedName)) {
      finalName = storedName;
    } else {
      finalName = emailName;
    }

    if (finalName && !isGenericName(finalName)) {
      localStorage.setItem('logged_in_name', finalName);
    }
    if (userEmail) {
      localStorage.setItem('logged_in_email', userEmail);
    }
    if (googleAvatar) {
      localStorage.setItem('logged_in_avatar', googleAvatar);
    }

    localStorage.setItem('login_method', 'google');
    setIsAuthenticated(true);
    setCurrentUser(prev => ({
      ...prev,
      name: finalName,
      email: userEmail,
      avatar: googleAvatar || prev.avatar
    }));
    showToast('Google Login successful!');

    const profileRes = await checkProfileStatus();
    const isDoneLocally = isUserProfileCompleted(userEmail);
    if (isDoneLocally) {
      markUserProfileCompleted(userEmail);
      profileRes.is_basic_complete = true;
      profileRes.is_detailed_complete = true;
      setProfileStatus({
        is_basic_complete: true,
        is_detailed_complete: true,
        completion_percentage: 100
      });
    }
    return profileRes;
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
    const numericId = parseInt(String(profileId).replace(/\D/g, ''), 10);
    if (!isNaN(numericId) && numericId > 0) {
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
    const numericId = parseInt(String(profileId).replace(/\D/g, ''), 10);
    
    if (!isNaN(numericId) && numericId > 0) {
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
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveNotificationsToStorage(updated);
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
    notificationApi.markAsRead(id).catch(() => {});
  };

  const markAllNotificationsRead = async () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotificationsToStorage(updated);
      return updated;
    });
    setUnreadCount(0);
    try {
      await notificationApi.markAllAsRead();
    } catch {}
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveNotificationsToStorage(updated);
      return updated;
    });
    const target = notifications.find(n => n.id === id);
    if (target && !target.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    notificationApi.deleteNotification(id).catch(() => {});
  };

  const addNotification = (item: {
    title: string;
    message: string;
    category: NotificationItem['category'];
    link?: string;
    avatar?: string;
  }) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: item.title,
      message: item.message,
      category: item.category,
      timestamp: 'Just now',
      read: false,
      link: item.link,
      avatar: item.avatar
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      saveNotificationsToStorage(updated);
      return updated;
    });
    setUnreadCount(prev => prev + 1);
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
        unreadCount,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        addNotification,
        fetchNotifications,
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
        markProfileCompleted,
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
