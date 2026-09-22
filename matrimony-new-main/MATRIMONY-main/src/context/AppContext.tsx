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
import { partnerPreferencesService } from '../services/partnerPreferences.service';
import { identityVerificationService } from '../services/identityVerification.service';
import { queryClient } from '../lib/queryClient';
import { isAtLeast18YearsOld } from '../utils/validationSchemas';
import { isDummyImage } from '../components/ui/MatchAvatar';

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
    basic_profile_completed: hasToken,
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
          basic_profile_completed: true,
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

import { isGenericName, decodeGoogleIdToken, extractNameFromEmail } from '../utils/nameUtils';
export { isGenericName, decodeGoogleIdToken, extractNameFromEmail };

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
  const emailName = extractNameFromEmail(loggedInEmail);
  const resolvedName = (loggedInName && !isGenericName(loggedInName)) ? loggedInName : emailName;

  const photo = (loggedInAvatar && !isDummyImage(loggedInAvatar)) ? loggedInAvatar : (draftPhoto && !isDummyImage(draftPhoto) ? draftPhoto : '');

  const storedUserId = localStorage.getItem('user_id') || '';
  if (localStorage.getItem('access_token')) {
    return {
      ...defaultEmptyUser,
      id: storedUserId,
      name: resolvedName,
      email: loggedInEmail,
      avatar: photo
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
    // Clear any legacy client-side registered flags so real database state is always respected
    localStorage.removeItem('has_registered');
    localStorage.removeItem('last_registered_phone');
    localStorage.removeItem('last_registered_email');

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
      if (import.meta.env.VITE_ENABLE_DEVICE_TOKEN === 'true') {
        notificationApi.registerDeviceToken(deviceToken, 'web').catch(() => {});
      }

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
      verification_status: 'VERIFIED',
      rejection_reason: null
    }, email);

    setOnboardingStatusState(updated);
    setVerificationStatusState('VERIFIED');
    setCurrentUserStore({ verified: true });
    localStorage.setItem('verification_completed', 'true');

    const userRecord = {
      status: 'VERIFIED',
      is_verified: true,
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
    localStorage.setItem('verification_skipped', 'true');
    sessionStorage.setItem('verification_skipped_session', 'true');
    setOnboardingStatusState(prev => ({
      ...prev,
      verification_skipped: true,
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
      // 1. Profile Status from Backend
      const res = await profileApi.getProfile();
      const hasBackendProfile = Boolean(
        res.is_detailed_complete ||
        (res.id && String(res.id) !== '' && String(res.id) !== '0') ||
        res.highest_education ||
        res.occupation ||
        res.religion ||
        (res as any).height
      );
      const isBasicDone = Boolean(res.is_basic_complete) || storedStatus.basic_profile_completed || (storedStatus.registration_method === 'manual') || hasBackendProfile;
      const isDetailedDone = hasBackendProfile || storedStatus.complete_profile_completed;

      // 2. Partner Preferences Status from Backend
      let isPreferencesDone = Boolean(storedStatus.partner_preferences_completed);
      try {
        const prefRes = await partnerPreferencesService.getPreferences();
        if (
          prefRes &&
          (prefRes.id != null || (prefRes as any).partner_preference_id != null || (prefRes as any).user_id != null || prefRes.created_at != null || Object.keys(prefRes).length > 2)
        ) {
          isPreferencesDone = true;
        }
      } catch (prefErr) {
        console.warn('Could not load partner preferences from backend:', prefErr);
      }

      // 3. Identity Verification Status from Backend
      let mappedVStatus: VerificationState = storedStatus.verification_status || (storedStatus.verification_completed ? 'PENDING' : 'NOT_SUBMITTED');
      let vRejectionReason: string | null = storedStatus.rejection_reason || null;

      try {
        const idVRes = await identityVerificationService.getVerificationStatus();
        if (idVRes.isVerified || idVRes.code === 'VERIFIED') {
          mappedVStatus = 'VERIFIED';
        } else if (idVRes.code === 'PENDING') {
          mappedVStatus = 'PENDING';
        } else if (idVRes.code === 'REJECTED') {
          mappedVStatus = 'REJECTED';
          vRejectionReason = idVRes.adminReviewMessage || idVRes.message || null;
        }
      } catch {
        try {
          const vRes = await verificationService.getVerificationStatus();
          if (vRes.status) {
            mappedVStatus = vRes.status as VerificationState;
            vRejectionReason = vRes.rejection_reason || null;
          }
        } catch {}
      }

      const isVerificationDone =
        mappedVStatus === 'VERIFIED' ||
        mappedVStatus === 'PENDING' ||
        Boolean(storedStatus.verification_completed) ||
        localStorage.getItem('verification_completed') === 'true' ||
        localStorage.getItem('verification_skipped') === 'true';

      const syncedStatus = saveStoredOnboardingStatus({
        registration_completed: true,
        basic_profile_completed: isBasicDone,
        complete_profile_completed: isDetailedDone,
        partner_preferences_completed: isPreferencesDone,
        verification_completed: isVerificationDone,
        verification_status: mappedVStatus,
        rejection_reason: vRejectionReason
      }, email);

      setOnboardingStatusState(syncedStatus);
      useOnboardingStore.getState().setOnboardingStatus(syncedStatus);
      setVerificationStatusState(mappedVStatus);

      if (isDetailedDone && isPreferencesDone) {
        markUserProfileCompleted(email);
      }

      setProfileStatus({
        is_basic_complete: isBasicDone,
        is_detailed_complete: isDetailedDone,
        completion_percentage: isDoneLocally || (isDetailedDone && isPreferencesDone) ? 100 : (isDetailedDone ? 85 : (isBasicDone ? 30 : 15))
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

      const photoUrl = (res as any).profile_photo || (res as any).profile_image || (res as any).photo || (res as any).avatar || res.detailed_profile?.profile_photo || '';
      let candidateAvatar = (photoUrl && typeof photoUrl === 'string' && photoUrl.trim() && !isDummyImage(photoUrl)) ? photoUrl.trim() : '';

      const storedAvatar = localStorage.getItem('logged_in_avatar') || currentUser.avatar || '';
      const draftAvatar = (() => {
        try {
          const draft = localStorage.getItem('user_profile_draft');
          return draft ? JSON.parse(draft)?.profile_photo : '';
        } catch {
          return '';
        }
      })();

      if (!candidateAvatar && storedAvatar && !isDummyImage(storedAvatar)) {
        candidateAvatar = storedAvatar;
      } else if (!candidateAvatar && draftAvatar && !isDummyImage(draftAvatar)) {
        candidateAvatar = draftAvatar;
      }

      const finalAvatar = candidateAvatar;
      if (finalAvatar) {
        localStorage.setItem('logged_in_avatar', finalAvatar);
      }
      localStorage.removeItem('google_avatar');

      const resolvedUserId = String(
        (res as any).user_id ||
        (res as any).user?.id ||
        (res.id && String(res.id) !== '0' ? res.id : '') ||
        currentUser.id ||
        localStorage.getItem('user_id') ||
        ''
      );
      if (resolvedUserId && resolvedUserId !== '0') {
        localStorage.setItem('user_id', resolvedUserId);
      }

      const resolvedMemberId = (res as any).member_id || (res as any).user_member_id || '';
      if (resolvedMemberId) {
        localStorage.setItem('member_id', resolvedMemberId);
      }

      setCurrentUserStore({
        id: resolvedUserId,
        name: finalName,
        email: res.email || storedEmail || currentUser.email,
        phone: res.phone || currentUser.phone,
        avatar: finalAvatar,
        member_id: resolvedMemberId || (currentUser as any).member_id
      } as any);

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
    localStorage.removeItem('logged_in_name');
    localStorage.removeItem('logged_in_avatar');
    localStorage.removeItem('google_avatar');
    localStorage.removeItem('logged_in_gender');
    localStorage.removeItem('logged_in_dob');
    localStorage.removeItem('logged_in_phone');
    localStorage.removeItem('user_profile_draft');
    localStorage.removeItem('vivah_mock_profile');
    localStorage.removeItem('vivah_mock_user');
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

    const userId = String(res.user?.id || res.user?.user_id || localStorage.getItem('user_id') || '');
    if (userId) {
      localStorage.setItem('user_id', userId);
    }

    useAuthStore.setState({
      accessToken: res.access_token || localStorage.getItem('access_token'),
      refreshToken: res.refresh_token || localStorage.getItem('refresh_token'),
      isAuthenticated: true,
      currentUser: {
        ...currentUser,
        id: userId,
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
    if (payload.date_of_birth && !isAtLeast18YearsOld(payload.date_of_birth)) {
      throw new Error('You must be 18 years or older to register.');
    }
    clearUserStateAndCache();
    const res = await authApi.register(payload);
    if (res.access_token) {
      const name = `${payload.first_name} ${payload.last_name || ''}`.trim();
      localStorage.setItem('logged_in_name', name);
      localStorage.setItem('logged_in_email', payload.email);
      localStorage.setItem('login_method', 'email');
      localStorage.setItem('registration_method', 'manual');
      if (payload.gender) localStorage.setItem('logged_in_gender', payload.gender);
      if (payload.date_of_birth) localStorage.setItem('logged_in_dob', payload.date_of_birth);
      if (payload.phone) localStorage.setItem('logged_in_phone', payload.phone);

      const regUserId = String(res.user?.id || (res as any)?.user_id || localStorage.getItem('user_id') || '');
      if (regUserId) {
        localStorage.setItem('user_id', regUserId);
      }

      useAuthStore.setState({
        accessToken: res.access_token,
        refreshToken: res.refresh_token || null,
        isAuthenticated: true,
        currentUser: {
          ...currentUser,
          id: regUserId,
          name,
          email: payload.email || currentUser.email,
          phone: payload.phone || currentUser.phone,
          gender: payload.gender || currentUser.gender,
          date_of_birth: payload.date_of_birth || currentUser.date_of_birth
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
    if (payload.gender) localStorage.setItem('logged_in_gender', payload.gender);
    if (payload.date_of_birth) localStorage.setItem('logged_in_dob', payload.date_of_birth);
    if (payload.phone) localStorage.setItem('logged_in_phone', payload.phone);

    useAuthStore.setState({
      accessToken: localStorage.getItem('access_token'),
      refreshToken: localStorage.getItem('refresh_token'),
      isAuthenticated: true,
      currentUser: {
        ...currentUser,
        name: finalName,
        email: payload.email,
        phone: payload.phone || currentUser.phone,
        gender: payload.gender || currentUser.gender,
        date_of_birth: payload.date_of_birth || currentUser.date_of_birth
      }
    });

    const newStatus = saveStoredOnboardingStatus({
      registration_completed: true,
      registration_method: 'google',
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

    return {
      id: 'PRO-NEW',
      first_name: payload.first_name || finalName.split(' ')[0],
      last_name: payload.last_name || finalName.split(' ').slice(1).join(' ') || '',
      email: payload.email,
      phone: '',
      gender: '',
      date_of_birth: '',
      is_basic_complete: true,
      is_detailed_complete: false,
      profile_completion_percentage: 20
    };
  };

  const googleLoginUser = async (payload: GoogleLoginRequest): Promise<ProfileApiResponse> => {
    clearUserStateAndCache();
    let googleEmail = '';

    if (payload.id_token) {
      const decoded = decodeGoogleIdToken(payload.id_token);
      if (decoded && decoded.email) {
        googleEmail = decoded.email;
      }
    }

    const res = await googleAuthApi.googleLogin(payload);
    let userEmail = res.user?.email || googleEmail || localStorage.getItem('logged_in_email') || '';

    if (userEmail) {
      localStorage.setItem('logged_in_email', userEmail);
    }

    localStorage.setItem('login_method', 'google');
    localStorage.removeItem('google_avatar');

    useAuthStore.setState({
      accessToken: res.access_token || localStorage.getItem('access_token'),
      refreshToken: res.refresh_token || localStorage.getItem('refresh_token'),
      isAuthenticated: true
    });

    showToastStore('Google Sign-In successful!');

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
    if (payload.date_of_birth && !isAtLeast18YearsOld(payload.date_of_birth)) {
      throw new Error('You must be 18 years or older to proceed.');
    }
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
    localStorage.removeItem('has_registered');
    localStorage.removeItem('last_registered_phone');
    localStorage.removeItem('last_registered_email');
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
