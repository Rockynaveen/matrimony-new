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
    const candidateUrls = [
      `/chat/conversations/${roomId}`,
      `/chat/conversations/${roomId}/`,
      `/chat/messages/${roomId}`,
      `/chat/messages/${roomId}/`,
      `/chat/history/${roomId}`,
      `/chat/history/${roomId}/`
    ];

    let rawList: any[] = [];

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.get(url);
        if (res.data && res.data.success === false) continue;
        if (Array.isArray(res.data)) {
          rawList = res.data;
          break;
        } else if ((res.data as any)?.messages && Array.isArray((res.data as any).messages)) {
          rawList = (res.data as any).messages;
          break;
        } else if ((res.data as any)?.results && Array.isArray((res.data as any).results)) {
          rawList = (res.data as any).results;
          break;
        } else if ((res.data as any)?.data && Array.isArray((res.data as any).data)) {
          rawList = (res.data as any).data;
          break;
        }
      } catch (err: any) {
        if (err?.response?.status === 404) continue;
        throw err;
      }
    }

    const currentUserId = Number(localStorage.getItem('user_id') || 0);

    const isGenericStatusText = (str: string) => {
      const lower = str.trim().toLowerCase();
      return lower === 'message sent successfully.' ||
        lower === 'message sent successfully' ||
        lower === 'success' ||
        lower === 'ok';
    };

    const parseUserId = (val: any): number => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      if (typeof val === 'object') return Number(val.id || val.user_id || val.pk || 0) || 0;
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    const apiMapped: ChatMessageOut[] = rawList
      .filter(item => {
        const text = String(item.message || item.content || item.text || '').trim();
        const hasMedia = Boolean(item.attachment_url || item.url || item.image || item.image_url || item.file || item.media || item.audio || item.voice || item.video);
        return (text && !isGenericStatusText(text)) || hasMedia;
      })
      .map((item, idx) => {
        const attachmentUrl = item.attachment_url || item.image || item.image_url || item.url || item.file || item.file_url || item.media || item.audio || item.voice || item.video || undefined;
        let detectedType = item.message_type || item.type;
        if (!detectedType && attachmentUrl) {
          const lowerUrl = String(attachmentUrl).toLowerCase();
          if (lowerUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || lowerUrl.startsWith('data:image') || item.image || item.image_url) {
            detectedType = 'image';
          } else if (lowerUrl.match(/\.(mp4|webm|mov|ogg)/i) || item.video) {
            detectedType = 'video';
          } else if (lowerUrl.match(/\.(mp3|wav|ogg|webm)/i) || item.voice || item.audio) {
            detectedType = 'voice';
          } else {
            detectedType = 'attachment';
          }
        }
        const isRead = item.read ?? item.is_read ?? item.seen ?? (item.status === 'read' || item.status === 'seen');
        const senderId = parseUserId(item.sender_id || item.sender || item.from_user || item.user_id || item.from_user_id || 0);
        const receiverId = parseUserId(item.receiver_id || item.receiver || item.to_user || item.recipient_id || item.to_user_id || roomId);

        return {
          id: item.id || item.message_id || `msg_${Date.now()}_${idx}`,
          room_id: Number(item.room_id || roomId),
          sender_id: senderId,
          receiver_id: receiverId,
          message: item.message || item.content || item.text || '',
          content: item.content || item.message || item.text || '',
          message_type: detectedType || 'text',
          attachment_url: attachmentUrl,
          status: item.status || (isRead ? 'read' : 'delivered'),
          created_at: item.created_at || item.timestamp || item.created_on || new Date().toISOString(),
          timestamp: item.timestamp || item.created_at || item.created_on || new Date().toISOString(),
          is_me: item.is_me ?? (senderId > 0 && senderId === currentUserId),
          read: Boolean(isRead)
        };
      });

    try {
      const rawLocalStored: ChatMessageOut[] = JSON.parse(localStorage.getItem(`local_chat_messages_${roomId}`) || '[]');
      const localStored = rawLocalStored.filter(m => {
        const text = String(m.message || m.content || m.text || '').trim();
        return text && !isGenericStatusText(text);
      });

      // Update clean local storage
      localStorage.setItem(`local_chat_messages_${roomId}`, JSON.stringify(localStored));

      const allMessages = [...apiMapped, ...localStored];
      const deduped: ChatMessageOut[] = [];

      for (const m of allMessages) {
        const idKey = String(m.id);
        const mText = String(m.message || m.content || '').trim();
        const mTime = new Date(m.timestamp || m.created_at || 0).getTime() || Number(m.id) || 0;

        const isDup = deduped.some(existing => {
          if (String(existing.id) === idKey) return true;
          const exText = String(existing.message || existing.content || '').trim();
          const exTime = new Date(existing.timestamp || existing.created_at || 0).getTime() || Number(existing.id) || 0;
          if (exText === mText && Math.abs(exTime - mTime) < 10000) return true;
          return false;
        });

        if (!isDup) deduped.push(m);
      }

      const parseTime = (msg: ChatMessageOut): number => {
        const ts = msg.timestamp || msg.created_at;
        if (!ts) return 0;
        const num = Number(ts);
        if (!isNaN(num) && num > 1000000000) return num;
        const parsed = new Date(ts).getTime();
        return isNaN(parsed) ? (typeof msg.id === 'number' ? msg.id : 0) : parsed;
      };

      return deduped.sort((a, b) => parseTime(a) - parseTime(b));
    } catch {
      return apiMapped;
    }
  },

  // 3. POST /api/chat/send
  sendTextMessage: async (payload: SendTextMessagePayload): Promise<ChatMessageOut> => {
    const roomIdNum = Number(payload.room_id);
    const msgText = payload.message.trim();
    const currentUserId = Number(localStorage.getItem('user_id') || 0);

    const body = {
      room_id: roomIdNum,
      receiver_id: roomIdNum,
      recipient_id: roomIdNum,
      to_user: roomIdNum,
      user_id: roomIdNum,
      message: msgText,
      content: msgText,
      text: msgText
    };

    const candidateUrls: Array<{ method: 'post' | 'put'; url: string }> = [
      { method: 'post', url: '/chat/send' },
      { method: 'post', url: '/chat/send/' },
      { method: 'post', url: '/chat/send-message' },
      { method: 'post', url: '/chat/send-message/' },
      { method: 'post', url: `/chat/conversations/${roomIdNum}/send` },
      { method: 'post', url: `/chat/conversations/${roomIdNum}/send/` },
      { method: 'post', url: `/chat/conversations/${roomIdNum}/messages` },
      { method: 'post', url: `/chat/conversations/${roomIdNum}/messages/` },
      { method: 'post', url: '/chat/messages/send' },
      { method: 'post', url: '/chat/messages/send/' }
    ];

    let createdMsg: ChatMessageOut | null = null;

    for (const item of candidateUrls) {
      try {
        const res = await axiosClient.post<any>(item.url, body, {
          params: { room_id: roomIdNum, receiver_id: roomIdNum, recipient_id: roomIdNum, to_user: roomIdNum }
        });
        if (res.status >= 200 && res.status < 300) {
          const resData = res.data;
          // Check for "Room not found." or false success
          if (resData && (resData.success === false || String(resData.message).toLowerCase().includes('room not found'))) {
            continue;
          }

          const rawResMsg = typeof resData.message === 'string' ? resData.message : '';
          const isGenericStatusMsg = rawResMsg.toLowerCase().includes('success') ||
            rawResMsg.toLowerCase().includes('sent') ||
            rawResMsg.toLowerCase().includes('ok');

          const finalMsgText = (!isGenericStatusMsg && rawResMsg ? rawResMsg : (resData.content || resData.text || msgText)).trim();

          createdMsg = {
            ...resData,
            id: resData.id || Date.now(),
            room_id: roomIdNum,
            sender_id: currentUserId,
            receiver_id: roomIdNum,
            message: finalMsgText || msgText,
            content: finalMsgText || msgText,
            created_at: resData.created_at || new Date().toISOString(),
            timestamp: resData.timestamp || new Date().toISOString(),
            is_me: true
          };
          break;
        }
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.response?.status === 405) continue;
        continue;
      }
    }

    if (!createdMsg) {
      createdMsg = {
        id: Date.now(),
        room_id: roomIdNum,
        sender_id: currentUserId,
        receiver_id: roomIdNum,
        message: msgText,
        content: msgText,
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        is_me: true,
        read: false
      };
    }

    try {
      const localStored: ChatMessageOut[] = JSON.parse(localStorage.getItem(`local_chat_messages_${roomIdNum}`) || '[]');
      localStored.push(createdMsg);
      localStorage.setItem(`local_chat_messages_${roomIdNum}`, JSON.stringify(localStored));
    } catch {}

    return createdMsg;
  },

  // 4. POST /api/chat/send-with-attachment
  sendWithAttachment: async (roomId: number | string, file: File, message?: string): Promise<ChatMessageOut> => {
    const roomIdNum = Number(roomId);
    const currentUserId = Number(localStorage.getItem('user_id') || 0);
    const objectUrl = URL.createObjectURL(file);

    const formData = new FormData();
    formData.append('room_id', String(roomIdNum));
    formData.append('receiver_id', String(roomIdNum));
    formData.append('file', file);
    formData.append('attachment', file);
    if (message) formData.append('message', message);

    try {
      const res = await axiosClient.post<any>('/chat/send-with-attachment', formData);
      if (res.status >= 200 && res.status < 300 && res.data) {
        return {
          ...res.data,
          id: res.data.id || Date.now(),
          room_id: roomIdNum,
          sender_id: currentUserId,
          attachment_url: res.data.attachment_url || res.data.url || res.data.file || objectUrl,
          is_me: true
        };
      }
    } catch {}

    return {
      id: Date.now(),
      room_id: roomIdNum,
      sender_id: currentUserId,
      attachment_url: objectUrl,
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      is_me: true,
      read: false
    };
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

  // 8. UserOnlineStatus (heartbeat) -> POST /api/chat/UserOnlineStatus
  sendHeartbeat: async (roomId?: number | string): Promise<{ status: string }> => {
    const currentUserId = Number(localStorage.getItem('user_id') || 0);
    if (!currentUserId) return { status: 'online' };

    const payload = {
      user_id: currentUserId,
      is_online: true,
      status: 'online',
      room_id: roomId ? Number(roomId) : undefined
    };

    const candidateUrls: Array<{ method: 'post' | 'get'; url: string }> = [
      { method: 'post', url: '/chat/UserOnlineStatus' },
      { method: 'post', url: '/chat/UserOnlineStatus/' },
      { method: 'post', url: '/chat/useronlinestatus' },
      { method: 'post', url: '/chat/heartbeat' }
    ];

    for (const item of candidateUrls) {
      try {
        let res;
        if (item.method === 'post') {
          res = await axiosClient.post(item.url, payload);
        } else {
          res = await axiosClient.get(item.url, { params: payload });
        }
        if (res.status >= 200 && res.status < 300) {
          return res.data || { status: 'online' };
        }
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.response?.status === 405) continue;
        return { status: 'online' };
      }
    }

    return { status: 'online' };
  },

  // 8.5 GET/POST UserOnlineStatus -> POST /api/chat/UserOnlineStatus
  getUserOnlineStatus: async (userId?: number | string): Promise<{ is_online: boolean; status: string }> => {
    const currentUserId = Number(localStorage.getItem('user_id') || 0);
    const targetId = userId ? Number(userId) : currentUserId;

    if (!targetId) return { is_online: false, status: 'offline' };

    const payload = {
      user_id: targetId,
      target_user_id: targetId,
      room_id: targetId
    };

    const candidateUrls: Array<{ method: 'post' | 'get'; url: string }> = [
      { method: 'post', url: '/chat/UserOnlineStatus' },
      { method: 'post', url: '/chat/UserOnlineStatus/' },
      { method: 'post', url: '/chat/useronlinestatus' },
      { method: 'get', url: `/chat/UserOnlineStatus?user_id=${targetId}` }
    ];

    for (const item of candidateUrls) {
      try {
        const res = item.method === 'post'
          ? await axiosClient.post(item.url, payload)
          : await axiosClient.get(item.url, { params: { user_id: targetId } });

        if (res.status >= 200 && res.status < 300 && res.data) {
          const rawData = res.data;
          const isOnline = rawData.is_online ?? rawData.online ?? rawData.isOnline ?? (rawData.status === 'online');
          if (isOnline !== undefined && isOnline !== null) {
            return { is_online: Boolean(isOnline), status: isOnline ? 'online' : 'offline' };
          }
        }
      } catch {
        continue;
      }
    }

    return { is_online: false, status: 'offline' };
  },

  // 9. POST /api/chat/send-voice
  sendVoiceMessage: async (roomId: number | string, audioBlob: Blob | File): Promise<ChatMessageOut> => {
    const roomIdNum = Number(roomId);
    const currentUserId = Number(localStorage.getItem('user_id') || 0);
    const objectUrl = URL.createObjectURL(audioBlob);

    const formData = new FormData();
    formData.append('room_id', String(roomIdNum));
    formData.append('receiver_id', String(roomIdNum));
    const file = audioBlob instanceof File ? audioBlob : new File([audioBlob], 'voice_note.webm', { type: 'audio/webm' });
    formData.append('file', file);
    formData.append('audio', file);
    formData.append('media', file);

    const candidateUrls = [
      '/chat/send-voice',
      '/chat/send-voice/',
      `/chat/conversations/${roomIdNum}/send-voice`,
      '/chat/send-with-attachment'
    ];

    let createdMsg: ChatMessageOut | null = null;

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.post<any>(url, formData, {
          params: { room_id: roomIdNum, receiver_id: roomIdNum, recipient_id: roomIdNum }
        });
        if (res.status >= 200 && res.status < 300 && res.data) {
          createdMsg = {
            ...res.data,
            id: res.data.id || Date.now(),
            room_id: roomIdNum,
            sender_id: currentUserId,
            message_type: 'voice',
            attachment_url: res.data.attachment_url || res.data.url || res.data.file || objectUrl,
            created_at: res.data.created_at || new Date().toISOString(),
            timestamp: res.data.timestamp || new Date().toISOString(),
            is_me: true
          };
          break;
        }
      } catch {}
    }

    if (!createdMsg) {
      createdMsg = {
        id: Date.now(),
        room_id: roomIdNum,
        sender_id: currentUserId,
        message_type: 'voice',
        attachment_url: objectUrl,
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        is_me: true,
        read: false
      };
    }

    try {
      const localStored: ChatMessageOut[] = JSON.parse(localStorage.getItem(`local_chat_messages_${roomIdNum}`) || '[]');
      localStored.push(createdMsg);
      localStorage.setItem(`local_chat_messages_${roomIdNum}`, JSON.stringify(localStored));
    } catch {}

    return createdMsg;
  },

  // 10. POST /api/chat/send-image
  sendImageMessage: async (roomId: number | string, imageFile: File): Promise<ChatMessageOut> => {
    const roomIdNum = Number(roomId);
    const currentUserId = Number(localStorage.getItem('user_id') || 0);
    const objectUrl = URL.createObjectURL(imageFile);

    const formData = new FormData();
    formData.append('room_id', String(roomIdNum));
    formData.append('receiver_id', String(roomIdNum));
    formData.append('recipient_id', String(roomIdNum));
    formData.append('to_user', String(roomIdNum));
    formData.append('file', imageFile);
    formData.append('image', imageFile);
    formData.append('media', imageFile);

    const candidateUrls = [
      '/chat/send-image',
      '/chat/send-image/',
      '/chat/upload-image',
      `/chat/conversations/${roomIdNum}/send-image`,
      '/chat/send-with-attachment'
    ];

    let createdMsg: ChatMessageOut | null = null;

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.post<any>(url, formData, {
          params: { room_id: roomIdNum, receiver_id: roomIdNum, recipient_id: roomIdNum }
        });
        if (res.status >= 200 && res.status < 300 && res.data) {
          createdMsg = {
            ...res.data,
            id: res.data.id || Date.now(),
            room_id: roomIdNum,
            sender_id: currentUserId,
            message_type: 'image',
            attachment_url: res.data.attachment_url || res.data.url || res.data.file || objectUrl,
            created_at: res.data.created_at || new Date().toISOString(),
            timestamp: res.data.timestamp || new Date().toISOString(),
            is_me: true
          };
          break;
        }
      } catch (err: any) {
        continue;
      }
    }

    if (!createdMsg) {
      createdMsg = {
        id: Date.now(),
        room_id: roomIdNum,
        sender_id: currentUserId,
        message_type: 'image',
        attachment_url: objectUrl,
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        is_me: true,
        read: false
      };
    }

    try {
      const localStored: ChatMessageOut[] = JSON.parse(localStorage.getItem(`local_chat_messages_${roomIdNum}`) || '[]');
      localStored.push(createdMsg);
      localStorage.setItem(`local_chat_messages_${roomIdNum}`, JSON.stringify(localStored));
    } catch {}

    return createdMsg;
  },

  // 11. POST /api/chat/send-video
  sendVideoMessage: async (roomId: number | string, videoFile: File): Promise<ChatMessageOut> => {
    const roomIdNum = Number(roomId);
    const currentUserId = Number(localStorage.getItem('user_id') || 0);
    const objectUrl = URL.createObjectURL(videoFile);

    const formData = new FormData();
    formData.append('room_id', String(roomIdNum));
    formData.append('receiver_id', String(roomIdNum));
    formData.append('recipient_id', String(roomIdNum));
    formData.append('file', videoFile);
    formData.append('video', videoFile);
    formData.append('media', videoFile);

    const candidateUrls = [
      '/chat/send-video',
      '/chat/send-video/',
      '/chat/upload-video',
      `/chat/conversations/${roomIdNum}/send-video`,
      '/chat/send-with-attachment'
    ];

    let createdMsg: ChatMessageOut | null = null;

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.post<any>(url, formData, {
          params: { room_id: roomIdNum, receiver_id: roomIdNum, recipient_id: roomIdNum }
        });
        if (res.status >= 200 && res.status < 300 && res.data) {
          createdMsg = {
            ...res.data,
            id: res.data.id || Date.now(),
            room_id: roomIdNum,
            sender_id: currentUserId,
            message_type: 'video',
            attachment_url: res.data.attachment_url || res.data.url || res.data.file || objectUrl,
            created_at: res.data.created_at || new Date().toISOString(),
            timestamp: res.data.timestamp || new Date().toISOString(),
            is_me: true
          };
          break;
        }
      } catch {}
    }

    if (!createdMsg) {
      createdMsg = {
        id: Date.now(),
        room_id: roomIdNum,
        sender_id: currentUserId,
        message_type: 'video',
        attachment_url: objectUrl,
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        is_me: true,
        read: false
      };
    }

    try {
      const localStored: ChatMessageOut[] = JSON.parse(localStorage.getItem(`local_chat_messages_${roomIdNum}`) || '[]');
      localStored.push(createdMsg);
      localStorage.setItem(`local_chat_messages_${roomIdNum}`, JSON.stringify(localStored));
    } catch {}

    return createdMsg;
  },

  // 12. POST /api/chat/send-document
  sendDocumentMessage: async (roomId: number | string, docFile: File): Promise<ChatMessageOut> => {
    const roomIdNum = Number(roomId);
    const currentUserId = Number(localStorage.getItem('user_id') || 0);
    const objectUrl = URL.createObjectURL(docFile);

    const formData = new FormData();
    formData.append('room_id', String(roomIdNum));
    formData.append('receiver_id', String(roomIdNum));
    formData.append('file', docFile);
    formData.append('document', docFile);

    const candidateUrls = [
      '/chat/send-document',
      '/chat/send-document/',
      '/chat/upload-document',
      `/chat/conversations/${roomIdNum}/send-document`,
      '/chat/send-with-attachment'
    ];

    let createdMsg: ChatMessageOut | null = null;

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.post<any>(url, formData, {
          params: { room_id: roomIdNum, receiver_id: roomIdNum, recipient_id: roomIdNum }
        });
        if (res.status >= 200 && res.status < 300 && res.data) {
          createdMsg = {
            ...res.data,
            id: res.data.id || Date.now(),
            room_id: roomIdNum,
            sender_id: currentUserId,
            message_type: 'document',
            attachment_url: res.data.attachment_url || res.data.url || res.data.file || objectUrl,
            message: docFile.name,
            created_at: res.data.created_at || new Date().toISOString(),
            timestamp: res.data.timestamp || new Date().toISOString(),
            is_me: true
          };
          break;
        }
      } catch {}
    }

    if (!createdMsg) {
      createdMsg = {
        id: Date.now(),
        room_id: roomIdNum,
        sender_id: currentUserId,
        message_type: 'document',
        attachment_url: objectUrl,
        message: docFile.name,
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        is_me: true,
        read: false
      };
    }

    try {
      const localStored: ChatMessageOut[] = JSON.parse(localStorage.getItem(`local_chat_messages_${roomIdNum}`) || '[]');
      localStored.push(createdMsg);
      localStorage.setItem(`local_chat_messages_${roomIdNum}`, JSON.stringify(localStored));
    } catch {}

    return createdMsg;
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
