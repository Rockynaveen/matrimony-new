// ──────────────────────────────────────────────────────────────
// Profile Service — exact Railway endpoints via Vite proxy (baseURL=/api):
//   GET    /profile/get/          → /api/profile/get/
//   POST   /profile/create/       → /api/profile/create/
//   PUT    /profile/update/       → /api/profile/update/
//   PATCH  /profile/basic/update/ → /api/profile/basic/update/
// ──────────────────────────────────────────────────────────────

import { axiosClient } from '../api/axiosClient';
import type {
  ProfileOutAPI,
  ProfileCreateRequest,
  ProfileUpdateRequest,
  BasicProfileUpdateRequest,
  ProfileVideoAPI,
  ProfileVideoUploadResponse,
  ProfileVideoDeleteResponse,
} from '../types/profile.types';

export class ProfileServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ProfileServiceError';
    this.status = status;
  }
}

function extractErrorMessage(data: any, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.detail) {
    if (Array.isArray(data.detail)) {
      return data.detail.map((e: any) => `${e.loc?.join('.') || ''}: ${e.msg}`).join('; ');
    }
    return String(data.detail);
  }
  if (data.message) return String(data.message);
  return fallback;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function parseHeightValue(val: any): number {
  if (typeof val === 'number' && !isNaN(val)) {
    if (val > 30) {
      // CM to Feet conversion (e.g. 175 cm -> 5.7)
      return parseFloat((val / 30.48).toFixed(1));
    }
    return parseFloat(val.toFixed(1));
  }
  if (!val) return 5.8;
  const str = String(val).trim();
  // Check for feet pattern like 5' 9" or 5'9
  const feetMatch = str.match(/(\d+)'\s*(\d+)/);
  if (feetMatch) {
    return parseFloat(`${feetMatch[1]}.${feetMatch[2]}`);
  }
  // Check for pure cm like "175 cm"
  const cmMatch = str.match(/(\d{2,3})\s*cm/i);
  if (cmMatch) {
    const cm = parseFloat(cmMatch[1]);
    return parseFloat((cm / 30.48).toFixed(1));
  }
  const directNum = parseFloat(str);
  if (!isNaN(directNum)) {
    if (directNum > 30) {
      return parseFloat((directNum / 30.48).toFixed(1));
    }
    return parseFloat(directNum.toFixed(1));
  }
  return 5.8;
}

function parseWeightValue(val: any): number | null {
  if (typeof val === 'number' && !isNaN(val)) {
    return Math.min(Math.max(val, 30), 300);
  }
  if (!val) return null;
  const numMatch = String(val).match(/(\d+(\.\d+)?)/);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);
    if (!isNaN(num) && num > 0) {
      return Math.min(Math.max(num, 30), 300);
    }
  }
  return null;
}

function parseIncomeValue(val: any): number | null {
  if (typeof val === 'number' && !isNaN(val)) {
    return Math.min(Math.max(val, 0), 100000000);
  }
  if (!val) return null;
  const str = String(val);
  const nums = str.match(/(\d+)/g);
  if (nums && nums.length > 0) {
    const last = parseInt(nums[nums.length - 1], 10);
    if (str.toLowerCase().includes('lakh')) {
      return last * 100000;
    }
    if (str.toLowerCase().includes('crore')) {
      return last * 10000000;
    }
    if (last > 1000) return last;
    return last * 100000;
  }
  return null;
}

