import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, type NotificationPreferencesSchema } from '../api/notificationApi';
import type { NotificationItem } from '../types';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  detail: (id: string | number) => [...notificationKeys.all, 'detail', String(id)] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};

// 1. Fetch all notifications
export function useNotifications() {
  const hasToken = !!localStorage.getItem('access_token');
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => notificationApi.getNotifications(),
    enabled: hasToken,
    staleTime: 30 * 1000, // 30s
  });
}

// 2. Fetch unread notification count
export function useUnreadNotificationCount() {
  const hasToken = !!localStorage.getItem('access_token');
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: hasToken,
    refetchInterval: 30000, // Background polling every 30s
    staleTime: 15 * 1000,
  });
}

// 3. Fetch single notification details
export function useNotificationDetail(notificationId: string | number) {
  const hasToken = !!localStorage.getItem('access_token');
  const validId = Boolean(notificationId);
  return useQuery({
    queryKey: notificationKeys.detail(notificationId),
    queryFn: () => notificationApi.getNotificationById(notificationId),
    enabled: hasToken && validId,
  });
}

// 4. Fetch notification preferences
export function useNotificationPreferences() {
  const hasToken = !!localStorage.getItem('access_token');
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => notificationApi.getPreferences(),
    enabled: hasToken,
    staleTime: 60 * 1000,
  });
}

// 5. Mark all notifications as read mutation
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.setQueryData<NotificationItem[]>(notificationKeys.list(), (old) => {
        if (!old) return [];
        return old.map(n => ({ ...n, read: true }));
      });
      queryClient.setQueryData<number>(notificationKeys.unreadCount(), 0);
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    }
  });
}

// 6. Mark single notification as read mutation
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string | number) => notificationApi.markAsRead(notificationId),
    onSuccess: (_data, notificationId) => {
      queryClient.setQueryData<NotificationItem[]>(notificationKeys.list(), (old) => {
        if (!old) return [];
        return old.map(n => String(n.id) === String(notificationId) ? { ...n, read: true } : n);
      });
      queryClient.setQueryData<number>(notificationKeys.unreadCount(), (old) => Math.max(0, (old || 1) - 1));
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    }
  });
}

// 7. Delete notification mutation
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string | number) => notificationApi.deleteNotification(notificationId),
    onSuccess: (_data, notificationId) => {
      queryClient.setQueryData<NotificationItem[]>(notificationKeys.list(), (old) => {
        if (!old) return [];
        return old.filter(n => String(n.id) !== String(notificationId));
      });
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    }
  });
}

// 8. Update notification preferences mutation
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NotificationPreferencesSchema) => notificationApi.updatePreferences(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(notificationKeys.preferences(), updated);
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    }
  });
}

// 9. Register device token mutation
export function useRegisterDeviceToken() {
  return useMutation({
    mutationFn: ({ token, deviceType = 'web' }: { token: string; deviceType?: 'web' | 'ios' | 'android' }) =>
      notificationApi.registerDeviceToken(token, deviceType)
  });
}
