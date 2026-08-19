import { axiosClient } from './axiosClient';
import type { NotificationItem } from '../types';

export interface NotificationResponseSchema {
  id: number | string;
  title?: string;
  message?: string;
  notification_type?: string;
  category?: string;
  is_read?: boolean;
  read?: boolean;
  created_at?: string;
  timestamp?: string;
  link?: string;
  avatar?: string;
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

export const notificationApi = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await axiosClient.get('/notifications/');
    let rawList: NotificationResponseSchema[] = [];

    if (Array.isArray(res.data)) {
      rawList = res.data;
    } else if (res.data && Array.isArray(res.data.results)) {
      rawList = res.data.results;
    } else if (res.data && Array.isArray(res.data.data)) {
      rawList = res.data.data;
    }

    return rawList.map((item, index): NotificationItem => {
      const catRaw = item.category || item.notification_type || item.type || 'All';
      let category: NotificationItem['category'] = 'All';

      const catLower = String(catRaw).toLowerCase();
      if (catLower.includes('interest')) category = 'Interests';
      else if (catLower.includes('match')) category = 'Matches';
      else if (catLower.includes('message') || catLower.includes('chat')) category = 'Messages';
      else if (catLower.includes('profile')) category = 'Profile';
      else if (catLower.includes('member') || catLower.includes('plan')) category = 'Membership';

      const formattedTimestamp = item.timestamp || item.created_at
        ? new Date(item.timestamp || item.created_at || '').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'Just now';

      return {
        id: String(item.id || `notif-${index}`),
        category,
        title: item.title || 'Notification',
        message: item.message || item.text || item.content || '',
        timestamp: formattedTimestamp,
        read: Boolean(item.is_read ?? item.read ?? false),
        link: item.link || item.url || undefined,
        avatar: item.avatar || undefined
      };
    });
  },

  markAsRead: async (notificationId?: string | number): Promise<void> => {
    try {
      const cleanId = typeof notificationId === 'string' && !isNaN(Number(notificationId))
        ? Number(notificationId)
        : notificationId;
      await axiosClient.post('/notifications/mark-read', cleanId ? { id: cleanId, notification_id: cleanId } : {});
    } catch {
      if (notificationId) {
        try {
          await axiosClient.post(`/notifications/${notificationId}/read`);
        } catch {
          try {
            await axiosClient.put(`/notifications/${notificationId}/read`);
          } catch {
            // Fallback
          }
        }
      }
    }
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      await axiosClient.post('/notifications/mark-all-read');
    } catch {
      try {
        await axiosClient.post('/notifications/mark-read', {});
      } catch {
        try {
          await axiosClient.post('/notifications/read-all');
        } catch {
          // Fallback
        }
      }
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const res = await axiosClient.get('/notifications/unread-count');
      if (typeof res.data === 'number') {
        return res.data;
      }
      if (res.data && typeof res.data.count === 'number') {
        return res.data.count;
      }
      if (res.data && typeof res.data.unread_count === 'number') {
        return res.data.unread_count;
      }
      if (res.data && typeof res.data.unread === 'number') {
        return res.data.unread;
      }
      return 0;
    } catch {
      return 0;
    }
  },

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

  getPreferences: async (): Promise<NotificationPreferencesSchema> => {
    try {
      const res = await axiosClient.get('/notifications/preferences');
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
  },

  updatePreferences: async (payload: NotificationPreferencesSchema): Promise<NotificationPreferencesSchema> => {
    try {
      const res = await axiosClient.put('/notifications/preferences', payload);
      return res.data || payload;
    } catch {
      try {
        const res = await axiosClient.post('/notifications/preferences', payload);
        return res.data || payload;
      } catch {
        return payload;
      }
    }
  },

  registerDeviceToken: async (token: string, deviceType = 'web'): Promise<any> => {
    const payload = {
      token,
      device_type: deviceType,
      registration_id: token
    };
    try {
      const res = await axiosClient.post('/notifications/device-token', payload);
      return res.data;
    } catch (err: any) {
      try {
        const res = await axiosClient.post('/notifications/device-token/', payload);
        return res.data;
      } catch {
        // Fallback
      }
    }
  }
};
