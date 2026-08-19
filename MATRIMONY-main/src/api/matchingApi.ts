import { axiosClient } from './axiosClient';
import type {
  MatchResponseSchema,
  InterestResponseSchema,
  InterestSendSchema,
  InterestUpdateSchema,
  ShortlistCreateSchema,
  IgnoreCreateSchema,
  BlockCreateSchema,
  MessageResponseSchema
} from '../types/matching.types';

function extractErrorMsg(data: any, status: number): string {
  if (data) {
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0];
      if (first?.msg) {
        const field = Array.isArray(first.loc) ? first.loc.join('.') : 'field';
        return `${first.msg} (${field})`;
      }
    }
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
  }
  return `Request failed with status ${status}`;
}

function toIntegerId(val: any): number {
  if (typeof val === 'number' && !isNaN(val) && val > 0) return Math.floor(val);
  if (typeof val === 'string') {
    const parsed = parseInt(val.replace(/\D/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

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
    console.warn(`[matchingApi] sendInterest response notice (${res.status}):`, errDetail);
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
    const res = await axiosClient.put<InterestResponseSchema>(`/matching/interest/${interestId}/update`, payload);
    if (res.status >= 200 && res.status < 300) {
      return res.data;
    }
    const errDetail = extractErrorMsg(res.data, res.status);
    throw new Error(errDetail);
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
