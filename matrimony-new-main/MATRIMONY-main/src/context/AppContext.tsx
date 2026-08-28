import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Profile, NotificationItem, Interest, UserRole, MembershipTier } from '../types';
import type {
  RegisterRequest,
  LoginRequest,
  GoogleRegisterRequest,
  GoogleLoginRequest,
  PatchBasicProfileRequest,
  ProfileApiResponse,
  OnboardingStatus,
  VerificationState
} from '../types/apiTypes';
import { MOCK_PROFILES } from '../data/mockProfiles';
import { authApi } from '../api/authApi';
import { googleAuthApi } from '../api/googleAuthApi';
import { profileApi } from '../api/profileApi';
import { matchingApi } from '../api/matchingApi';
import { notificationApi } from '../api/notificationApi';
import { verificationService } from '../services/verification.service';
import { queryClient } from '../lib/queryClient';

// Import Focused Domain Stores
import { useAuthStore } from '../store/useAuthStore';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useSearchStore, initialSearchFilter, type SearchFilterState } from '../store/useSearchStore';
import { useShortlistStore } from '../store/useShortlistStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useChatStore } from '../store/useChatStore';
import { useUIStore } from '../store/useUIStore';

export type { SearchFilterState };

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
  onboardingStatus: OnboardingStatus;
  verificationStatus: VerificationState;
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
  markBasicProfileCompleted: () => void;
  markProfileCompleted: () => void;
  markPreferencesCompleted: () => void;
  submitMemberVerification: (formData: FormData, details?: { docType?: string; docPreview?: string; photoPreview?: string }) => Promise<void>;
  checkVerificationStatus: (email?: string) => Promise<VerificationState>;
  markVerificationCompleted: (status?: VerificationState) => void;
  skipVerificationForSession: () => void;
  adminApproveUserVerification: (userIdOrEmail: string | number) => Promise<void>;
  adminRejectUserVerification: (userIdOrEmail: string | number, reason: string) => Promise<void>;
  updateOnboardingStatus: (partial: Partial<OnboardingStatus>) => OnboardingStatus;
  getPendingRoute: () => string;
  updateCurrentUserAvatar: (avatarUrl: string) => void;
  logout: () => void;
}

