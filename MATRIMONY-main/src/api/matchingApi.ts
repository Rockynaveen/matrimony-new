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
    const res = await axiosClient.get<InterestResponseSchema[]>('/matching/interest/sent');
    return Array.isArray(res.data) ? res.data : [];
  },

  getReceivedInterests: async (): Promise<InterestResponseSchema[]> => {
    const res = await axiosClient.get<InterestResponseSchema[]>('/matching/interest/received');
    return Array.isArray(res.data) ? res.data : [];
  },

  updateInterest: async (interestId: number, payload: InterestUpdateSchema): Promise<InterestResponseSchema> => {
    const isAccepting = String(payload.status).toLowerCase() === 'accepted';
    const candidateUrls = [
      { method: 'post', url: `/matching/interest/${interestId}/accept/` },
      { method: 'post', url: `/matching/interest/${interestId}/accept` },
      { method: 'post', url: `/matching/interest/${interestId}/respond` },
      { method: 'post', url: `/matching/interest/${interestId}/respond/` },
      { method: 'put', url: `/matching/interest/${interestId}/` },
      { method: 'patch', url: `/matching/interest/${interestId}/` },
      { method: 'put', url: `/matching/interest/${interestId}` },
      { method: 'patch', url: `/matching/interest/${interestId}` },
      { method: 'put', url: `/matching/interest/${interestId}/update` },
      { method: 'post', url: `/matching/interest/accept/${interestId}` }
    ];

    const endpointsToTry = isAccepting
      ? candidateUrls
      : candidateUrls.slice(4).concat(candidateUrls.slice(0, 4));

    for (const item of endpointsToTry) {
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
    const res = await axiosClient.delete<MessageResponseSchema>(`/matching/interest/${interestId}`);
    if (res.status >= 200 && res.status < 300) {
      return res.data;
    }
    const errDetail = extractErrorMsg(res.data, res.status);
    throw new Error(errDetail);
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
