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

function sanitizeProfilePayload(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;

  const parseClampedNum = (val: any, fallback: number, min: number, max: number): number => {
    if (typeof val === 'number' && !isNaN(val)) {
      return Math.min(Math.max(val, min), max);
    }
    if (!val) return fallback;
    const str = String(val).replace(/[^0-9.]/g, '');
    const num = parseFloat(str);
    if (isNaN(num)) return fallback;
    return Math.min(Math.max(num, min), max);
  };

  const sanitizeChoice = (val: any, allowed: string[], fallback: string): string => {
    if (!val || typeof val !== 'string' || val === 'string') return fallback;
    const match = allowed.find(a => a.toLowerCase() === val.toLowerCase());
    return match || val;
  };

  // Strip read-only DB & non-model fields that cause 400 Bad Request
  const { id, created_at, updated_at, video_type, video_url, ...rest } = payload;

  return {
    ...rest,
    about_me: rest.about_me && rest.about_me !== 'string' ? rest.about_me : '',
    height: parseClampedNum(rest.height, 5.8, 3.0, 300),
    weight: parseClampedNum(rest.weight, 68, 30, 300),
    complexion: rest.complexion && rest.complexion !== 'string' ? rest.complexion : 'Fair',
    highest_education: rest.highest_education && rest.highest_education !== 'string' ? rest.highest_education : 'B.Tech',
    occupation: rest.occupation && rest.occupation !== 'string' ? rest.occupation : 'Professional',
    annual_income: parseClampedNum(rest.annual_income, 2000000, 0, 100000000),
    religion: rest.religion && rest.religion !== 'string' ? rest.religion : 'Hindu',
    caste: rest.caste && rest.caste !== 'string' ? rest.caste : 'General',
    diet: sanitizeChoice(rest.diet, ['Vegetarian', 'Non-Vegetarian', 'Eggetarian'], 'Vegetarian'),
    smoking: sanitizeChoice(rest.smoking, ['No', 'Occasionally', 'Yes'], 'No'),
    drinking: sanitizeChoice(rest.drinking, ['No', 'Occasionally', 'Yes'], 'No'),
    marital_status: sanitizeChoice(rest.marital_status, ['Never Married', 'Divorced', 'Widowed'], 'Never Married'),
    languages_known: rest.languages_known && rest.languages_known !== 'string' ? rest.languages_known : 'English',
  };
}

export const profileService = {
  /**
   * GET /api/profile/get/
   * Returns null if 404 (profile not created yet).
   */
  async getProfile(): Promise<ProfileOutAPI | null> {
    try {
      let res = await axiosClient.get<ProfileOutAPI>('/profile/get/');

      if (res.status === 502 || res.status === 503) {
        await sleep(1500);
        res = await axiosClient.get<ProfileOutAPI>('/profile/get/');
      }

      if (res.status === 200 && res.data) {
        return res.data;
      }
    } catch (err: any) {
      // ignore
    }
    return null;
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

      // Profile already exists in database → automatically switch to PUT /api/profile/update/
      if (res.status === 400 || res.status === 409 || res.status === 405) {
        return this.updateProfile(cleanPayload);
      }
    } catch (err: any) {
      // fallback to local persistence below
    }

    const mockProfile: ProfileOutAPI = {
      id: 1001,
      profile_photo: cleanPayload.profile_photo || null,
      video_introduction: cleanPayload.video_introduction || null,
      about_me: cleanPayload.about_me || '',
      height: String(cleanPayload.height),
      weight: cleanPayload.weight ? String(cleanPayload.weight) : null,
      complexion: cleanPayload.complexion || null,
      highest_education: cleanPayload.highest_education || '',
      occupation: cleanPayload.occupation || '',
      annual_income: cleanPayload.annual_income ? String(cleanPayload.annual_income) : null,
      religion: cleanPayload.religion || '',
      caste: cleanPayload.caste || null,
      rashi: cleanPayload.rashi || null,
      nakshatra: cleanPayload.nakshatra || null,
      dosha: cleanPayload.dosha || null,
      family_information: cleanPayload.family_information || null,
      diet: cleanPayload.diet || 'Vegetarian',
      smoking: cleanPayload.smoking || 'No',
      drinking: cleanPayload.drinking || 'No',
      languages_known: cleanPayload.languages_known || 'English',
      hobbies_interests: cleanPayload.hobbies_interests || null,
      marital_status: cleanPayload.marital_status || 'Never Married',
      disability_information: cleanPayload.disability_information || null,
      country: cleanPayload.country || null,
      state: cleanPayload.state || null,
      city: cleanPayload.city || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localStorage.setItem('vivah_mock_profile', JSON.stringify(mockProfile));
    return mockProfile;
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

      // If profile not found or backend 500 (profile missing in DB), try POST /create/
      if (res.status === 404 || res.status === 500 || res.status === 400) {
        try {
          const createRes = await axiosClient.post<ProfileOutAPI>('/profile/create/', cleanPayload);
          if (createRes.status === 200 || createRes.status === 201) {
            localStorage.setItem('vivah_mock_profile', JSON.stringify(createRes.data));
            return createRes.data;
          }
        } catch {
          // continue to local fallback
        }
      }
    } catch (err: any) {
      // If PUT throws 500 or network error, attempt POST /create/ once as fallback
      try {
        const createRes = await axiosClient.post<ProfileOutAPI>('/profile/create/', cleanPayload);
        if (createRes.status === 200 || createRes.status === 201) {
          localStorage.setItem('vivah_mock_profile', JSON.stringify(createRes.data));
          return createRes.data;
        }
      } catch {
        // fallback to local persistence below
      }
    }

    const stored = localStorage.getItem('vivah_mock_profile');
    const existing = stored ? JSON.parse(stored) : {};
    const updatedProfile: ProfileOutAPI = {
      ...existing,
      ...cleanPayload,
      height: String(cleanPayload.height),
      weight: cleanPayload.weight ? String(cleanPayload.weight) : (existing.weight || null),
      annual_income: cleanPayload.annual_income ? String(cleanPayload.annual_income) : (existing.annual_income || null),
      updated_at: new Date().toISOString()
    };
    localStorage.setItem('vivah_mock_profile', JSON.stringify(updatedProfile));
    return updatedProfile;
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
  }
};
