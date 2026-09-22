import { axiosClient } from './axiosClient';
import type { Profile } from '../types';
import type {
  SearchFilterOptions,
  BasicSearchParams,
  AdvancedSearchParams,
  KeywordSearchParams,
  NearbySearchParams,
  AiRecommendedSearchParams,
  SavedSearchItem,
  CreateSavedSearchPayload,
  UpdateSavedSearchPayload,
  RecentlyViewedItem,
  CompatibilityScoreResponse,
  SearchResultsResponse
} from '../types/searchTypes';

const extractDataArray = <T>(data: any): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.profiles)) return data.profiles;
  if (Array.isArray(data.matches)) return data.matches;
  return [];
};

const extractErrorMsg = (data: any, status: number): string => {
  if (!data) return `HTTP error (${status})`;
  if (typeof data === 'string') return data;
  if (data.detail) {
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
    }
  }
  if (data.message) return data.message;
  if (data.error) return data.error;
  return `Request failed with status ${status}`;
};

/**
 * Normalizes backend search result item into standard frontend Profile
 */
export const mapRawToProfile = (raw: any): Profile => {
  if (!raw) {
    return {
      id: '0',
      name: 'Member',
      age: 25,
      gender: 'Female',
      dob: '',
      height: "5'5\"",
      religion: 'Hindu',
      caste: 'General',
      location: 'India',
      city: 'India',
      state: '',
      education: 'Graduate',
      profession: 'Professional',
      income: 'Not Disclosed',
      annualIncome: 'Not Disclosed',
      about: '',
      aboutMe: '',
      images: [],
      gallery: [],
      profileImage: '',
      verified: true,
      online: false,
      compatibilityScore: 90,
      matchScore: 90,
      maritalStatus: 'Never Married',
      motherTongue: 'Telugu',
      horoscope: {} as any,
      family: {} as any,
      lifestyle: {} as any,
      physicalAttributes: {} as any,
      languages: [],
      hobbies: [],
      partnerPreferences: {} as any,
      profileCompletion: 80,
      createdDate: new Date().toISOString()
    };
  }

  const numericId = raw.id || raw.user_id || raw.profile_id || raw.pk || raw.user?.id || '0';
  const name = raw.name || `${raw.first_name || raw.user?.first_name || ''} ${raw.last_name || raw.user?.last_name || ''}`.trim() || raw.username || raw.user?.username || `Member #${numericId}`;
  const gender = raw.gender || raw.user?.gender || (raw.looking_for === 'Bride' ? 'Female' : 'Male') || 'Female';
  const age = raw.age || raw.user?.age || (raw.date_of_birth ? Math.floor((Date.now() - new Date(raw.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000)) : 26);

  const rawLoc = raw.location || raw.city || {};
  const city = typeof raw.city === 'string'
    ? raw.city.trim()
    : (typeof rawLoc === 'object' && rawLoc?.city ? String(rawLoc.city).trim() : (typeof raw.location === 'string' ? raw.location.split(',')[0].trim() : (raw.district || 'India')));

  const state = typeof raw.state === 'string'
    ? raw.state.trim()
    : (typeof rawLoc === 'object' && rawLoc?.state ? String(rawLoc.state).trim() : (typeof raw.location === 'string' ? raw.location.split(',')[1]?.trim() || '' : ''));

  const rawPhoto = raw.photo_url || raw.profile_photo || raw.photo || raw.image || raw.avatar || raw.profileImage || (raw.user && (raw.user.profile_photo || raw.user.avatar || raw.user.photo)) || '';
  const photo = typeof rawPhoto === 'string' ? rawPhoto.trim() : '';
  const images = Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : (photo ? [photo] : []);

  const religion = typeof raw.religion === 'string' ? raw.religion : (raw.religion?.name || raw.religion?.label || 'Hindu');
  const caste = typeof raw.caste === 'string' ? raw.caste : (raw.caste?.name || raw.caste?.label || 'General');
  const education = typeof raw.highest_education === 'string' ? raw.highest_education : (typeof raw.education === 'string' ? raw.education : (raw.education?.name || raw.education?.label || 'Graduate'));
  const profession = typeof raw.occupation === 'string' ? raw.occupation : (typeof raw.profession === 'string' ? raw.profession : (raw.profession?.name || raw.profession?.label || 'Professional'));
  const maritalStatus = raw.marital_status || raw.maritalStatus || 'Never Married';
  const annualIncome = typeof raw.annual_income === 'string' ? raw.annual_income : (typeof raw.income === 'string' ? raw.income : 'Not Disclosed');
  const about = typeof raw.bio === 'string' ? raw.bio : (typeof raw.about_me === 'string' ? raw.about_me : (raw.about || ''));
  const complexion = raw.complexion || raw.physicalAttributes?.complexion || '';
  const motherTongue = raw.mother_tongue || raw.motherTongue || (raw.languages_known ? String(raw.languages_known).split(',')[0].trim() : 'Telugu');

  return {
    id: String(numericId),
    userId: String(raw.user_id || raw.user?.id || numericId),
    name: typeof name === 'string' ? name : 'Member',
    age: Number(age) || 26,
    gender,
    dob: raw.date_of_birth || '',
    height: typeof raw.height === 'string' ? raw.height : "5'6\"",
    religion,
    caste,
    motherTongue,
    location: `${city}${state ? `, ${state}` : ''}`,
    city,
    state,
    education,
    profession,
    income: annualIncome,
    annualIncome,
    maritalStatus,
    about,
    aboutMe: about,
    images,
    gallery: images,
    profileImage: photo,
    profile_photo: photo,
    photo,
    verified: Boolean(raw.is_verified || raw.verified || raw.verification_status === 'VERIFIED'),
    online: Boolean(raw.is_online || raw.online || raw.last_active === 'Online'),
    matchScore: raw.compatibility_score || raw.match_percentage || raw.score || undefined,
    compatibilityScore: raw.compatibility_score || raw.match_percentage || raw.score || undefined,
    member_id: raw.member_id || (numericId ? `KM${String(numericId).padStart(6, '0')}` : undefined),
    horoscope: {} as any,
    family: {} as any,
    languages: typeof raw.languages_known === 'string' ? raw.languages_known.split(',').map((s: string) => s.trim()) : [],
    hobbies: typeof raw.hobbies_interests === 'string' ? raw.hobbies_interests.split(',').map((s: string) => s.trim()) : [],
    partnerPreferences: {} as any,
    profileCompletion: raw.profile_completion_percentage || 90,
    createdDate: raw.created_at || new Date().toISOString(),
    physicalAttributes: {
      complexion,
      height: typeof raw.height === 'string' ? raw.height : "5'6\"",
      weight: raw.weight || '',
      bodyType: raw.body_type || ''
    } as any,
    lifestyle: {
      diet: raw.diet || '',
      smoking: raw.smoking || '',
      drinking: raw.drinking || ''
    } as any
  };
};

export const searchApi = {
  // 1. GET /api/search/filter-options
  getFilterOptions: async (): Promise<SearchFilterOptions> => {
    try {
      const candidateUrls = ['/search/filter-options', '/search/filter-options/'];
      for (const url of candidateUrls) {
        try {
          const res = await axiosClient.get(url);
          if (res.data && typeof res.data === 'object') {
            return res.data;
          }
        } catch {}
      }
      return {};
    } catch {
      return {};
    }
  },

  // 2. POST /api/search/basic-search
  basicSearch: async (params: BasicSearchParams): Promise<SearchResultsResponse<Profile>> => {
    const candidateUrls = ['/search/basic-search', '/search/basic-search/'];
    let lastError: any = null;

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.post(url, params);
        if (res.status >= 200 && res.status < 300) {
          const rawItems = extractDataArray<any>(res.data);
          const profiles = rawItems.map(mapRawToProfile);
          return {
            results: profiles,
            count: typeof res.data.count === 'number' ? res.data.count : profiles.length,
            page: params.page || 1,
            page_size: params.page_size || 20
          };
        }
      } catch (err) {
        lastError = err;
      }
    }
    throw new Error(extractErrorMsg(lastError?.response?.data, lastError?.response?.status || 500));
  },

  // 3. POST /api/search/advanced-search
  advancedSearch: async (params: AdvancedSearchParams): Promise<SearchResultsResponse<Profile>> => {
    const candidateUrls = ['/search/advanced-search', '/search/advanced-search/'];
    let lastError: any = null;

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.post(url, params);
        if (res.status >= 200 && res.status < 300) {
          const rawItems = extractDataArray<any>(res.data);
          const profiles = rawItems.map(mapRawToProfile);
          return {
            results: profiles,
            count: typeof res.data.count === 'number' ? res.data.count : profiles.length,
            page: params.page || 1,
            page_size: params.page_size || 20
          };
        }
      } catch (err) {
        lastError = err;
      }
    }
    throw new Error(extractErrorMsg(lastError?.response?.data, lastError?.response?.status || 500));
  },

  // 4. POST /api/search/keyword-search
  keywordSearch: async (params: KeywordSearchParams): Promise<SearchResultsResponse<Profile>> => {
    const candidateUrls = ['/search/keyword-search', '/search/keyword-search/'];
    let lastError: any = null;

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.post(url, params);
        if (res.status >= 200 && res.status < 300) {
          const rawItems = extractDataArray<any>(res.data);
          const profiles = rawItems.map(mapRawToProfile);
          return {
            results: profiles,
            count: typeof res.data.count === 'number' ? res.data.count : profiles.length,
            page: params.page || 1,
            page_size: params.page_size || 20
          };
        }
      } catch (err) {
        lastError = err;
      }
    }
    throw new Error(extractErrorMsg(lastError?.response?.data, lastError?.response?.status || 500));
  },

  // 5. GET /api/search/profile-id-search?identifier=1
  profileIdSearch: async (identifier: string | number): Promise<Profile | null> => {
    const cleanId = String(identifier).trim();
    if (!cleanId) return null;

    const candidateUrls = [
      `/search/profile-id-search?identifier=${encodeURIComponent(cleanId)}`,
      `/search/profile-id-search/?identifier=${encodeURIComponent(cleanId)}`
    ];

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.get(url);
        if (res.data) {
          const data = Array.isArray(res.data) ? res.data[0] : (res.data.result || res.data.profile || res.data);
          if (data && typeof data === 'object') {
            return mapRawToProfile(data);
          }
        }
      } catch {}
    }
    return null;
  },

  // 6. POST /api/search/nearby-search
  nearbySearch: async (params: NearbySearchParams): Promise<SearchResultsResponse<Profile>> => {
    const candidateUrls = ['/search/nearby-search', '/search/nearby-search/'];
    let lastError: any = null;

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.post(url, params);
        if (res.status >= 200 && res.status < 300) {
          const rawItems = extractDataArray<any>(res.data);
          const profiles = rawItems.map(mapRawToProfile);
          return {
            results: profiles,
            count: typeof res.data.count === 'number' ? res.data.count : profiles.length,
            page: params.page || 1,
            page_size: params.page_size || 20
          };
        }
      } catch (err) {
        lastError = err;
      }
    }
    throw new Error(extractErrorMsg(lastError?.response?.data, lastError?.response?.status || 500));
  },

  // 7. GET /api/search/ai-recommended-search?page=1&page_size=20&ai_ranking=false
  aiRecommendedSearch: async (params?: AiRecommendedSearchParams): Promise<SearchResultsResponse<Profile>> => {
    const page = params?.page || 1;
    const pageSize = params?.page_size || 20;
    const aiRanking = params?.ai_ranking ?? false;

    const candidateUrls = [
      `/search/ai-recommended-search?page=${page}&page_size=${pageSize}&ai_ranking=${aiRanking}`,
      `/search/ai-recommended-search/?page=${page}&page_size=${pageSize}&ai_ranking=${aiRanking}`
    ];

    let lastError: any = null;
    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.get(url);
        if (res.status >= 200 && res.status < 300) {
          const rawItems = extractDataArray<any>(res.data);
          const profiles = rawItems.map(mapRawToProfile);
          return {
            results: profiles,
            count: typeof res.data.count === 'number' ? res.data.count : profiles.length,
            page,
            page_size: pageSize
          };
        }
      } catch (err) {
        lastError = err;
      }
    }
    throw new Error(extractErrorMsg(lastError?.response?.data, lastError?.response?.status || 500));
  },

  // 8. GET /api/search/compatibility-search/{id}
  getCompatibilitySearch: async (targetUserId: string | number): Promise<CompatibilityScoreResponse> => {
    const cleanId = String(targetUserId).trim();
    const candidateUrls = [
      `/search/compatibility-search/${cleanId}`,
      `/search/compatibility-search/${cleanId}/`
    ];

    let lastError: any = null;
    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.get(url);
        if (res.status >= 200 && res.status < 300 && res.data) {
          return {
            target_user_id: targetUserId,
            overall_score: res.data.overall_score ?? res.data.score ?? res.data.compatibility_percentage ?? 88,
            compatibility_percentage: res.data.compatibility_percentage ?? res.data.overall_score ?? 88,
            category_scores: res.data.category_scores || res.data.breakdown || {},
            strengths: res.data.strengths || [],
            growth_areas: res.data.growth_areas || [],
            summary: res.data.summary || res.data.message || ''
          };
        }
      } catch (err) {
        lastError = err;
      }
    }
    throw new Error(extractErrorMsg(lastError?.response?.data, lastError?.response?.status || 500));
  },

  // 9. GET /api/search/saved-search
  getSavedSearches: async (): Promise<SavedSearchItem[]> => {
    const candidateUrls = ['/search/saved-search', '/search/saved-search/'];
    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.get(url);
        if (res.data) {
          return extractDataArray<SavedSearchItem>(res.data);
        }
      } catch {}
    }
    return [];
  },

  // 10. POST /api/search/saved-search
  createSavedSearch: async (payload: CreateSavedSearchPayload): Promise<SavedSearchItem> => {
    const candidateUrls = ['/search/saved-search', '/search/saved-search/'];
    let lastError: any = null;

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.post(url, payload);
        if (res.status >= 200 && res.status < 300 && res.data) {
          return res.data;
        }
      } catch (err) {
        lastError = err;
      }
    }
    throw new Error(extractErrorMsg(lastError?.response?.data, lastError?.response?.status || 500));
  },

  // 11. GET /api/search/saved-search/{id}
  getSavedSearchById: async (id: string | number): Promise<SavedSearchItem | null> => {
    const candidateUrls = [`/search/saved-search/${id}`, `/search/saved-search/${id}/`];
    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.get(url);
        if (res.data) return res.data;
      } catch {}
    }
    return null;
  },

  // 12. PUT /api/search/saved-search/{id}
  updateSavedSearch: async (id: string | number, payload: UpdateSavedSearchPayload): Promise<SavedSearchItem> => {
    const candidateUrls = [`/search/saved-search/${id}`, `/search/saved-search/${id}/`];
    let lastError: any = null;

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.put(url, payload);
        if (res.status >= 200 && res.status < 300 && res.data) {
          return res.data;
        }
      } catch (err) {
        lastError = err;
      }
    }
    throw new Error(extractErrorMsg(lastError?.response?.data, lastError?.response?.status || 500));
  },

  // 13. DELETE /api/search/saved-search/{id}
  deleteSavedSearch: async (id: string | number): Promise<boolean> => {
    const candidateUrls = [`/search/saved-search/${id}`, `/search/saved-search/${id}/`];
    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.delete(url);
        if (res.status >= 200 && res.status < 300) {
          return true;
        }
      } catch {}
    }
    return false;
  },

  // 14. POST /api/search/saved-search/{id}/execute?page=1&page_size=20&sort_by=relevance
  executeSavedSearch: async (
    id: string | number,
    params?: { page?: number; page_size?: number; sort_by?: string }
  ): Promise<SearchResultsResponse<Profile>> => {
    const page = params?.page || 1;
    const pageSize = params?.page_size || 20;
    const sortBy = params?.sort_by || 'relevance';

    const candidateUrls = [
      `/search/saved-search/${id}/execute?page=${page}&page_size=${pageSize}&sort_by=${sortBy}`,
      `/search/saved-search/${id}/execute/?page=${page}&page_size=${pageSize}&sort_by=${sortBy}`
    ];

    let lastError: any = null;
    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.post(url, {});
        if (res.status >= 200 && res.status < 300) {
          const rawItems = extractDataArray<any>(res.data);
          const profiles = rawItems.map(mapRawToProfile);
          return {
            results: profiles,
            count: typeof res.data.count === 'number' ? res.data.count : profiles.length,
            page,
            page_size: pageSize
          };
        }
      } catch (err) {
        lastError = err;
      }
    }
    throw new Error(extractErrorMsg(lastError?.response?.data, lastError?.response?.status || 500));
  },

  // 15. POST /api/search/recently-viewed-search/record
  recordRecentlyViewed: async (payload: { profile_id?: string | number; user_id?: string | number; search_query?: string }): Promise<boolean> => {
    const candidateUrls = [
      '/search/recently-viewed-search/record',
      '/search/recently-viewed-search/record/'
    ];
    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.post(url, payload);
        if (res.status >= 200 && res.status < 300) {
          return true;
        }
      } catch {}
    }
    return false;
  },

  // 16. GET /api/search/recently-viewed-search?page=1&page_size=20
  getRecentlyViewedSearches: async (params?: { page?: number; page_size?: number }): Promise<RecentlyViewedItem[]> => {
    const page = params?.page || 1;
    const pageSize = params?.page_size || 20;
    const candidateUrls = [
      `/search/recently-viewed-search?page=${page}&page_size=${pageSize}`,
      `/search/recently-viewed-search/?page=${page}&page_size=${pageSize}`
    ];
    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.get(url);
        if (res.data) {
          return extractDataArray<RecentlyViewedItem>(res.data);
        }
      } catch {}
    }
    return [];
  },

  // 17. DELETE /api/search/recently-viewed-search
  clearRecentlyViewedSearches: async (): Promise<boolean> => {
    const candidateUrls = [
      '/search/recently-viewed-search',
      '/search/recently-viewed-search/'
    ];
    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.delete(url);
        if (res.status >= 200 && res.status < 300) {
          return true;
        }
      } catch {}
    }
    return false;
  },

  // 18. DELETE /api/search/recently-viewed-search/{id}
  deleteRecentlyViewedItem: async (id: string | number): Promise<boolean> => {
    const candidateUrls = [
      `/search/recently-viewed-search/${id}`,
      `/search/recently-viewed-search/${id}/`
    ];
    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.delete(url);
        if (res.status >= 200 && res.status < 300) {
          return true;
        }
      } catch {}
    }
    return false;
  }
};
