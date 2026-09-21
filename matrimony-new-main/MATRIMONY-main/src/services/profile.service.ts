

import { axiosClient } from '../api/axiosClient';
import type {
  ProfileOutAPI,
  ProfileCreateRequest,
  ProfileUpdateRequest,
  BasicProfileUpdateRequest,
  ProfileVideoAPI,
  ProfileVideoUploadResponse,
  ProfileVideoDeleteResponse,
  IncomeRangeItem,
  EducationItem,
  ProfessionItem,
  ReligionItem,
  CasteItem,
  LanguageItem,
  HobbyItem,
  CountryItem,
  StateItem,
  DistrictItem,
  MandalItem,
  VillageItem,
  ProfileGalleryImage,
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

function toNullableNum(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
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

  const clean: any = {
    profile_name: str(payload.profile_name || payload.name, ''),
    about_me: str(payload.about_me, ''),
    height: parseHeightValue(payload.height),
    weight: parseWeightValue(payload.weight),
    complexion: str(payload.complexion, 'Fair'),
    highest_education: str(payload.highest_education, ''),
    education_id: toNullableNum(payload.education_id),
    education_detail: str(payload.education_detail, ''),
    occupation: str(payload.occupation, ''),
    profession_id: toNullableNum(payload.profession_id),
    job_title: str(payload.job_title, ''),
    employment_type: str(payload.employment_type, ''),
    company_name: str(payload.company_name, ''),
    work_location: str(payload.work_location, ''),
    annual_income: parseIncomeValue(payload.annual_income),
    annual_income_id: toNullableNum(payload.annual_income_id),
    religion: str(payload.religion, ''),
    religion_id: toNullableNum(payload.religion_id),
    caste: str(payload.caste, ''),
    caste_id: toNullableNum(payload.caste_id),
    sub_caste: str(payload.sub_caste, ''),
    gothram: str(payload.gothram, ''),
    rashi: str(payload.rashi, ''),
    nakshatra: str(payload.nakshatra, ''),
    dosha: str(payload.dosha, ''),
    birth_place: str(payload.birth_place || payload.birthPlace || payload.place_of_birth, ''),
    birth_time: str(payload.birth_time || payload.birthTime || payload.time_of_birth, '') || null,

    // Family Details
    family_type: str(payload.family_type || payload.familyType, ''),
    family_status: str(payload.family_status || payload.familyStatus, ''),
    family_values: str(payload.family_values || payload.familyValues, ''),
    father_occupation: str(payload.father_occupation || payload.fatherOccupation || payload.father_profession, ''),
    mother_occupation: str(payload.mother_occupation || payload.motherOccupation || payload.mother_profession, ''),
    brothers_count: toNullableNum(payload.brothers_count ?? payload.brothersCount) ?? 0,
    brothers_married_count: toNullableNum(payload.brothers_married_count ?? payload.brothersMarriedCount) ?? 0,
    sisters_count: toNullableNum(payload.sisters_count ?? payload.sistersCount) ?? 0,
    sisters_married_count: toNullableNum(payload.sisters_married_count ?? payload.sistersMarriedCount) ?? 0,
    living_with_parents: payload.living_with_parents !== undefined ? Boolean(payload.living_with_parents) : true,
    family_location: str(payload.family_location || payload.familyLocation, ''),
    family_information: str(payload.family_information || payload.familyInformation || payload.family_info, ''),

    diet: sanitizeChoice(payload.diet, ['Vegetarian', 'Non-Vegetarian', 'Eggetarian'], 'Vegetarian'),
    smoking: sanitizeChoice(payload.smoking, ['No', 'Occasionally', 'Yes'], 'No'),
    drinking: sanitizeChoice(payload.drinking, ['No', 'Occasionally', 'Yes'], 'No'),
    languages_known: Array.isArray(payload.languages_known) ? payload.languages_known.join(', ') : str(payload.languages_known, ''),
    language_ids: Array.isArray(payload.language_ids) ? payload.language_ids.map(Number).filter(n => !isNaN(n)) : undefined,
    hobbies_interests: Array.isArray(payload.hobbies_interests) ? payload.hobbies_interests.join(', ') : str(payload.hobbies_interests, ''),
    hobby_ids: Array.isArray(payload.hobby_ids) ? payload.hobby_ids.map(Number).filter(n => !isNaN(n)) : undefined,
    marital_status: sanitizeChoice(payload.marital_status, ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'], 'Never Married'),

    // Children & Disability
    children_count: toNullableNum(payload.children_count ?? payload.childrenCount) ?? 0,
    children_living_status: str(payload.children_living_status || payload.childrenLivingStatus || payload.living_status, ''),
    physical_status: str(payload.physical_status || payload.physicalStatus, 'Normal'),
    physical_disability: str(
      payload.physical_disability || payload.physicalDisability,
      (payload.physical_status === 'Physically Challenged' || payload.physical_status === 'Yes') ? 'YES' : 'NO'
    ),
    disability_information: str(payload.disability_information || payload.disabilityInformation || payload.disability_info, ''),
    disability_info: str(payload.disability_information || payload.disabilityInformation || payload.disability_info, ''),

    country: str(payload.country, ''),
    country_id: toNullableNum(payload.country_id),
    state: str(payload.state, ''),
    state_id: toNullableNum(payload.state_id),
    district_id: toNullableNum(payload.district_id),
    city: str(payload.city, ''),
    mandal_id: toNullableNum(payload.mandal_id),
    village_id: toNullableNum(payload.village_id),
    pincode: str(payload.pincode, ''),
    address_line: str(payload.address_line, '')
  };

  if (payload.profile_photo) {
    clean.profile_photo = payload.profile_photo;
  }
  if (payload.video_introduction) {
    clean.video_introduction = payload.video_introduction;
  }
  if (payload.video_url) {
    clean.video_url = payload.video_url;
  }
  if (payload.video_type) {
    clean.video_type = payload.video_type;
  }

  return clean;
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
    if (local) {
      try { return JSON.parse(local); } catch {}
    }
    const draft = localStorage.getItem('user_profile_draft');
    if (draft) {
      try { return JSON.parse(draft); } catch {}
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
    if (!userId) return null;
    const rawStr = String(userId).trim();
    if (!rawStr) return null;

    const numericId = Number(rawStr);
    const isNumeric = !isNaN(numericId) && numericId > 0;

    const candidateUrls: string[] = [
      `/profile/${rawStr}/`,
      `/profile/${rawStr}`,
      `/profile/by-member-id/${rawStr}/`,
      `/profile/by-member-id/${rawStr}`,
      `/search/profile-id-search?identifier=${rawStr}`
    ];

    if (isNumeric) {
      const kmId = `KM${String(numericId).padStart(6, '0')}`;
      const mnId = `MN${numericId}`;
      candidateUrls.push(
        `/profile/by-member-id/${kmId}/`,
        `/profile/by-member-id/${kmId}`,
        `/profile/by-member-id/${mnId}/`,
        `/profile/by-member-id/${numericId}/`,
        `/search/profile-id-search?identifier=${kmId}`,
        `/search/profile-id-search?identifier=${mnId}`,
        `/profile/user/${numericId}/`,
        `/profile/user/${numericId}`,
        `/profile/get/${numericId}/`,
        `/profile/get/${numericId}`
      );
    }

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.get<any>(url);
        if (res.status === 403) {
          const resData = res.data || {};
          const customError: any = new Error(
            resData.message || resData.detail || 'Profile Locked. You have used all your matching profile credits. Take a membership to view more profiles.'
          );
          customError.status = 403;
          customError.lock_reason = resData.lock_reason || 'NO_PROFILE_CREDITS';
          throw customError;
        }
        if (res.status >= 200 && res.status < 300 && res.data) {
          const profileData = res.data.data || res.data.profile || res.data;
          if (res.data.user && typeof res.data.user === 'object') {
            return { ...res.data.user, ...profileData };
          }
          return profileData;
        }
      } catch (err: any) {
        if (err.status === 403 || err.response?.status === 403) {
          throw err;
        }
        continue;
      }
    }

    return null;
  },

  /**
   * GET /api/profile/{profileId}/
   * Dynamic profile lookup by profile ID
   */
  async getProfileById(profileId: string | number): Promise<ProfileOutAPI | null> {
    return this.getProfileByUserId(profileId);
  },

  /**
   * GET /api/profile/by-member-id/{member_id}/
   * Dynamic profile lookup by Member ID
   */
  async getProfileByMemberId(memberId: string | number): Promise<ProfileOutAPI | null> {
    if (!memberId) return null;
    const candidateUrls = [
      `/profile/by-member-id/${memberId}/`,
      `/profile/by-member-id/${memberId}`
    ];
    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.get<any>(url);
        if (res.status >= 200 && res.status < 300 && res.data) {
          return res.data.data || res.data;
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          throw err;
        }
        continue;
      }
    }
    return null;
  },

  // ──────────────────────────────────────────────────────────────
  // Master Data Methods
  // ──────────────────────────────────────────────────────────────

  /** GET /api/profile/income-ranges */
  async getIncomeRanges(): Promise<IncomeRangeItem[]> {
    try {
      const res = await axiosClient.get<IncomeRangeItem[]>('/profile/income-ranges');
      if (res.status === 200 && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[profileService] getIncomeRanges error:', err);
    }
    return [];
  },

  /** GET /api/profile/educations */
  async getEducations(): Promise<EducationItem[]> {
    try {
      const res = await axiosClient.get<EducationItem[]>('/profile/educations');
      if (res.status === 200 && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[profileService] getEducations error:', err);
    }
    return [];
  },

  /** GET /api/profile/professions */
  async getProfessions(): Promise<ProfessionItem[]> {
    try {
      const res = await axiosClient.get<ProfessionItem[]>('/profile/professions');
      if (res.status === 200 && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[profileService] getProfessions error:', err);
    }
    return [];
  },

  /** GET /api/profile/religions */
  async getReligions(): Promise<ReligionItem[]> {
    try {
      const res = await axiosClient.get<ReligionItem[]>('/profile/religions');
      if (res.status === 200 && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[profileService] getReligions error:', err);
    }
    return [];
  },

  /** GET /api/profile/religions/{religionId}/castes */
  async getCastes(religionId: number | string): Promise<CasteItem[]> {
    if (!religionId) return [];
    try {
      const res = await axiosClient.get<CasteItem[]>(`/profile/religions/${religionId}/castes`);
      if (res.status === 200 && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {
      // Fallback endpoint
      try {
        const fallbackRes = await axiosClient.get<CasteItem[]>(`/profile/castes?religion_id=${religionId}`);
        if (fallbackRes.status === 200 && Array.isArray(fallbackRes.data)) {
          return fallbackRes.data;
        }
      } catch (e) {
        console.warn('[profileService] getCastes fallback error:', e);
      }
    }
    return [];
  },

  /** GET /api/profile/languages */
  async getLanguages(): Promise<LanguageItem[]> {
    try {
      const res = await axiosClient.get<LanguageItem[]>('/profile/languages');
      if (res.status === 200 && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[profileService] getLanguages error:', err);
    }
    return [];
  },

  /** GET /api/profile/hobbies */
  async getHobbies(): Promise<HobbyItem[]> {
    try {
      const res = await axiosClient.get<HobbyItem[]>('/profile/hobbies');
      if (res.status === 200 && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[profileService] getHobbies error:', err);
    }
    return [];
  },

  /** GET /api/profile/countries */
  async getCountries(search?: string): Promise<CountryItem[]> {
    try {
      const config: any = {};
      if (search && search.trim()) {
        config.params = { search: search.trim() };
      }
      const res = await axiosClient.get<CountryItem[]>('/profile/countries', config);
      if (res.status === 200 && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[profileService] getCountries error:', err);
    }
    return [];
  },

  /** GET /api/profile/states?country_id={countryId} */
  async getStates(countryId: number | string, search?: string): Promise<StateItem[]> {
    if (!countryId) return [];
    try {
      const params: any = { country_id: countryId };
      if (search && search.trim()) params.search = search.trim();
      const res = await axiosClient.get<StateItem[]>('/profile/states', { params });
      if (res.status === 200 && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[profileService] getStates error:', err);
    }
    return [];
  },

  /** GET /api/profile/districts?state_id={stateId} */
  async getDistricts(stateId: number | string, search?: string): Promise<DistrictItem[]> {
    if (!stateId) return [];
    try {
      const params: any = { state_id: stateId };
      if (search && search.trim()) params.search = search.trim();
      const res = await axiosClient.get<DistrictItem[]>('/profile/districts', { params });
      if (res.status === 200 && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[profileService] getDistricts error:', err);
    }
    return [];
  },

  /** GET /api/profile/mandals?district_id={districtId} */
  async getMandals(districtId: number | string, search?: string): Promise<MandalItem[]> {
    if (!districtId) return [];
    try {
      const params: any = { district_id: districtId };
      if (search && search.trim()) params.search = search.trim();
      const res = await axiosClient.get<MandalItem[]>('/profile/mandals', { params });
      if (res.status === 200 && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[profileService] getMandals error:', err);
    }
    return [];
  },

  /** GET /api/profile/villages?mandal_id={mandalId} */
  async getVillages(mandalId: number | string, search?: string): Promise<VillageItem[]> {
    if (!mandalId) return [];
    try {
      const params: any = { mandal_id: mandalId };
      if (search && search.trim()) params.search = search.trim();
      const res = await axiosClient.get<VillageItem[]>('/profile/villages', { params });
      if (res.status === 200 && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[profileService] getVillages error:', err);
    }
    return [];
  },

  // ──────────────────────────────────────────────────────────────
  // Media & Gallery Methods
  // ──────────────────────────────────────────────────────────────

  /**
   * POST /api/upload/profile/photo
   * Upload profile photo with multipart/form-data.
   */
  async uploadProfilePhoto(file: File | Blob): Promise<{ photo_url?: string; message?: string }> {
    const formData = new FormData();
    const filename = file instanceof File ? file.name : 'profile_photo.jpg';
    formData.append('photo', file, filename);

    const res = await axiosClient.postForm<any>('/upload/profile/photo', formData);
    if (res.status === 200 || res.status === 201) {
      const photoUrl = res.data?.photo_url || res.data?.photo || res.data?.profile_photo || res.data?.url || res.data?.data?.profile_photo;
      return {
        photo_url: photoUrl,
        message: res.data?.message || 'Profile photo uploaded successfully!'
      };
    }

    throw new ProfileServiceError(
      extractErrorMessage(res.data, `Failed to upload profile photo (${res.status})`),
      res.status
    );
  },

  /** GET /api/profile/gallery */
  async getGallery(): Promise<ProfileGalleryImage[]> {
    try {
      const res = await axiosClient.get<ProfileGalleryImage[]>('/profile/gallery');
      if (res.status === 200 && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[profileService] getGallery error:', err);
    }
    return [];
  },

  /** GET /api/profile/gallery/{image_id} */
  async getGalleryImage(imageId: number): Promise<ProfileGalleryImage | null> {
    try {
      const res = await axiosClient.get<ProfileGalleryImage>(`/profile/gallery/${imageId}`);
      if (res.status === 200 && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('[profileService] getGalleryImage error:', err);
    }
    return null;
  },

  /**
   * POST /api/upload/profile/gallery?caption=...
   * Upload an image to profile gallery.
   */
  async uploadGalleryImage(file: File | Blob, caption?: string): Promise<ProfileGalleryImage> {
    const formData = new FormData();
    const filename = file instanceof File ? file.name : 'gallery_image.jpg';
    formData.append('image', file, filename);

    const config: any = {};
    if (caption) {
      config.params = { caption };
    }

    const res = await axiosClient.postForm<any>('/upload/profile/gallery', formData, config);
    if (res.status === 200 || res.status === 201) {
      return res.data?.data || res.data;
    }

    throw new ProfileServiceError(
      extractErrorMessage(res.data, `Failed to upload gallery image (${res.status})`),
      res.status
    );
  },

  /** DELETE /api/profile/gallery/{image_id} */
  async deleteGalleryImage(imageId: number): Promise<{ success: boolean; message?: string }> {
    const res = await axiosClient.delete<any>(`/profile/gallery/${imageId}`);
    if (res.status === 200 || res.status === 204) {
      return {
        success: true,
        message: res.data?.message || 'Gallery image deleted successfully'
      };
    }
    throw new ProfileServiceError(
      extractErrorMessage(res.data, `Failed to delete gallery image (${res.status})`),
      res.status
    );
  },

  /** POST /api/link/profile/video */
  async linkProfileVideo(videoUrl: string, videoType = 'EXTERNAL'): Promise<{ success: boolean; message?: string; video_url?: string }> {
    const res = await axiosClient.post<any>('/link/profile/video', {
      video_url: videoUrl,
      video_type: videoType
    });
    if (res.status === 200 || res.status === 201) {
      return {
        success: true,
        video_url: res.data?.video_url || videoUrl,
        message: res.data?.message || 'Video linked successfully!'
      };
    }
    throw new ProfileServiceError(
      extractErrorMessage(res.data, `Failed to link video (${res.status})`),
      res.status
    );
  }
};
