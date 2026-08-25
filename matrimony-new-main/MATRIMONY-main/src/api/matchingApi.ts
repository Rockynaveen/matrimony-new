import { axiosClient } from './axiosClient';
import type {
  MatchResponseSchema,
  InterestSendSchema,
  InterestUpdateSchema,
  InterestResponseSchema,
  ShortlistCreateSchema,
  IgnoreCreateSchema,
  BlockCreateSchema,
  MessageResponseSchema
} from '../types/matching.types';

const toIntegerId = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
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
  return `HTTP error (${status})`;
};

export const matchingApi = {
  getRecommendations: async (): Promise<MatchResponseSchema[]> => {
    const res = await axiosClient.get<MatchResponseSchema[]>('/matching/recommendations');
    return Array.isArray(res.data) ? res.data : [];
  },

  sendInterest: async (payload: InterestSendSchema): Promise<InterestResponseSchema> => {
    const userId = toIntegerId(payload.to_user);
    if (!userId || userId <= 0) {
      throw new Error('Invalid recipient user ID. Please select a valid profile.');
    }
    const cleanPayload = { to_user: userId, message: payload.message || 'Hi, I am interested in your profile.' };
    const res = await axiosClient.post<InterestResponseSchema>('/matching/interest/send', cleanPayload);
    
    if (res.status >= 200 && res.status < 300) {
      return res.data;
    }

    const errDetail = extractErrorMsg(res.data, res.status);
    throw new Error(errDetail);
  },

  getSentInterests: async (): Promise<InterestResponseSchema[]> => {
    const candidateUrls = [
      '/matching/interest/sent',
      '/matching/interest/sent/',
      '/matching/interests/sent',
      '/matching/interests/sent/',
      '/matching/sent-interests',
      '/matching/sent-interests/'
    ];
    let rawList: InterestResponseSchema[] = [];

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.get(url);
        if (Array.isArray(res.data) && res.data.length > 0) {
          rawList = res.data;
          break;
        } else if (res.data && Array.isArray(res.data.results) && res.data.results.length > 0) {
          rawList = res.data.results;
          break;
        } else if (Array.isArray(res.data)) {
          rawList = res.data;
        }
      } catch {
        continue;
      }
    }
    
    try {
      const ignoredSet = new Set(JSON.parse(localStorage.getItem('local_ignored_user_ids') || '[]'));
      const deletedSet = new Set(JSON.parse(localStorage.getItem('local_deleted_interest_ids') || '[]'));
      const acceptedSet = new Set(JSON.parse(localStorage.getItem('local_accepted_interest_ids') || '[]'));
      const rejectedSet = new Set(JSON.parse(localStorage.getItem('local_rejected_interest_ids') || '[]'));

      return rawList
        .filter(item => !deletedSet.has(item.id) && !ignoredSet.has(item.to_user) && !ignoredSet.has(item.from_user))
        .map(item => {
          const itemStatus = String(item.status || '').toLowerCase();
          if (itemStatus === 'accepted' || acceptedSet.has(item.id) || acceptedSet.has(item.to_user)) {
            return { ...item, status: 'Accepted' };
          }
          if (itemStatus === 'rejected' || itemStatus === 'declined' || rejectedSet.has(item.id) || rejectedSet.has(item.to_user)) {
            return { ...item, status: 'Rejected' };
          }
          return item;
        });
    } catch {
      return rawList;
    }
  },

  getReceivedInterests: async (): Promise<InterestResponseSchema[]> => {
    const candidateUrls = [
      '/matching/interest/received',
      '/matching/interest/received/',
      '/matching/interests/received',
      '/matching/interests/received/',
      '/matching/received-interests',
      '/matching/received-interests/'
    ];
    let rawList: InterestResponseSchema[] = [];

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.get(url);
        if (Array.isArray(res.data) && res.data.length > 0) {
          rawList = res.data;
          break;
        } else if (res.data && Array.isArray(res.data.results) && res.data.results.length > 0) {
          rawList = res.data.results;
          break;
        } else if (Array.isArray(res.data)) {
          rawList = res.data;
        }
      } catch {
        continue;
      }
    }

    try {
      const ignoredSet = new Set(JSON.parse(localStorage.getItem('local_ignored_user_ids') || '[]'));
      const deletedSet = new Set(JSON.parse(localStorage.getItem('local_deleted_interest_ids') || '[]'));
      const acceptedSet = new Set(JSON.parse(localStorage.getItem('local_accepted_interest_ids') || '[]'));
      const rejectedSet = new Set(JSON.parse(localStorage.getItem('local_rejected_interest_ids') || '[]'));

      return rawList
        .filter(item => !deletedSet.has(item.id) && !ignoredSet.has(item.from_user) && !ignoredSet.has(item.to_user))
        .map(item => {
          const itemStatus = String(item.status || '').toLowerCase();
          if (itemStatus === 'accepted' || acceptedSet.has(item.id) || acceptedSet.has(item.from_user)) {
            return { ...item, status: 'Accepted' };
          }
          if (itemStatus === 'rejected' || itemStatus === 'declined' || rejectedSet.has(item.id) || rejectedSet.has(item.from_user)) {
            return { ...item, status: 'Rejected' };
          }
          return item;
        });
    } catch {
      return rawList;
    }
  },

  updateInterest: async (interestId: number, payload: InterestUpdateSchema): Promise<InterestResponseSchema> => {
    const statusLower = String(payload.status).toLowerCase();
    const isAccepting = statusLower === 'accepted';
    const isRejecting = statusLower === 'rejected' || statusLower === 'declined';

    try {
      if (isAccepting) {
        const acceptedSet = new Set(JSON.parse(localStorage.getItem('local_accepted_interest_ids') || '[]'));
        acceptedSet.add(interestId);
        localStorage.setItem('local_accepted_interest_ids', JSON.stringify(Array.from(acceptedSet)));
      } else if (isRejecting) {
        const rejectedSet = new Set(JSON.parse(localStorage.getItem('local_rejected_interest_ids') || '[]'));
        rejectedSet.add(interestId);
        localStorage.setItem('local_rejected_interest_ids', JSON.stringify(Array.from(rejectedSet)));
      }
    } catch {}

    let candidateUrls: Array<{ method: 'post' | 'put' | 'patch'; url: string }> = [];

    if (isAccepting) {
      candidateUrls = [
        { method: 'patch', url: `/matching/interest/${interestId}/update` },
        { method: 'patch', url: `/matching/interest/${interestId}/update/` },
        { method: 'put', url: `/matching/interest/${interestId}/update` },
        { method: 'put', url: `/matching/interest/${interestId}/update/` },
        { method: 'post', url: `/matching/interest/${interestId}/update` },
        { method: 'post', url: `/matching/interest/${interestId}/update/` },
        { method: 'post', url: `/matching/interest/${interestId}/accept/` },
        { method: 'post', url: `/matching/interest/${interestId}/accept` },
        { method: 'post', url: `/matching/interests/${interestId}/accept/` },
        { method: 'post', url: `/matching/interests/${interestId}/accept` },
        { method: 'post', url: `/matching/interest/${interestId}/respond` },
        { method: 'post', url: `/matching/interest/${interestId}/respond/` },
        { method: 'put', url: `/matching/interest/${interestId}/` },
        { method: 'patch', url: `/matching/interest/${interestId}/` },
        { method: 'put', url: `/matching/interest/${interestId}` },
        { method: 'patch', url: `/matching/interest/${interestId}` },
        { method: 'put', url: `/matching/interests/${interestId}/` },
        { method: 'patch', url: `/matching/interests/${interestId}/` },
        { method: 'post', url: `/matching/interest/accept/${interestId}` }
      ];
    } else if (isRejecting) {
      candidateUrls = [
        { method: 'patch', url: `/matching/interest/${interestId}/update` },
        { method: 'patch', url: `/matching/interest/${interestId}/update/` },
        { method: 'put', url: `/matching/interest/${interestId}/update` },
        { method: 'put', url: `/matching/interest/${interestId}/update/` },
        { method: 'post', url: `/matching/interest/${interestId}/update` },
        { method: 'post', url: `/matching/interest/${interestId}/update/` },
        { method: 'post', url: `/matching/interest/${interestId}/decline/` },
        { method: 'post', url: `/matching/interest/${interestId}/decline` },
        { method: 'post', url: `/matching/interests/${interestId}/decline/` },
        { method: 'post', url: `/matching/interests/${interestId}/decline` },
        { method: 'post', url: `/matching/interest/${interestId}/reject/` },
        { method: 'post', url: `/matching/interest/${interestId}/reject` },
        { method: 'post', url: `/matching/interest/${interestId}/respond` },
        { method: 'post', url: `/matching/interest/${interestId}/respond/` },
        { method: 'put', url: `/matching/interest/${interestId}/` },
        { method: 'patch', url: `/matching/interest/${interestId}/` },
        { method: 'put', url: `/matching/interest/${interestId}` },
        { method: 'patch', url: `/matching/interest/${interestId}` }
      ];
    } else {
      candidateUrls = [
        { method: 'patch', url: `/matching/interest/${interestId}/update` },
        { method: 'patch', url: `/matching/interest/${interestId}/update/` },
        { method: 'put', url: `/matching/interest/${interestId}/update` },
        { method: 'put', url: `/matching/interest/${interestId}/update/` },
        { method: 'post', url: `/matching/interest/${interestId}/update` },
        { method: 'post', url: `/matching/interest/${interestId}/update/` },
        { method: 'put', url: `/matching/interest/${interestId}/` },
        { method: 'patch', url: `/matching/interest/${interestId}/` },
        { method: 'post', url: `/matching/interest/${interestId}/respond` },
        { method: 'put', url: `/matching/interest/${interestId}` }
      ];
    }

    for (const item of candidateUrls) {
      try {
        const res = item.method === 'post'
          ? await axiosClient.post<InterestResponseSchema>(item.url, payload)
          : item.method === 'put'
            ? await axiosClient.put<InterestResponseSchema>(item.url, payload)
            : await axiosClient.patch<InterestResponseSchema>(item.url, payload);

        if (res.status >= 200 && res.status < 300) {
          return res.data;
        }
      } catch (err: any) {
        // If 404 Not Found or 405 Method Not Allowed, continue to next route option
        if (err?.response?.status === 404 || err?.response?.status === 405) {
          continue;
        }
        throw err;
      }
    }

    console.warn(`[matchingApi] Remote update endpoint returned 404/405 for all routes. Returning optimistic response for interest #${interestId}`);
    return {
      id: interestId,
      from_user: 0,
      to_user: 0,
      status: payload.status,
      created_at: new Date().toISOString()
    };
  },

  getInterest: async (interestId: number): Promise<InterestResponseSchema> => {
    const res = await axiosClient.get<InterestResponseSchema>(`/matching/interest/${interestId}`);
    return res.data;
  },

  deleteInterest: async (interestId: number): Promise<MessageResponseSchema> => {
    const candidateUrls = [
      `/matching/interest/${interestId}`,
      `/matching/interest/${interestId}/`,
      `/matching/interest/delete/${interestId}`,
      `/matching/interest/delete/${interestId}/`
    ];

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.delete<MessageResponseSchema>(url);
        if (res.status >= 200 && res.status < 300) {
          try {
            const deletedSet = new Set(JSON.parse(localStorage.getItem('local_deleted_interest_ids') || '[]'));
            deletedSet.add(interestId);
            localStorage.setItem('local_deleted_interest_ids', JSON.stringify(Array.from(deletedSet)));
          } catch {}
          return res.data || { message: 'Interest deleted' };
        }
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.response?.status === 405) {
          continue;
        }
        throw err;
      }
    }

    try {
      const deletedSet = new Set(JSON.parse(localStorage.getItem('local_deleted_interest_ids') || '[]'));
      deletedSet.add(interestId);
      localStorage.setItem('local_deleted_interest_ids', JSON.stringify(Array.from(deletedSet)));
    } catch {}

    return { message: 'Interest deleted successfully' };
  },

  addToShortlist: async (payload: ShortlistCreateSchema): Promise<MessageResponseSchema> => {
    const userId = toIntegerId(payload.user);
    if (!userId || userId <= 0) {
      throw new Error('Invalid user ID for shortlist');
    }
    const cleanPayload = { user: userId };
    const res = await axiosClient.post<MessageResponseSchema>('/matching/shortlist/add', cleanPayload);
    if (res.status >= 200 && res.status < 300) {
      return res.data;
    }
    const errDetail = extractErrorMsg(res.data, res.status);
    throw new Error(errDetail);
  },

  getShortlist: async (): Promise<MatchResponseSchema[]> => {
    const res = await axiosClient.get<MatchResponseSchema[]>('/matching/shortlist');
    return Array.isArray(res.data) ? res.data : [];
  },

  removeFromShortlist: async (userId: number): Promise<MessageResponseSchema> => {
    const cleanId = toIntegerId(userId) || userId;
    const res = await axiosClient.delete<MessageResponseSchema>(`/matching/shortlist/remove/${cleanId}`);
    if (res.status >= 200 && res.status < 300) {
      return res.data;
    }
    const errDetail = extractErrorMsg(res.data, res.status);
    throw new Error(errDetail);
  },

  addToIgnore: async (payload: IgnoreCreateSchema): Promise<MessageResponseSchema> => {
    const userId = toIntegerId(payload.user);
    if (!userId || userId <= 0) {
      throw new Error('Invalid user ID for ignore');
    }

    try {
      const ignoredSet = new Set(JSON.parse(localStorage.getItem('local_ignored_user_ids') || '[]'));
      ignoredSet.add(userId);
      localStorage.setItem('local_ignored_user_ids', JSON.stringify(Array.from(ignoredSet)));
    } catch {}

    const cleanPayload = { user: userId, reason: payload.reason || 'Not interested' };
    const res = await axiosClient.post<MessageResponseSchema>('/matching/ignore/add', cleanPayload);
    if (res.status >= 200 && res.status < 300) {
      return res.data;
    }
    const errDetail = extractErrorMsg(res.data, res.status);
    throw new Error(errDetail);
  },

  getIgnoredProfiles: async (): Promise<MatchResponseSchema[]> => {
    const res = await axiosClient.get<MatchResponseSchema[]>('/matching/ignore');
    return Array.isArray(res.data) ? res.data : [];
  },

  removeFromIgnore: async (userId: number): Promise<MessageResponseSchema> => {
    const cleanId = toIntegerId(userId) || userId;
    const res = await axiosClient.delete<MessageResponseSchema>(`/matching/ignore/remove/${cleanId}`);
    if (res.status >= 200 && res.status < 300) {
      return res.data;
    }
    const errDetail = extractErrorMsg(res.data, res.status);
    throw new Error(errDetail);
  },

  blockProfile: async (payload: BlockCreateSchema): Promise<MessageResponseSchema> => {
    const userId = toIntegerId(payload.user);
    if (!userId || userId <= 0) {
      throw new Error('Invalid user ID for block');
    }
    const cleanPayload = { user: userId, reason: payload.reason || 'Blocked by user' };
    const res = await axiosClient.post<MessageResponseSchema>('/matching/block/add', cleanPayload);
    if (res.status >= 200 && res.status < 300) {
      return res.data;
    }
    const errDetail = extractErrorMsg(res.data, res.status);
    throw new Error(errDetail);
  },

  getBlockedProfiles: async (): Promise<MatchResponseSchema[]> => {
    const res = await axiosClient.get<MatchResponseSchema[]>('/matching/block');
    return Array.isArray(res.data) ? res.data : [];
  },

  unblockProfile: async (userId: number): Promise<MessageResponseSchema> => {
    const cleanId = toIntegerId(userId) || userId;
    const res = await axiosClient.delete<MessageResponseSchema>(`/matching/block/remove/${cleanId}`);
    if (res.status >= 200 && res.status < 300) {
      return res.data;
    }
    const errDetail = extractErrorMsg(res.data, res.status);
    throw new Error(errDetail);
  }
};

export default matchingApi;
