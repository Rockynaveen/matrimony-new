import { create } from 'zustand';
import type { NotificationItem } from '../types';
import { notificationApi } from '../api/notificationApi';
import { queryClient } from '../lib/queryClient';

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;

  // Actions
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => void;
  addNotification: (item: {
    title: string;
    message: string;
    category: NotificationItem['category'];
    link?: string;
    avatar?: string;
  }) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ notifications: [], unreadCount: 0 });
      return;
    }

    set({ isLoading: true });
    try {
      const payload = await notificationApi.getNotificationsPayload();

      const validNotifications = payload.notifications.filter(
        (n) =>
          !n.title?.includes('Interest Sent!') &&
          !n.message?.includes('Your interest request was sent') &&
          !n.title?.includes('Interest Request Sent')
      );

      set({
        notifications: validNotifications,
        unreadCount: payload.unread_count,
        isLoading: false
      });
    } catch {
      set({ notifications: [], unreadCount: 0, isLoading: false });
    }
  },

  markNotificationRead: (id: string) => {
    const target = get().notifications.find((n) => n.id === id);
    if (!target || target.read) return;

    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }));

    notificationApi.markAsRead(id).catch(() => {});
    try {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {}
  },

  markAllNotificationsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0
    }));

    try {
      await notificationApi.markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {}
  },

  deleteNotification: (id: string) => {
    const target = get().notifications.find((n) => n.id === id);

    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: target && !target.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount
    }));

    notificationApi.deleteNotification(id).catch(() => {});
    try {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {}
  },

  addNotification: (item) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: item.title,
      message: item.message,
      category: item.category,
      timestamp: 'Just now',
      read: false,
      link: item.link,
      avatar: item.avatar
    };

    set((state) => {
      // Prevent exact duplicate message spam within short interval
      if (
        state.notifications.length > 0 &&
        state.notifications[0].message === item.message &&
        state.notifications[0].title === item.title
      ) {
        return state;
      }
      return {
        notifications: [newNotif, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    });
  },

  clearNotifications: () => set({ notifications: [], unreadCount: 0 })
}));
