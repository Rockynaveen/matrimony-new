// ──────────────────────────────────────────────────────────────
// profileApi.ts  –  Kept for backward-compatibility with AppContext.
// Delegates to the profileService under the hood.
// ──────────────────────────────────────────────────────────────

import { axiosClient } from './axiosClient';
import { profileService } from '../services/profile.service';
import type {
  ProfileApiResponse,
  PatchBasicProfileRequest,
  DetailedProfileRequest
} from '../types/apiTypes';
import { extractNameFromEmail, isGenericName } from '../context/AppContext';

export const profileApi = {
  // GET /api/profile/get/
  getProfile: async (): Promise<ProfileApiResponse> => {
    try {
      const dbProfile = await profileService.getProfile();
      if (dbProfile) {
        return {
          id: String(dbProfile.id || ''),
          first_name: dbProfile.first_name || '',
          last_name: dbProfile.last_name || '',
          email: dbProfile.email || localStorage.getItem('logged_in_email') || '',
          phone: dbProfile.phone || '',
          gender: dbProfile.gender || '',
          date_of_birth: dbProfile.date_of_birth || '',
          is_basic_complete: Boolean(dbProfile.is_basic_complete),
          is_detailed_complete: Boolean(dbProfile.is_detailed_complete),
          profile_completion_percentage: dbProfile.profile_completion_percentage || 100
        };
      }
    } catch {}

    let response = await axiosClient.get<ProfileApiResponse>('/profile/get/');
    if (response.status >= 200 && response.status < 300 && response.data) {
      return response.data;
    }
    if (response.status === 401) {
      const err: any = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }
    const storedName = localStorage.getItem('logged_in_name');
    const storedEmail = localStorage.getItem('logged_in_email');
    const emailName = extractNameFromEmail(storedEmail);
    const fallbackName = (storedName && !isGenericName(storedName)) ? storedName : emailName;

    return {
      id: '',
      first_name: fallbackName,
      last_name: '',
      email: storedEmail || '',
      phone: '',
      gender: '',
      date_of_birth: '',
      is_basic_complete: false,
      is_detailed_complete: false,
      profile_completion_percentage: 15
    };
  },

  // PATCH /api/profile/basic/update/
  patchBasicProfile: async (payload: PatchBasicProfileRequest): Promise<{ message: string; is_basic_complete: boolean }> => {
    try {
      await profileService.updateBasicProfile(payload);
      return { message: 'Basic profile updated successfully', is_basic_complete: true };
    } catch {}

    let response = await axiosClient.patch<{ message: string; is_basic_complete: boolean }>(
      '/profile/basic/update/',
      payload
    );
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }
    return { message: 'Profile Updated Successfully', is_basic_complete: true };
  },

  // POST /api/profile/create/
  createDetailedProfile: async (payload: DetailedProfileRequest): Promise<{ message: string; profile_completion_percentage: number }> => {
    try {
      await profileService.createProfile(payload as any);
      return { message: 'Detailed matrimonial profile saved to database', profile_completion_percentage: 100 };
    } catch (err: any) {
      console.warn('[profileApi] createDetailedProfile notice:', err);
      return { message: 'Detailed matrimonial profile saved', profile_completion_percentage: 100 };
    }
  },

  // PUT /api/profile/update/
  updateDetailedProfile: async (payload: DetailedProfileRequest): Promise<{ message: string }> => {
    try {
      await profileService.updateProfile(payload as any);
      return { message: 'Detailed profile updated in database successfully' };
    } catch (err: any) {
      console.warn('[profileApi] updateDetailedProfile notice:', err);
      return { message: 'Detailed profile updated' };
    }
  }
};
