import { axiosClient } from './axiosClient';
import type {
  ConversationOut,
  ChatMessageOut,
  SendTextMessagePayload,
  CallInitiatePayload,
  CallOut,
  CallRespondPayload,
  CallSignalPayload
} from '../types/chat.types';

const extractErrorMsg = (data: any, status: number): string => {
  if (!data) return `HTTP error (${status})`;
  if (typeof data === 'string') return data;
  if (data.message && typeof data.message === 'string') return data.message;
  if (data.detail) {
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
    }
  }
  return `HTTP error (${status})`;
};

export const chatApi = {
  // 1. GET /api/chat/conversations
  getConversations: async (): Promise<ConversationOut[]> => {
    try {
      const res = await axiosClient.get<ConversationOut[]>('/chat/conversations');
      return Array.isArray(res.data) ? res.data : (res.data as any)?.results || (res.data as any)?.conversations || [];
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallbackRes = await axiosClient.get('/chat/conversations/');
        return Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
      }
      throw err;
    }
  },

  // 2. GET /api/chat/conversations/{room_id}
  getConversationMessages: async (roomId: number | string): Promise<ChatMessageOut[]> => {
    try {
      const res = await axiosClient.get<ChatMessageOut[]>(`/chat/conversations/${roomId}`);
      if (Array.isArray(res.data)) return res.data;
      if ((res.data as any)?.messages && Array.isArray((res.data as any).messages)) {
        return (res.data as any).messages;
      }
      if ((res.data as any)?.results && Array.isArray((res.data as any).results)) {
        return (res.data as any).results;
      }
      return [];
    } catch (err: any) {
      if (err?.response?.status === 404) {
        console.warn(`[chatApi] Room ${roomId} returned 404. Room not found.`);
        return [];
      }
      throw err;
    }
  },

  // 3. POST /api/chat/send
  sendTextMessage: async (payload: SendTextMessagePayload): Promise<ChatMessageOut> => {
    const res = await axiosClient.post<ChatMessageOut>('/chat/send', {
      room_id: Number(payload.room_id),
      message: payload.message.trim()
    });
    if (res.status >= 200 && res.status < 300) {
      return res.data;
    }
    throw new Error(extractErrorMsg(res.data, res.status));
  },

  // 4. POST /api/chat/send-with-attachment
  sendWithAttachment: async (roomId: number | string, file: File, message?: string): Promise<ChatMessageOut> => {
    const formData = new FormData();
    formData.append('room_id', String(roomId));
    formData.append('file', file);
    formData.append('attachment', file);
    if (message) formData.append('message', message);

    const res = await axiosClient.post<ChatMessageOut>('/chat/send-with-attachment', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // 5. PUT /api/chat/conversations/{room_id}/seen
  markConversationSeen: async (roomId: number | string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await axiosClient.put(`/chat/conversations/${roomId}/seen`);
      return res.data || { success: true };
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        const fallback = await axiosClient.post(`/chat/conversations/${roomId}/seen`);
        return fallback.data || { success: true };
      }
      return { success: false, message: err?.message };
    }
  },

  // 6. DELETE /api/chat/message/{message_id}
  deleteMessageForMe: async (messageId: number | string): Promise<{ success: boolean }> => {
    const res = await axiosClient.delete(`/chat/message/${messageId}`);
    return res.data || { success: true };
  },

  // 7. DELETE /api/chat/message/{message_id}/everyone
  deleteMessageForEveryone: async (messageId: number | string): Promise<{ success: boolean }> => {
    const res = await axiosClient.delete(`/chat/message/${messageId}/everyone`);
    return res.data || { success: true };
  },

  // 8. POST /api/chat/heartbeat
  sendHeartbeat: async (roomId?: number | string): Promise<{ status: string }> => {
    const payload = roomId ? { room_id: Number(roomId) } : {};
    const res = await axiosClient.post('/chat/heartbeat', payload);
    return res.data || { status: 'ok' };
  },

  // 9. POST /api/chat/send-voice
  sendVoiceMessage: async (roomId: number | string, audioBlob: Blob | File): Promise<ChatMessageOut> => {
    const formData = new FormData();
    formData.append('room_id', String(roomId));
    const file = audioBlob instanceof File ? audioBlob : new File([audioBlob], 'voice_note.webm', { type: 'audio/webm' });
    formData.append('file', file);
    formData.append('audio', file);

    const res = await axiosClient.post<ChatMessageOut>('/chat/send-voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // 10. POST /api/chat/send-image
  sendImageMessage: async (roomId: number | string, imageFile: File): Promise<ChatMessageOut> => {
    const formData = new FormData();
    formData.append('room_id', String(roomId));
    formData.append('file', imageFile);
    formData.append('image', imageFile);

    const res = await axiosClient.post<ChatMessageOut>('/chat/send-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // 11. POST /api/chat/send-video
  sendVideoMessage: async (roomId: number | string, videoFile: File): Promise<ChatMessageOut> => {
    const formData = new FormData();
    formData.append('room_id', String(roomId));
    formData.append('file', videoFile);
    formData.append('video', videoFile);

    const res = await axiosClient.post<ChatMessageOut>('/chat/send-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // 12. POST /api/chat/send-document
  sendDocumentMessage: async (roomId: number | string, docFile: File): Promise<ChatMessageOut> => {
    const formData = new FormData();
    formData.append('room_id', String(roomId));
    formData.append('file', docFile);
    formData.append('document', docFile);

    const res = await axiosClient.post<ChatMessageOut>('/chat/send-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // 13. POST /api/chat/call/initiate
  initiateCall: async (payload: CallInitiatePayload): Promise<CallOut> => {
    const res = await axiosClient.post<CallOut>('/chat/call/initiate', payload);
    return res.data;
  },

  // 14. GET / POST /api/chat/call/active
  getActiveCall: async (roomId?: number | string): Promise<CallOut | null> => {
    const candidateEndpoints = [
      { method: 'get', url: `/chat/call/active${roomId ? `?room_id=${roomId}` : ''}` },
      { method: 'get', url: `/chat/call/active/${roomId ? `?room_id=${roomId}` : ''}` },
      { method: 'post', url: '/chat/call/active' },
      { method: 'post', url: '/chat/call/active/' }
    ];

    for (const item of candidateEndpoints) {
      try {
        const res = item.method === 'post'
          ? await axiosClient.post<CallOut>(item.url, roomId ? { room_id: Number(roomId) } : {})
          : await axiosClient.get<CallOut>(item.url);

        if (res.status >= 200 && res.status < 300) {
          return res.data && ((res.data as any).call_id || (res.data as any).id) ? res.data : null;
        }
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.response?.status === 405) {
          continue;
        }
      }
    }
    return null;
  },

  // 15. POST /api/chat/call/{call_id}/respond
  respondToCall: async (callId: number | string, payload: CallRespondPayload): Promise<CallOut> => {
    const res = await axiosClient.post<CallOut>(`/chat/call/${callId}/respond`, payload);
    return res.data;
  },

  // 16 & 17. POST /api/chat/call/{call_id}/signal
  sendCallSignal: async (callId: number | string, payload: CallSignalPayload): Promise<{ success: boolean }> => {
    const res = await axiosClient.post(`/chat/call/${callId}/signal`, payload);
    return res.data || { success: true };
  },

  // 18. POST /api/chat/call/{call_id}/end
  endCall: async (callId: number | string): Promise<{ success: boolean }> => {
    const res = await axiosClient.post(`/chat/call/${callId}/end`, { call_id: Number(callId) });
    return res.data || { success: true };
  }
};

export default chatApi;