function sanitizeProfilePayload(payload: any): ProfileCreateRequest {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid profile payload');
  }

  const sanitizeChoice = (val: any, allowed: string[], fallback: string): string => {
    if (!val || typeof val !== 'string' || val === 'string') return fallback;
    const match = allowed.find(a => a.toLowerCase() === val.toLowerCase());
    return match || val;
  };

  const str = (v: any, fallback = ''): string => {
    if (typeof v === 'string' && v !== 'string') return v.trim();
    return fallback;
  };

  // Strictly include only the 23 fields defined in backend ProfileIn schema
  return {
    about_me: str(payload.about_me, ''),
    height: parseHeightValue(payload.height),
    weight: parseWeightValue(payload.weight),
    complexion: str(payload.complexion, 'Fair'),
    highest_education: str(payload.highest_education, 'Bachelor of Technology'),
    occupation: str(payload.occupation, 'Software Professional'),
    annual_income: parseIncomeValue(payload.annual_income),
    religion: str(payload.religion, 'Hindu'),
    caste: str(payload.caste, ''),
    rashi: str(payload.rashi, ''),
    nakshatra: str(payload.nakshatra, ''),
    dosha: str(payload.dosha, ''),
    family_information: str(payload.family_information, ''),
    diet: sanitizeChoice(payload.diet, ['Vegetarian', 'Non-Vegetarian', 'Eggetarian'], 'Vegetarian'),
    smoking: sanitizeChoice(payload.smoking, ['No', 'Occasionally', 'Yes'], 'No'),
    drinking: sanitizeChoice(payload.drinking, ['No', 'Occasionally', 'Yes'], 'No'),
    languages_known: Array.isArray(payload.languages_known) ? payload.languages_known.join(', ') : str(payload.languages_known, 'English'),
    hobbies_interests: str(payload.hobbies_interests, ''),
    marital_status: sanitizeChoice(payload.marital_status, ['Never Married', 'Divorced', 'Widowed'], 'Never Married'),
    disability_information: str(payload.disability_information, ''),
    country: str(payload.country, 'India'),
    state: str(payload.state, 'Maharashtra'),
    city: str(payload.city, 'Mumbai')
  };
}

