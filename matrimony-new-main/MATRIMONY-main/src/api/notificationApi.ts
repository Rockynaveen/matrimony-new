import { axiosClient } from './axiosClient';
import type { NotificationItem } from '../types';

export interface NotificationResponseSchema {
  id: number | string;
  title?: string;
  message?: string;
  text?: string;
  content?: string;
  notification_type?: string;
  type?: string;
  category?: string;
  is_read?: boolean;
  read?: boolean;
  created_at?: string;
  timestamp?: string;
  link?: string;
  url?: string;
  avatar?: string;
  sender_name?: string;
  from_user_name?: string;
  [key: string]: any;
}

export interface NotificationPreferencesSchema {
  email_notifications?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
  interest_alerts?: boolean;
  match_alerts?: boolean;
  message_alerts?: boolean;
  marketing_emails?: boolean;
  [key: string]: any;
}

export interface DeviceTokenPayload {
  token: string;
  device_type?: 'web' | 'ios' | 'android';
  registration_id?: string;
  [key: string]: any;
}

export interface GetNotificationsPayloadResponse {
  notifications: NotificationItem[];
  unread_count: number;
}

export const notificationApi = {
  // 1. GET /api/notifications/ (Returns full payload with notifications array and unread_count)
  getNotificationsPayload: async (): Promise<GetNotificationsPayloadResponse> => {
    try {
      const candidateUrls = [
        '/notifications/',
        '/notifications'
      ];

      let rawList: NotificationResponseSchema[] = [];
      let backendUnreadCount: number | null = null;

      for (const url of candidateUrls) {
        try {
          const res = await axiosClient.get(url);
          if (!res.data) continue;

          if (typeof res.data.unread_count === 'number') {
            backendUnreadCount = res.data.unread_count;
          }

          if (Array.isArray(res.data.notifications)) {
            rawList = res.data.notifications;
            break;
          } else if (Array.isArray(res.data.results)) {
            rawList = res.data.results;
            break;
          } else if (Array.isArray(res.data.data)) {
            rawList = res.data.data;
            break;
          } else if (Array.isArray(res.data)) {
            rawList = res.data;
            break;
          }
        } catch {
          continue;
        }
      }

      const mappedList: NotificationItem[] = rawList.map((item, index): NotificationItem => {
        const catRaw = item.category || item.notification_type || item.type || 'All';
        let category: NotificationItem['category'] = 'All';

        const catLower = String(catRaw).toLowerCase();
        if (catLower.includes('interest')) category = 'Interests';
        else if (catLower.includes('match')) category = 'Matches';
        else if (catLower.includes('message') || catLower.includes('chat')) category = 'Messages';
        else if (catLower.includes('profile')) category = 'Profile';
        else if (catLower.includes('member') || catLower.includes('plan')) category = 'Membership';

        let formattedTimestamp = 'Just now';
        const rawDate = item.created_at || item.timestamp;
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            formattedTimestamp = d.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
        }

        let messageText = item.message || item.text || item.content || '';
        const senderName = item.sender_name || item.from_user_name || item.sender_first_name || item.first_name;

        if (senderName && (messageText.toLowerCase().includes('a verified member sent you') || messageText.toLowerCase().includes('sent you an interest'))) {
          messageText = `${senderName} sent you an interest request.`;
        } else if (messageText.toLowerCase().includes('a verified member sent you an interest')) {
          messageText = `A verified member sent you an interest request.`;
        }

        const imageVal = (item.image && typeof item.image === 'string' && item.image.trim())
          ? item.image
          : ((item.avatar && typeof item.avatar === 'string' && item.avatar.trim()) ? item.avatar : undefined);

        const redirectUrl = item.redirect_url || item.link || item.url || undefined;
        const isReadBool = Boolean(item.is_read ?? item.read ?? (item.status === 'read') ?? false);

        return {
          id: String(item.id || `notif-${index}`),
          category,
          title: item.title || 'Notification',
          message: messageText,
          timestamp: formattedTimestamp,
          read: isReadBool,
          link: redirectUrl,
          avatar: imageVal
        };
      });

      const unreadCount = backendUnreadCount !== null
        ? backendUnreadCount
        : mappedList.filter(n => !n.read).length;

      return {
        notifications: mappedList,
        unread_count: unreadCount
      };
    } catch {
      return { notifications: [], unread_count: 0 };
    }
  },

  getNotifications: async (): Promise<NotificationItem[]> => {
    const payload = await notificationApi.getNotificationsPayload();
    return payload.notifications;
  },

  // 2. GET /api/notifications/unread-count
  getUnreadCount: async (): Promise<number> => {
    const token = useAuthStore.getState().accessToken || localStorage.getItem('access_token');
    if (!token) return 0;

    const candidateUrls = [
      '/notifications/unread-count',
      '/notifications/unread-count/',
      '/notifications/unread_count',
      '/notifications/unread_count/'
    ];

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.get(url);
        if (res.data) {
          if (res.data.detail === 'Unauthorized' || res.status === 401) {
            return 0;
          }
          if (typeof res.data === 'number') return res.data;
          if (typeof res.data.unread_count === 'number') return res.data.unread_count;
          if (typeof res.data.count === 'number') return res.data.count;
          if (typeof res.data.unread === 'number') return res.data.unread;
        }
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.response?.data?.detail === 'Unauthorized') {
          return 0;
        }
        continue;
      }
    }

    try {
      const notificationsList = await notificationApi.getNotifications();
      if (Array.isArray(notificationsList)) {
        return notificationsList.filter(n => !n.read).length;
      }
    } catch {}

    return 0;
  },

  // 3. POST/PATCH /api/notifications/mark-all-read or /api/notifications/mark-read
  markAllAsRead: async (): Promise<void> => {
    const candidates = [
      { method: 'post', url: '/notifications/mark-read', body: { all: true, mark_all: true } },
      { method: 'post', url: '/notifications/mark-read/', body: { all: true, mark_all: true } },
      { method: 'post', url: '/notifications/mark-read', body: {} },
      { method: 'post', url: '/notifications/mark-read/', body: {} },
      { method: 'post', url: '/notifications/mark-all-read', body: {} },
      { method: 'post', url: '/notifications/mark-all-read/', body: {} },
      { method: 'patch', url: '/notifications/mark-all-read', body: {} },
      { method: 'patch', url: '/notifications/mark-all-read/', body: {} },
      { method: 'post', url: '/notifications/read-all', body: {} }
    ];

    for (const item of candidates) {
      try {
        let res;
        if (item.method === 'patch') {
          res = await axiosClient.patch(item.url, item.body);
        } else {
          res = await axiosClient.post(item.url, item.body);
        }
        if (res && res.status >= 200 && res.status < 300 && (!res.data?.detail || !res.data.detail.includes('CSRF'))) {
          return;
        }
      } catch {
        continue;
      }
    }
  },

  // 4. GET /api/notifications/{notification_id}
  getNotificationById: async (notificationId: string | number): Promise<NotificationResponseSchema | null> => {
    const cleanId = typeof notificationId === 'string' && !isNaN(Number(notificationId))
      ? Number(notificationId)
      : notificationId;
    try {
      const res = await axiosClient.get(`/notifications/${cleanId}`);
      return res.data || null;
    } catch {
      try {
        const res = await axiosClient.get(`/notifications/${cleanId}/`);
        return res.data || null;
      } catch {
        return null;
      }
    }
  },

  // 5. PATCH/POST /api/notifications/{notification_id} or /api/notifications/mark-read (mark single read)
  markAsRead: async (notificationId?: string | number): Promise<void> => {
    if (!notificationId) return;
    const cleanId = typeof notificationId === 'string' && !isNaN(Number(notificationId))
      ? Number(notificationId)
      : notificationId;

    const candidates = [
      { method: 'post', url: '/notifications/mark-read', body: { notification_id: cleanId, id: cleanId } },
      { method: 'post', url: '/notifications/mark-read/', body: { notification_id: cleanId, id: cleanId } },
      { method: 'patch', url: `/notifications/${cleanId}`, body: { is_read: true, read: true } },
      { method: 'patch', url: `/notifications/${cleanId}/`, body: { is_read: true, read: true } },
      { method: 'post', url: `/notifications/${cleanId}/read`, body: {} },
      { method: 'post', url: `/notifications/${cleanId}/read/`, body: {} },
      { method: 'put', url: `/notifications/${cleanId}/read`, body: {} }
    ];

    for (const c of candidates) {
      try {
        let res;
        if (c.method === 'patch') {
          res = await axiosClient.patch(c.url, c.body);
        } else if (c.method === 'put') {
          res = await axiosClient.put(c.url, c.body);
        } else {
          res = await axiosClient.post(c.url, c.body);
        }
        if (res && res.status >= 200 && res.status < 300 && (!res.data?.detail || !res.data.detail.includes('CSRF'))) {
          return;
        }
      } catch {
        continue;
      }
    }
  },

  // 6. DELETE /api/notifications/{notification_id}
  deleteNotification: async (notificationId: string | number): Promise<void> => {
    const cleanId = typeof notificationId === 'string' && !isNaN(Number(notificationId))
      ? Number(notificationId)
      : notificationId;
    try {
      await axiosClient.delete(`/notifications/${cleanId}`);
    } catch {
      try {
        await axiosClient.delete(`/notifications/${cleanId}/`);
      } catch {
        // Fallback
      }
    }
  },

  // 7. GET /api/notifications/preferences
  getPreferences: async (): Promise<NotificationPreferencesSchema> => {
    try {
      const res = await axiosClient.get('/notifications/preferences');
      return res.data || {};
    } catch {
      try {
        const res = await axiosClient.get('/notifications/preferences/');
        return res.data || {};
      } catch {
        return {
          email_notifications: true,
          push_notifications: true,
          sms_notifications: false,
          interest_alerts: true,
          match_alerts: true,
          message_alerts: true,
          marketing_emails: false
        };
      }
    }
  },

  // 8. PATCH/PUT/POST /api/notifications/preferences
  updatePreferences: async (payload: NotificationPreferencesSchema): Promise<NotificationPreferencesSchema> => {
    const candidates = [
      { method: 'patch', url: '/notifications/preferences' },
      { method: 'patch', url: '/notifications/preferences/' },
      { method: 'put', url: '/notifications/preferences' },
      { method: 'put', url: '/notifications/preferences/' },
      { method: 'post', url: '/notifications/preferences' }
    ];

    for (const c of candidates) {
      try {
        let res;
        if (c.method === 'patch') {
          res = await axiosClient.patch(c.url, payload);
        } else if (c.method === 'put') {
          res = await axiosClient.put(c.url, payload);
        } else {
          res = await axiosClient.post(c.url, payload);
        }
        return res.data || payload;
      } catch {
        continue;
      }
    }
    return payload;
  },

  // 9. POST /api/notifications/device-token
  registerDeviceToken: async (token: string, deviceType: 'web' | 'ios' | 'android' = 'web'): Promise<any> => {
    if (!token) return null;
    const payload: DeviceTokenPayload = {
      token,
      device_type: deviceType,
      registration_id: token
    };

    const candidateUrls = [
      '/notifications/device-token',
      '/notifications/device-token/'
    ];

    for (const url of candidateUrls) {
      try {
        const res = await axiosClient.post(url, payload);
        return res.data;
      } catch {
        continue;
      }
    }
    return null;
  }
};