export const getStoredOnboardingStatus = (email?: string): OnboardingStatus => {
  const currentEmail = (email || localStorage.getItem('logged_in_email') || '').toLowerCase().trim();
  const hasToken = Boolean(localStorage.getItem('access_token'));
  const loginMethod = localStorage.getItem('login_method');
  const regMethod = (localStorage.getItem('registration_method') as 'manual' | 'google' | null) ||
    (loginMethod === 'google_register' || loginMethod === 'google' ? 'google' : 'manual');

  const defaultStatus: OnboardingStatus = {
    registration_completed: hasToken,
    registration_method: regMethod,
    basic_profile_completed: regMethod === 'manual' ? hasToken : false,
    complete_profile_completed: false,
    partner_preferences_completed: false,
    verification_completed: false,
    verification_status: 'NOT_SUBMITTED',
    rejection_reason: null
  };

  if (!hasToken && !currentEmail) {
    return defaultStatus;
  }

  if (currentEmail) {
    const key = `onboarding_status_${currentEmail}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const mappedStatus: VerificationState = parsed.verification_status || (parsed.verification_completed ? 'PENDING' : 'NOT_SUBMITTED');
        return {
          ...defaultStatus,
          ...parsed,
          registration_completed: parsed.registration_completed ?? hasToken,
          verification_completed: parsed.verification_completed || mappedStatus === 'PENDING' || mappedStatus === 'VERIFIED',
          verification_status: mappedStatus
        };
      } catch {}
    }
  }

  return defaultStatus;
};

export const saveStoredOnboardingStatus = (partial: Partial<OnboardingStatus>, email?: string): OnboardingStatus => {
  const currentEmail = (email || localStorage.getItem('logged_in_email') || '').toLowerCase().trim();
  const current = getStoredOnboardingStatus(currentEmail);
  const updated: OnboardingStatus = {
    ...current,
    ...partial
  };

  if (currentEmail) {
    const key = `onboarding_status_${currentEmail}`;
    localStorage.setItem(key, JSON.stringify(updated));
  }

  if (updated.registration_method) {
    localStorage.setItem('registration_method', updated.registration_method);
  }

  if (
    updated.complete_profile_completed &&
    updated.partner_preferences_completed &&
    (updated.verification_status === 'PENDING' || updated.verification_status === 'VERIFIED')
  ) {
    if (currentEmail) {
      localStorage.setItem(`user_profile_completed_${currentEmail}`, 'true');
    }
  }

  return updated;
};

export const getNextPendingRoute = (status: OnboardingStatus): string => {
  if (!status.registration_completed) {
    return '/register';
  }
  if (status.registration_method === 'google' && !status.basic_profile_completed) {
    return '/complete-basic-profile';
  }
  if (!status.complete_profile_completed) {
    return '/profile/complete';
  }
  if (!status.partner_preferences_completed) {
    return '/preferences';
  }
  if (!status.verification_completed || status.verification_status === 'NOT_SUBMITTED' || status.verification_status === 'REJECTED') {
    return '/verification';
  }
  return '/matches';
};

export const isUserProfileCompleted = (email?: string): boolean => {
  const targetEmail = (email || localStorage.getItem('logged_in_email') || '').toLowerCase().trim();
  if (!targetEmail) return false;
  const key = `user_profile_completed_${targetEmail}`;
  if (localStorage.getItem(key) === 'true') return true;
  const status = getStoredOnboardingStatus(targetEmail);
  return Boolean(
    status.complete_profile_completed &&
    status.partner_preferences_completed &&
    (status.verification_status === 'PENDING' || status.verification_status === 'VERIFIED')
  );
};

export const markUserProfileCompleted = (email?: string): void => {
  const targetEmail = (email || localStorage.getItem('logged_in_email') || '').toLowerCase().trim();
  if (targetEmail) {
    const key = `user_profile_completed_${targetEmail}`;
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

  let cleaned = username.replace(/[._\-+]/g, ' ');
  const alphabeticOnly = cleaned.replace(/[0-9]/g, '').trim();
  const targetStr = alphabeticOnly.length >= 2 ? alphabeticOnly : cleaned;

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
  const loggedInAvatar = localStorage.getItem('logged_in_avatar') || localStorage.getItem('google_avatar');
  const draftPhoto = (() => {
    try {
      const draft = localStorage.getItem('user_profile_draft');
      return draft ? JSON.parse(draft)?.profile_photo : '';
    } catch {
      return '';
    }
  })();
  const emailName = extractNameFromEmail(loggedInEmail);
  const resolvedName = (loggedInName && !isGenericName(loggedInName)) ? loggedInName : emailName;

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedName || loggedInEmail || 'User')}&background=8B1E3F&color=ffffff&bold=true&size=256`;
  const avatarUrl = loggedInAvatar || draftPhoto || defaultAvatar;

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
  // Sync state with Zustand stores for optimal re-render isolation
  const currentUser = useAuthStore(state => state.currentUser);
  const setCurrentUserStore = useAuthStore(state => state.setCurrentUser);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const searchFilter = useSearchStore(state => state.searchFilter);
  const setSearchFilterStore = useSearchStore(state => state.setSearchFilter);
  const resetSearchFilterStore = useSearchStore(state => state.resetSearchFilter);

  const shortlistedIds = useShortlistStore(state => state.shortlistedIds);
  const toggleShortlistStore = useShortlistStore(state => state.toggleShortlist);

  const notifications = useNotificationStore(state => state.notifications);
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const fetchNotificationsStore = useNotificationStore(state => state.fetchNotifications);
  const markNotificationReadStore = useNotificationStore(state => state.markNotificationRead);
  const markAllNotificationsReadStore = useNotificationStore(state => state.markAllNotificationsRead);
  const deleteNotificationStore = useNotificationStore(state => state.deleteNotification);
  const addNotificationStore = useNotificationStore(state => state.addNotification);

  const activeChatUserId = useChatStore(state => state.activeChatUserId);
  const setActiveChatUserIdStore = useChatStore(state => state.setActiveChatUserId);

  const toastMessage = useUIStore(state => state.toastMessage);
  const showToastStore = useUIStore(state => state.showToast);

  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [interests, setInterests] = useState<Interest[]>([]);

  // Sync initial user state to auth store if needed
  useEffect(() => {
    if (localStorage.getItem('access_token') && !isAuthenticated) {
      const initialUser = getInitialUser();
      useAuthStore.setState({
        accessToken: localStorage.getItem('access_token'),
        refreshToken: localStorage.getItem('refresh_token'),
        isAuthenticated: true,
        currentUser: initialUser
      });
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotificationsStore();
      let deviceToken = localStorage.getItem('device_token');
      if (!deviceToken) {
        deviceToken = `web_device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('device_token', deviceToken);
      }
      notificationApi.registerDeviceToken(deviceToken, 'web').catch(() => {});

      const intervalId = setInterval(() => {
        fetchNotificationsStore();
      }, 15000);

      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated]);

  const [onboardingStatus, setOnboardingStatusState] = useState<OnboardingStatus>(() => {
    const email = localStorage.getItem('logged_in_email') || '';
    return getStoredOnboardingStatus(email);
  });

  const [verificationStatus, setVerificationStatusState] = useState<VerificationState>(() => {
    const email = localStorage.getItem('logged_in_email') || '';
    const stored = getStoredOnboardingStatus(email);
    return stored.verification_status || (stored.verification_completed ? 'PENDING' : 'NOT_SUBMITTED');
  });

  const [profileStatus, setProfileStatus] = useState<{
    is_basic_complete: boolean;
    is_detailed_complete: boolean;
    completion_percentage: number;
  }>(() => {
    const email = localStorage.getItem('logged_in_email') || '';
    const isDone = isUserProfileCompleted(email);
    const token = Boolean(localStorage.getItem('access_token'));
    const stored = getStoredOnboardingStatus(email);
    return {
      is_basic_complete: token ? (stored.basic_profile_completed || isDone) : false,
      is_detailed_complete: token ? (stored.complete_profile_completed || isDone) : false,
      completion_percentage: token && isDone ? 100 : (stored.complete_profile_completed ? 80 : (stored.basic_profile_completed ? 30 : 0))
    };
  });

  const updateOnboardingStatus = (partial: Partial<OnboardingStatus>): OnboardingStatus => {
    const email = localStorage.getItem('logged_in_email') || currentUser.email || '';
    const updated = saveStoredOnboardingStatus(partial, email);
    setOnboardingStatusState(updated);
    useOnboardingStore.getState().setOnboardingStatus(updated);
    if (updated.verification_status) {
      setVerificationStatusState(updated.verification_status);
    }
    return updated;
  };

  const getPendingRoute = (): string => {
    return getNextPendingRoute(onboardingStatus);
  };

  const markBasicProfileCompleted = () => {
    const email = localStorage.getItem('logged_in_email') || currentUser.email || '';
    const updated = saveStoredOnboardingStatus({ basic_profile_completed: true }, email);
    setOnboardingStatusState(updated);
    setProfileStatus(prev => ({
      ...prev,
      is_basic_complete: true,
      completion_percentage: Math.max(prev.completion_percentage, 30)
    }));
  };

  const markProfileCompleted = () => {
    const email = localStorage.getItem('logged_in_email') || currentUser.email || '';
    const updated = saveStoredOnboardingStatus({ complete_profile_completed: true, basic_profile_completed: true }, email);
    setOnboardingStatusState(updated);
    setProfileStatus({
      is_basic_complete: true,
      is_detailed_complete: true,
      completion_percentage: 85
    });
  };

  const markPreferencesCompleted = () => {
    const email = localStorage.getItem('logged_in_email') || currentUser.email || '';
    const updated = saveStoredOnboardingStatus({
      partner_preferences_completed: true,
      complete_profile_completed: true,
      basic_profile_completed: true
    }, email);
    setOnboardingStatusState(updated);
    setProfileStatus(prev => ({
      ...prev,
      completion_percentage: 90
    }));
  };

  const markVerificationCompleted = (status: VerificationState = 'PENDING') => {
    const email = (localStorage.getItem('logged_in_email') || currentUser.email || '').toLowerCase().trim();
    const updated = saveStoredOnboardingStatus({
      verification_completed: status === 'PENDING' || status === 'VERIFIED',
      verification_status: status,
      rejection_reason: null
    }, email);
    setOnboardingStatusState(updated);
    setVerificationStatusState(status);
    if (status === 'VERIFIED') {
      setCurrentUserStore({ verified: true });
      markUserProfileCompleted(email);
    }
  };

  const submitMemberVerification = async (
    formData: FormData,
    details?: { docType?: string; docPreview?: string; photoPreview?: string }
  ) => {
    const email = (localStorage.getItem('logged_in_email') || currentUser.email || '').toLowerCase().trim();
    try {
      await verificationService.submitVerification(formData);
    } catch (err: any) {
      console.warn('[AppContext] Backend verification submission warning:', err?.message);
    }

    const updated = saveStoredOnboardingStatus({
      verification_completed: true,
      verification_status: 'PENDING',
      rejection_reason: null
    }, email);

    setOnboardingStatusState(updated);
    setVerificationStatusState('PENDING');

    const userRecord = {
      status: 'PENDING',
      is_verified: false,
      rejection_reason: null,
      id_document_type: details?.docType || 'Government ID',
      id_document_url: details?.docPreview || '',
      live_photo_url: details?.photoPreview || '',
      submitted_at: new Date().toISOString()
    };
    if (email) {
      localStorage.setItem(`user_verification_${email}`, JSON.stringify(userRecord));
    }

    try {
      const existingQueueRaw = localStorage.getItem('admin_pending_verifications');
      const queue: any[] = existingQueueRaw ? JSON.parse(existingQueueRaw) : [];
      const filtered = queue.filter(item => item.user_email?.toLowerCase() !== email);
      filtered.unshift({
        id: `VERIFY-${Date.now()}`,
        user_id: currentUser.id || `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        user_email: email,
        user_name: currentUser.name || extractNameFromEmail(email),
        user_phone: currentUser.phone || '',
        gender: currentUser.gender || '',
        id_document_type: details?.docType || 'Government ID',
        id_document_url: details?.docPreview || '',
        live_photo_url: details?.photoPreview || '',
        status: 'PENDING',
        submitted_at: new Date().toLocaleString()
      });
      localStorage.setItem('admin_pending_verifications', JSON.stringify(filtered));
    } catch {}

    showToastStore('✓ Verification documents submitted for Admin Review');
  };

  const skipVerificationForSession = () => {
    sessionStorage.setItem('verification_skipped_session', 'true');
    setOnboardingStatusState(prev => ({
      ...prev,
      verification_skipped_for_session: true
    }));
    useOnboardingStore.getState().skipVerificationForSession();
    showToastStore('Verification skipped for now. Redirecting to matches...');
  };

  const checkVerificationStatus = async (email?: string): Promise<VerificationState> => {
    const targetEmail = (email || localStorage.getItem('logged_in_email') || currentUser.email || '').toLowerCase().trim();
    try {
      const res = await verificationService.getVerificationStatus();
      const mapped = (res.status || (res.is_verified ? 'VERIFIED' : 'NOT_SUBMITTED')) as VerificationState;
      if (targetEmail) {
        saveStoredOnboardingStatus({
          verification_completed: mapped === 'PENDING' || mapped === 'VERIFIED',
          verification_status: mapped,
          rejection_reason: res.rejection_reason || null
        }, targetEmail);
      }
      setVerificationStatusState(mapped);
      if (mapped === 'VERIFIED') {
        setCurrentUserStore({ verified: true });
      }
      return mapped;
    } catch {
      const stored = getStoredOnboardingStatus(targetEmail);
      return stored.verification_status;
    }
  };

  const adminApproveUserVerification = async (userIdOrEmail: string | number) => {
    const target = String(userIdOrEmail).toLowerCase().trim();
    try {
      await verificationService.approveVerification(userIdOrEmail, target);
    } catch {}

    let targetEmail = target.includes('@') ? target : '';
    try {
      const existingQueueRaw = localStorage.getItem('admin_pending_verifications');
      let queue: any[] = existingQueueRaw ? JSON.parse(existingQueueRaw) : [];
      const found = queue.find(item => String(item.user_id).toLowerCase() === target || item.user_email?.toLowerCase() === target);
      if (found?.user_email) targetEmail = found.user_email.toLowerCase();

      queue = queue.map(item => {
        if (String(item.user_id).toLowerCase() === target || item.user_email?.toLowerCase() === target) {
          return { ...item, status: 'VERIFIED' };
        }
        return item;
      });
      localStorage.setItem('admin_pending_verifications', JSON.stringify(queue));
    } catch {}

    if (targetEmail) {
      saveStoredOnboardingStatus({
        verification_completed: true,
        verification_status: 'VERIFIED',
        rejection_reason: null
      }, targetEmail);

      const userRecord = {
        status: 'VERIFIED',
        is_verified: true,
        rejection_reason: null,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(`user_verification_${targetEmail}`, JSON.stringify(userRecord));

      const currentEmail = (localStorage.getItem('logged_in_email') || currentUser.email || '').toLowerCase().trim();
      if (currentEmail === targetEmail) {
        setVerificationStatusState('VERIFIED');
        setCurrentUserStore({ verified: true });
      }
    }

    showToastStore('✓ Member successfully verified! Verified badge activated.');
  };

  const adminRejectUserVerification = async (userIdOrEmail: string | number, reason: string) => {
    const target = String(userIdOrEmail).toLowerCase().trim();
    try {
      await verificationService.rejectVerification(userIdOrEmail, reason, target);
    } catch {}

    let targetEmail = target.includes('@') ? target : '';
    try {
      const existingQueueRaw = localStorage.getItem('admin_pending_verifications');
      let queue: any[] = existingQueueRaw ? JSON.parse(existingQueueRaw) : [];
      const found = queue.find(item => String(item.user_id).toLowerCase() === target || item.user_email?.toLowerCase() === target);
      if (found?.user_email) targetEmail = found.user_email.toLowerCase();

      queue = queue.map(item => {
        if (String(item.user_id).toLowerCase() === target || item.user_email?.toLowerCase() === target) {
          return { ...item, status: 'REJECTED', rejection_reason: reason };
        }
        return item;
      });
      localStorage.setItem('admin_pending_verifications', JSON.stringify(queue));
    } catch {}

    if (targetEmail) {
      saveStoredOnboardingStatus({
        verification_completed: false,
        verification_status: 'REJECTED',
        rejection_reason: reason
      }, targetEmail);

      const userRecord = {
        status: 'REJECTED',
        is_verified: false,
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(`user_verification_${targetEmail}`, JSON.stringify(userRecord));

      const currentEmail = (localStorage.getItem('logged_in_email') || currentUser.email || '').toLowerCase().trim();
      if (currentEmail === targetEmail) {
        setVerificationStatusState('REJECTED');
        setCurrentUserStore({ verified: false });
      }
    }

    showToastStore('Verification rejected.');
  };

  const checkProfileStatus = async (): Promise<ProfileApiResponse> => {
    const email = (localStorage.getItem('logged_in_email') || currentUser.email || '').toLowerCase().trim();
    const storedStatus = getStoredOnboardingStatus(email);
    const isDoneLocally = isUserProfileCompleted(email);

    try {
      const res = await profileApi.getProfile();
      const isBasicDone = Boolean(res.is_basic_complete) || storedStatus.basic_profile_completed || (storedStatus.registration_method === 'manual');
      const isDetailedDone = Boolean(res.is_detailed_complete) || storedStatus.complete_profile_completed;
      const isPreferencesDone = Boolean((res as any).is_preferences_complete) || storedStatus.partner_preferences_completed;

      let mappedVStatus: VerificationState = storedStatus.verification_status || (storedStatus.verification_completed ? 'PENDING' : 'NOT_SUBMITTED');
      let vRejectionReason: string | null = storedStatus.rejection_reason || null;

      try {
        const vRes = await verificationService.getVerificationStatus();
        if (vRes.status) {
          mappedVStatus = vRes.status as VerificationState;
          vRejectionReason = vRes.rejection_reason || null;
        }
      } catch {}

      const syncedStatus = saveStoredOnboardingStatus({
        registration_completed: true,
        basic_profile_completed: isBasicDone,
        complete_profile_completed: isDetailedDone,
        partner_preferences_completed: isPreferencesDone,
        verification_completed: mappedVStatus === 'PENDING' || mappedVStatus === 'VERIFIED',
        verification_status: mappedVStatus,
        rejection_reason: vRejectionReason
      }, email);

      setOnboardingStatusState(syncedStatus);
      setVerificationStatusState(mappedVStatus);

      setProfileStatus({
        is_basic_complete: isBasicDone,
        is_detailed_complete: isDetailedDone,
        completion_percentage: isDoneLocally ? 100 : (isDetailedDone ? 85 : (isBasicDone ? 30 : 15))
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

      const storedAvatar = localStorage.getItem('logged_in_avatar') || localStorage.getItem('google_avatar') || '';
      const photoUrl = (res as any).profile_photo || (res as any).profile_image || (res as any).avatar || res.detailed_profile?.profile_photo || storedAvatar;
      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName || storedEmail || 'User')}&background=8B1E3F&color=ffffff&bold=true&size=256`;
      const finalAvatar = photoUrl || defaultAvatar;

      if (finalAvatar) {
        localStorage.setItem('logged_in_avatar', finalAvatar);
      }

      setCurrentUserStore({
        name: finalName,
        email: res.email || storedEmail || currentUser.email,
        phone: res.phone || currentUser.phone,
        avatar: finalAvatar
      });

      return {
        ...res,
        is_basic_complete: isBasicDone,
        is_detailed_complete: isDetailedDone
      };
    } catch (err: any) {
      console.error('Error fetching profile status:', err);
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
        is_basic_complete: storedStatus.basic_profile_completed || isDoneLocally,
        is_detailed_complete: storedStatus.complete_profile_completed || isDoneLocally,
        profile_completion_percentage: isDoneLocally ? 100 : (storedStatus.complete_profile_completed ? 85 : 0)
      };
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      checkProfileStatus();
    }
  }, [isAuthenticated]);

  const clearUserStateAndCache = () => {
    try {
      queryClient.clear();
    } catch {}
    localStorage.removeItem('local_user_notifications');
    localStorage.removeItem('local_sent_interest_user_ids');
    localStorage.removeItem('local_accepted_interest_ids');
    localStorage.removeItem('local_rejected_interest_ids');
    localStorage.removeItem('local_deleted_interest_ids');
    localStorage.removeItem('local_ignored_user_ids');
    localStorage.removeItem('local_photo_requested_user_ids');
    useNotificationStore.getState().clearNotifications();
  };

  const loginUser = async (payload: LoginRequest): Promise<ProfileApiResponse> => {
    clearUserStateAndCache();
    const res = await authApi.login(payload);
    const userEmail = res.user?.email || payload.email || '';
    const prevEmail = localStorage.getItem('logged_in_email');

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

    useAuthStore.setState({
      accessToken: res.access_token || localStorage.getItem('access_token'),
      refreshToken: res.refresh_token || localStorage.getItem('refresh_token'),
      isAuthenticated: true,
      currentUser: {
        ...currentUser,
        name: finalName,
        email: userEmail
      }
    });

    showToastStore('Logged in successfully!');

    const userOnboarding = getStoredOnboardingStatus(userEmail);
    setOnboardingStatusState(userOnboarding);

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
    clearUserStateAndCache();
    const res = await authApi.register(payload);
    if (res.access_token) {
      const name = `${payload.first_name} ${payload.last_name || ''}`.trim();
      localStorage.setItem('logged_in_name', name);
      localStorage.setItem('logged_in_email', payload.email);
      localStorage.setItem('login_method', 'email');
      localStorage.setItem('registration_method', 'manual');

      useAuthStore.setState({
        accessToken: res.access_token,
        refreshToken: res.refresh_token || null,
        isAuthenticated: true,
        currentUser: {
          ...currentUser,
          name,
          email: payload.email || currentUser.email,
          phone: payload.phone || currentUser.phone
        }
      });

      const newStatus = saveStoredOnboardingStatus({
        registration_completed: true,
        registration_method: 'manual',
        basic_profile_completed: true,
        complete_profile_completed: false,
        partner_preferences_completed: false,
      }, payload.email);

      setOnboardingStatusState(newStatus);
      setProfileStatus({
        is_basic_complete: true,
        is_detailed_complete: false,
        completion_percentage: 20
      });
    }
    showToastStore('Registration successful! Welcome.');
    return res;
  };

  const googleRegisterUser = async (payload: GoogleRegisterRequest): Promise<ProfileApiResponse> => {
    clearUserStateAndCache();
    await googleAuthApi.googleRegister(payload);
    const fullNamePayload = `${payload.first_name || ''} ${payload.last_name || ''}`.trim();
    const emailName = extractNameFromEmail(payload.email);
    const finalName = (fullNamePayload && !isGenericName(fullNamePayload)) ? fullNamePayload : emailName;

    localStorage.setItem('logged_in_name', finalName);
    localStorage.setItem('logged_in_email', payload.email);
    localStorage.setItem('login_method', 'google_register');
    localStorage.setItem('registration_method', 'google');

    useAuthStore.setState({
      accessToken: localStorage.getItem('access_token'),
      refreshToken: localStorage.getItem('refresh_token'),
      isAuthenticated: true,
      currentUser: {
        ...currentUser,
        name: finalName,
        email: payload.email
      }
    });

    const newStatus = saveStoredOnboardingStatus({
      registration_completed: true,
      registration_method: 'google',
      basic_profile_completed: false,
      complete_profile_completed: false,
      partner_preferences_completed: false,
    }, payload.email);

    setOnboardingStatusState(newStatus);
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
    clearUserStateAndCache();
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
        if (decoded.picture || decoded.avatar || decoded.photo_url || decoded.photo) {
          googleAvatar = decoded.picture || decoded.avatar || decoded.photo_url || decoded.photo;
        }
      }
    }

    const res = await googleAuthApi.googleLogin(payload);
    let userEmail = res.user?.email || googleEmail || localStorage.getItem('logged_in_email') || '';
    const apiName = `${res.user?.first_name || ''} ${res.user?.last_name || ''}`.trim();
    const apiAvatar = (res.user as any)?.picture ||
      (res.user as any)?.avatar ||
      (res.user as any)?.profile_image ||
      (res.user as any)?.photo_url ||
      (res.user as any)?.image ||
      (res as any)?.picture ||
      (res as any)?.avatar;

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

    const resolvedAvatar = apiAvatar || googleAvatar || localStorage.getItem('logged_in_avatar') || localStorage.getItem('google_avatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName || userEmail || 'User')}&background=8B1E3F&color=ffffff&bold=true&size=256`;

    if (finalName && !isGenericName(finalName)) {
      localStorage.setItem('logged_in_name', finalName);
    }
    if (userEmail) {
      localStorage.setItem('logged_in_email', userEmail);
    }
    if (resolvedAvatar) {
      localStorage.setItem('logged_in_avatar', resolvedAvatar);
      localStorage.setItem('google_avatar', resolvedAvatar);
    }

    localStorage.setItem('login_method', 'google');

    useAuthStore.setState({
      accessToken: res.access_token || localStorage.getItem('access_token'),
      refreshToken: res.refresh_token || localStorage.getItem('refresh_token'),
      isAuthenticated: true,
      currentUser: {
        ...currentUser,
        name: finalName,
        email: userEmail,
        avatar: resolvedAvatar
      }
    });

    showToastStore('Google Login successful!');

    const userOnboarding = getStoredOnboardingStatus(userEmail);
    setOnboardingStatusState(userOnboarding);

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
    markBasicProfileCompleted();
    await checkProfileStatus();
    showToastStore('✓ Profile Updated Successfully');
  };

  const updateCurrentUserAvatar = (avatarUrl: string) => {
    if (!avatarUrl) return;
    localStorage.setItem('logged_in_avatar', avatarUrl);
    setCurrentUserStore({ avatar: avatarUrl });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('[AppContext] Backend logout notice:', err);
    }
    clearUserStateAndCache();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('login_method');
    localStorage.removeItem('registration_method');
    localStorage.removeItem('logged_in_name');
    localStorage.removeItem('logged_in_email');
    localStorage.removeItem('logged_in_avatar');
    localStorage.removeItem('user_profile_draft');
    localStorage.removeItem('user_profile_completed');
    localStorage.removeItem('user_partner_preferences');
    localStorage.removeItem('vivah_mock_profile');
    localStorage.removeItem('vivah_mock_user');
    sessionStorage.removeItem('verification_skipped_session');

    useAuthStore.getState().logout();
    setOnboardingStatusState(getStoredOnboardingStatus(''));
    setProfileStatus({
      is_basic_complete: false,
      is_detailed_complete: false,
      completion_percentage: 0
    });
    showToastStore('Logged out successfully.');
  };

  const setCurrentUserRole = (role: UserRole) => {
    setCurrentUserStore({ role });
    showToastStore(`Switched user mode to ${role.toUpperCase()}`);
  };

  const setMembershipTier = (membershipTier: MembershipTier) => {
    setCurrentUserStore({ membershipTier });
    showToastStore(`Membership updated to ${membershipTier}`);
  };

  const sendInterest = async (profileId: string) => {
    const target = profiles.find(p => p.id === profileId);
    const numericId = parseInt(String(profileId).replace(/\D/g, ''), 10);
    
    if (!isNaN(numericId) && numericId > 0) {
      try {
        await matchingApi.sendInterest({ to_user: numericId, message: 'Hi, I am interested in your profile.' });
        
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
        showToastStore(`Interest sent successfully to ${target ? target.name : 'member'} 💕`);
        
        addNotificationStore({
          title: 'Interest Request Sent 💌',
          message: `Your interest expression was sent to ${target ? target.name : 'member'}. You will be notified when they respond.`,
          category: 'Interests',
          link: '/interests',
          avatar: target?.profileImage
        });

        queryClient.invalidateQueries({ queryKey: ['matching'] });
      } catch (err: any) {
        showToastStore(err?.message || 'Failed to send interest to backend');
      }
      return;
    }

    if (!target) return;
    const existing = interests.find(i => i.receiverId === profileId && i.senderId === currentUser.id);
    if (existing) {
      showToastStore(`Interest already sent to ${target.name}`);
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
    showToastStore(`Interest sent successfully to ${target.name} 💕`);
  };

  const toggleShortlist = async (profileId: string) => {
    const target = profiles.find(p => p.id === profileId);
    await toggleShortlistStore(profileId, target?.name, target?.profileImage);
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
        markNotificationRead: markNotificationReadStore,
        markAllNotificationsRead: markAllNotificationsReadStore,
        deleteNotification: deleteNotificationStore,
        addNotification: addNotificationStore,
        fetchNotifications: fetchNotificationsStore,
        searchFilter,
        setSearchFilter: setSearchFilterStore,
        resetSearchFilter: resetSearchFilterStore,
        activeChatUserId,
        setActiveChatUserId: setActiveChatUserIdStore,
        toastMessage,
        showToast: showToastStore,

        isAuthenticated,
        onboardingStatus,
        verificationStatus,
        profileStatus,
        loginUser,
        registerUser,
        googleRegisterUser,
        googleLoginUser,
        patchBasicProfile,
        checkProfileStatus,
        markBasicProfileCompleted,
        markProfileCompleted,
        markPreferencesCompleted,
        submitMemberVerification,
        checkVerificationStatus,
        markVerificationCompleted,
        skipVerificationForSession,
        adminApproveUserVerification,
        adminRejectUserVerification,
        updateOnboardingStatus,
        getPendingRoute,
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