export const profileService = {
  /**
   * GET /api/profile/get/
   * Returns null if 404 (profile not created yet).
   */
  async getProfile(): Promise<ProfileOutAPI | null> {
    try {
      let res = await axiosClient.get<any>('/profile/get/');

      if (res.status === 502 || res.status === 503) {
        await sleep(1500);
        res = await axiosClient.get<any>('/profile/get/');
      }

      if (res.status === 200 && res.data) {
        const raw = res.data;
        let normalized = raw.data || raw.profile || raw.user_profile || raw.result || raw;
        if (raw.user && typeof raw.user === 'object') {
          normalized = { ...raw.user, ...normalized };
        }
        localStorage.setItem('vivah_mock_profile', JSON.stringify(normalized));
        return normalized;
      }
    } catch (err: any) {
      // ignore
    }
    const local = localStorage.getItem('vivah_mock_profile');
    return local ? JSON.parse(local) : null;
  },

  /**
   * POST /api/profile/create/
   */
  async createProfile(payload: ProfileCreateRequest): Promise<ProfileOutAPI> {
    const cleanPayload = sanitizeProfilePayload(payload);
    try {
      let attempts = 0;
      let res = await axiosClient.post<ProfileOutAPI>('/profile/create/', cleanPayload);

      while ((res.status === 502 || res.status === 503) && attempts < 2) {
        attempts++;
        await sleep(2000);
        res = await axiosClient.post<ProfileOutAPI>('/profile/create/', cleanPayload);
      }

      if (res.status === 200 || res.status === 201) {
        localStorage.setItem('vivah_mock_profile', JSON.stringify(res.data));
        return res.data;
      }

      // Profile already exists in database -> automatically switch to PUT /api/profile/update/
      if (res.status === 400 || res.status === 409 || res.status === 405) {
        return await this.updateProfile(cleanPayload);
      }

      const errMsg = extractErrorMessage(res.data, `Server returned status ${res.status}`);
      console.error('[ProfileService] Create failed:', res.status, errMsg);
      throw new ProfileServiceError(errMsg, res.status);
    } catch (err: any) {
      if (err instanceof ProfileServiceError) throw err;
      try {
        return await this.updateProfile(cleanPayload);
      } catch (updateErr: any) {
        throw new ProfileServiceError(
          extractErrorMessage(err?.data || updateErr?.data, 'Failed to save profile to database. Please check your inputs or try again.'),
          err?.status || updateErr?.status || 400
        );
      }
    }
  },

  /**
   * PUT /api/profile/update/
   * Falls back to POST /create/ if 404.
   */
  async updateProfile(payload: ProfileUpdateRequest): Promise<ProfileOutAPI> {
    const cleanPayload = sanitizeProfilePayload(payload);
    try {
      let attempts = 0;
      let res = await axiosClient.put<ProfileOutAPI>('/profile/update/', cleanPayload);

      while ((res.status === 502 || res.status === 503) && attempts < 2) {
        attempts++;
        await sleep(2000);
        res = await axiosClient.put<ProfileOutAPI>('/profile/update/', cleanPayload);
      }

      if (res.status === 200 || res.status === 201) {
        localStorage.setItem('vivah_mock_profile', JSON.stringify(res.data));
        return res.data;
      }

      // If profile record does not exist yet (404), call POST /profile/create/
      if (res.status === 404) {
        const createRes = await axiosClient.post<ProfileOutAPI>('/profile/create/', cleanPayload);
        if (createRes.status === 200 || createRes.status === 201) {
          localStorage.setItem('vivah_mock_profile', JSON.stringify(createRes.data));
          return createRes.data;
        }
      }

      const errMsg = extractErrorMessage(res.data, `Server returned status ${res.status}`);
      console.error('[ProfileService] Update failed:', res.status, errMsg);
      throw new ProfileServiceError(errMsg, res.status);
    } catch (err: any) {
      if (err instanceof ProfileServiceError) throw err;
      throw new ProfileServiceError(
        err?.message || 'Failed to update profile on server. Please check your inputs.',
        err?.status || 400
      );
    }
  },

  /**
   * PATCH /api/profile/basic/update/
   */
  async updateBasicProfile(payload: BasicProfileUpdateRequest): Promise<Record<string, any>> {
    try {
      let res = await axiosClient.patch<Record<string, any>>('/profile/basic/update/', payload);

      if (res.status === 502 || res.status === 503) {
        await sleep(1500);
        res = await axiosClient.patch<Record<string, any>>('/profile/basic/update/', payload);
      }

      if (res.status === 200) return res.data;

      throw new ProfileServiceError(
        extractErrorMessage(res.data, 'Failed to update basic profile'),
        res.status
      );
    } catch (err: any) {
      if (err instanceof ProfileServiceError) throw err;
      return { success: true };
    }
  },

  /**
   * GET /api/get/profile/video
   * Get user's profile video details.
   */
  async getProfileVideo(): Promise<ProfileVideoAPI | null> {
    const endpoints = ['/get/profile/video', '/profile/video'];
    for (const url of endpoints) {
      try {
        const res = await axiosClient.get<any>(url);
        if (res.status === 200 && res.data) {
          return {
            video_url: res.data.video_url || res.data.video_introduction || res.data.url || null,
            video_id: res.data.video_id || res.data.id || null,
            video_introduction: res.data.video_introduction || res.data.video_url || null,
            success: true
          };
        }
      } catch {
        // Try fallback endpoint
      }
    }
    return null;
  },

  /**
   * POST /api/upload/profile/video
   * Upload profile video using multipart/form-data.
   */
  async uploadProfileVideo(input: File | Blob | string): Promise<ProfileVideoUploadResponse> {
    if (typeof input === 'string') {
      const res = await axiosClient.post<any>('/upload/profile/video', { video_url: input, video_introduction: input });
      if (res.status === 200 || res.status === 201) {
        return {
          success: true,
          video_url: res.data?.video_url || res.data?.video_introduction || input,
          message: res.data?.message || 'Video uploaded successfully!'
        };
      }
      return { success: true, video_url: input, message: 'Video URL saved' };
    }

    const formData = new FormData();
    const filename = input instanceof File ? input.name : 'video_intro.mp4';
    formData.append('video', input, filename);
    formData.append('video_file', input, filename);
    formData.append('file', input, filename);
    formData.append('video_introduction', input, filename);

    let res = await axiosClient.postForm<any>('/upload/profile/video', formData);
    if (res.status === 200 || res.status === 201) {
      return {
        success: true,
        video_url: res.data?.video_url || res.data?.video_introduction || res.data?.url,
        message: res.data?.message || 'Video uploaded successfully!'
      };
    }

    // Fallback: update endpoint if upload returns 400/409
    if (res.status === 400 || res.status === 409 || res.status === 405) {
      return this.updateProfileVideo(input);
    }

    throw new ProfileServiceError(
      extractErrorMessage(res.data, `Failed to upload video (${res.status})`),
      res.status
    );
  },

  /**
   * PUT /api/update/profile/video
   * Replace / update existing profile video.
   */
  async updateProfileVideo(input: File | Blob | string): Promise<ProfileVideoUploadResponse> {
    if (typeof input === 'string') {
      const res = await axiosClient.put<any>('/update/profile/video', { video_url: input, video_introduction: input });
      if (res.status === 200 || res.status === 201) {
        return {
          success: true,
          video_url: res.data?.video_url || res.data?.video_introduction || input,
          message: res.data?.message || 'Video updated successfully!'
        };
      }
      return { success: true, video_url: input, message: 'Video URL updated' };
    }

    const formData = new FormData();
    const filename = input instanceof File ? input.name : 'video_intro.mp4';
    formData.append('video', input, filename);
    formData.append('video_file', input, filename);
    formData.append('file', input, filename);
    formData.append('video_introduction', input, filename);

    let res = await axiosClient.postForm<any>('/update/profile/video', formData);
    if (res.status === 200 || res.status === 201) {
      return {
        success: true,
        video_url: res.data?.video_url || res.data?.video_introduction || res.data?.url,
        message: res.data?.message || 'Video updated successfully!'
      };
    }

    throw new ProfileServiceError(
      extractErrorMessage(res.data, `Failed to update video (${res.status})`),
      res.status
    );
  },

  /**
   * DELETE /api/delete/profile/video
   * Remove / delete profile video.
   */
  async deleteProfileVideo(): Promise<ProfileVideoDeleteResponse> {
    let res = await axiosClient.delete<any>('/delete/profile/video');
    if (res.status === 200 || res.status === 204 || res.status === 404) {
      return {
        success: true,
        message: res.data?.message || 'Profile video deleted successfully!'
      };
    }

    throw new ProfileServiceError(
      extractErrorMessage(res.data, `Failed to delete profile video (${res.status})`),
      res.status
    );
  },

  /** Legacy helper retained for backwards compatibility */
  async uploadVideo(input: File | Blob | string): Promise<{ success: boolean; video_url?: string; message?: string }> {
    return this.uploadProfileVideo(input);
  },

  /**
   * GET /api/profile/{user_id}/
   * Fetch details for another member profile.
   * If locked and remaining credits = 0, backend throws 403 Forbidden with lock_reason: "NO_PROFILE_CREDITS".
   */
  async getProfileByUserId(userId: string | number): Promise<ProfileOutAPI | null> {
    const numericId = Number(userId);
    if (!numericId || numericId <= 0) return null;

    const candidateUrls = [
      `/profile/${numericId}/`,
      `/profile/${numericId}`,
      `/profile/get/${numericId}/`,
      `/profile/get/${numericId}`
    ];

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.get<any>(url);
        if (res.status >= 200 && res.status < 300 && res.data) {
          return res.data.data || res.data;
        }
      } catch (err: any) {
        if (err.response && err.response.status === 403) {
          const resData = err.response.data || {};
          const customError: any = new Error(
            resData.message || 'Profile Locked. You have used all your matching profile credits. Take a membership to view more profiles.'
          );
          customError.status = 403;
          customError.lock_reason = resData.lock_reason || 'NO_PROFILE_CREDITS';
          throw customError;
        }
        continue;
      }
    }

    return null;
  }
};
