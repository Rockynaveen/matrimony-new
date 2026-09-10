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
    const parsed = parseInt(val.replace(/\D/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const extractDataArray = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && Array.isArray(data.data)) return data.data;
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
  return `HTTP error (${status})`;
};

export const matchingApi = {
  // 1. GET /api/matching/ai-recommendations
  getRecommendations: async (): Promise<MatchResponseSchema[]> => {
    const res = await axiosClient.get<MatchResponseSchema[] | { results: MatchResponseSchema[] }>('/matching/ai-recommendations');
    if (res.status >= 200 && res.status < 300) {
      return extractDataArray<MatchResponseSchema>(res.data);
    }
    throw new Error(extractErrorMsg(res.data, res.status));
  },

  // 2. POST /api/matching/interest/send
  sendInterest: async (payload: InterestSendSchema): Promise<InterestResponseSchema> => {
    const userId = toIntegerId(payload.to_user);
    if (!userId || userId <= 0) {
      throw new Error('Invalid recipient user ID. Please select a valid profile.');
    }
    const cleanPayload = {
      to_user: userId,
      message: payload.message || 'Hi, I am interested in your profile.'
    };
    const res = await axiosClient.post<InterestResponseSchema>('/matching/interest/send', cleanPayload);
    if (res.status >= 200 && res.status < 300) {
      return res.data;
    }
    throw new Error(extractErrorMsg(res.data, res.status));
  },

  // 3. GET /api/matching/interest/sent
  getSentInterests: async (): Promise<InterestResponseSchema[]> => {
    const res = await axiosClient.get<InterestResponseSchema[] | { results: InterestResponseSchema[] }>('/matching/interest/sent');
    if (res.status >= 200 && res.status < 300) {
      return extractDataArray<InterestResponseSchema>(res.data);
    }
    throw new Error(extractErrorMsg(res.data, res.status));
  },

  // 4. GET /api/matching/interest/received
  getReceivedInterests: async (): Promise<InterestResponseSchema[]> => {
    const res = await axiosClient.get<InterestResponseSchema[] | { results: InterestResponseSchema[] }>('/matching/interest/received');
    if (res.status >= 200 && res.status < 300) {
      return extractDataArray<InterestResponseSchema>(res.data);
    }
    throw new Error(extractErrorMsg(res.data, res.status));
  },

  // 5. PUT /api/matching/interest/1/update
  updateInterest: async (interestId: number, payload: InterestUpdateSchema): Promise<InterestResponseSchema> => {
    const cleanId = toIntegerId(interestId) || interestId;
    const res = await axiosClient.put<InterestResponseSchema>(`/matching/interest/${cleanId}/update`, payload);
    if (res.status >= 200 && res.status < 300) {
      return res.data;
    }
    throw new Error(extractErrorMsg(res.data, res.status));
  },

  // 6. DELETE /api/matching/interest/1
  deleteInterest: async (interestId: number): Promise<MessageResponseSchema> => {
    const cleanId = toIntegerId(interestId) || interestId;
    const res = await axiosClient.delete<MessageResponseSchema>(`/matching/interest/${cleanId}`);
    if (res.status >= 200 && res.status < 300) {
      return res.data || { success: true, message: 'Interest deleted successfully' };
    }
    throw new Error(extractErrorMsg(res.data, res.status));
  },

  // 7. POST /api/matching/shortlist/add
  addToShortlist: async (payload: ShortlistCreateSchema): Promise<MessageResponseSchema> => {
    const userId = toIntegerId(payload.user);
    if (!userId || userId <= 0) {
      throw new Error('Invalid user ID for shortlist');
    }
    const cleanPayload = { user: userId };
    const res = await axiosClient.post<MessageResponseSchema>('/matching/shortlist/add', cleanPayload);
    if (res.status >= 200 && res.status < 300) {
      return res.data || { success: true, message: 'Profile shortlisted successfully' };
    }
    throw new Error(extractErrorMsg(res.data, res.status));
  },

  // 8. GET /api/matching/shortlist
  getShortlist: async (): Promise<MatchResponseSchema[]> => {
    const res = await axiosClient.get<MatchResponseSchema[] | { results: MatchResponseSchema[] }>('/matching/shortlist');
    if (res.status >= 200 && res.status < 300) {
      return extractDataArray<MatchResponseSchema>(res.data);
    }
    throw new Error(extractErrorMsg(res.data, res.status));
  },

  // 9. DELETE /api/matching/shortlist/remove/1
  removeFromShortlist: async (userId: number | string): Promise<MessageResponseSchema> => {
    const cleanId = toIntegerId(userId) || userId;
    const res = await axiosClient.delete<MessageResponseSchema>(`/matching/shortlist/remove/${cleanId}`);
    if (res.status >= 200 && res.status < 300) {
      return res.data || { success: true, message: 'Profile removed from shortlist' };
    }
    throw new Error(extractErrorMsg(res.data, res.status));
  },

  // 10. POST /api/matching/ignore/add
  addToIgnore: async (payload: IgnoreCreateSchema): Promise<MessageResponseSchema> => {
    const userId = toIntegerId(payload.user);
    if (!userId || userId <= 0) {
      throw new Error('Invalid user ID for ignore');
    }
    const cleanPayload = { user: userId, reason: payload.reason || 'Not interested' };
    const res = await axiosClient.post<MessageResponseSchema>('/matching/ignore/add', cleanPayload);
    if (res.status >= 200 && res.status < 300) {
      return res.data || { success: true, message: 'Profile ignored successfully' };
    }
    throw new Error(extractErrorMsg(res.data, res.status));
  },

  // 11. GET /api/matching/ignore
  getIgnoredProfiles: async (): Promise<MatchResponseSchema[]> => {
    const res = await axiosClient.get<MatchResponseSchema[] | { results: MatchResponseSchema[] }>('/matching/ignore');
    if (res.status >= 200 && res.status < 300) {
      return extractDataArray<MatchResponseSchema>(res.data);
    }
    throw new Error(extractErrorMsg(res.data, res.status));
  },

  // 12. DELETE /api/matching/ignore/remove/1
  removeFromIgnore: async (userId: number | string): Promise<MessageResponseSchema> => {
    const cleanId = toIntegerId(userId) || userId;
    const res = await axiosClient.delete<MessageResponseSchema>(`/matching/ignore/remove/${cleanId}`);
    if (res.status >= 200 && res.status < 300) {
      return res.data || { success: true, message: 'Profile removed from ignore list' };
    }
    throw new Error(extractErrorMsg(res.data, res.status));
  },

  // 13. POST /api/matching/block/add
  blockProfile: async (payload: BlockCreateSchema): Promise<MessageResponseSchema> => {
    const userId = toIntegerId(payload.user);
    if (!userId || userId <= 0) {
      throw new Error('Invalid user ID for block');
    }
    const cleanPayload = { user: userId, reason: payload.reason || 'Blocked by user' };
    const res = await axiosClient.post<MessageResponseSchema>('/matching/block/add', cleanPayload);
    if (res.status >= 200 && res.status < 300) {
      return res.data || { success: true, message: 'Profile blocked successfully' };
    }
    throw new Error(extractErrorMsg(res.data, res.status));
  },

  // 14. GET /api/matching/block
  getBlockedProfiles: async (): Promise<MatchResponseSchema[]> => {
    const res = await axiosClient.get<MatchResponseSchema[] | { results: MatchResponseSchema[] }>('/matching/block');
    if (res.status >= 200 && res.status < 300) {
      return extractDataArray<MatchResponseSchema>(res.data);
    }
    throw new Error(extractErrorMsg(res.data, res.status));
  },

  // 15. DELETE /api/matching/block/remove/1
  unblockProfile: async (userId: number | string): Promise<MessageResponseSchema> => {
    const cleanId = toIntegerId(userId) || userId;
    const res = await axiosClient.delete<MessageResponseSchema>(`/matching/block/remove/${cleanId}`);
    if (res.status >= 200 && res.status < 300) {
      return res.data || { success: true, message: 'Profile unblocked successfully' };
    }
    throw new Error(extractErrorMsg(res.data, res.status));
  },

  // Backward compatibility convenience methods
  getInterest: async (interestId: number): Promise<InterestResponseSchema> => {
    const cleanId = toIntegerId(interestId) || interestId;
    const res = await axiosClient.get<InterestResponseSchema>(`/matching/interest/${cleanId}`);
    return res.data;
  },
  shortlistProfile: async (userId: number | string): Promise<MessageResponseSchema> => {
    return matchingApi.addToShortlist({ user: toIntegerId(userId) });
  },
  removeShortlist: async (userId: number | string): Promise<MessageResponseSchema> => {
    return matchingApi.removeFromShortlist(toIntegerId(userId));
  }
};

export default matchingApi;
