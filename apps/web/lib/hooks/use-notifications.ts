'use client';

import { useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth.store';
import {
  useNotificationStore,
  type Notification,
} from '@/lib/stores/notification.store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const { addNotification, setNotifications, setUnreadCount } =
    useNotificationStore();

  useEffect(() => {
    if (!user) return;

    // Fetch initial data
    apiClient
      .get<{ count: number }>('/api/v1/notifications/unread-count')
      .then((d) => setUnreadCount(d.count))
      .catch(() => {});

    apiClient
      .get<Notification[]>('/api/v1/notifications')
      .then((d) => setNotifications(d))
      .catch(() => {});

    // Open SSE stream — relies on HttpOnly cookie sent automatically
    const es = new EventSource(`${BASE_URL}/api/v1/notifications/stream`, {
      withCredentials: true,
    });

    es.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as Notification;
        addNotification(notification);
      } catch {
        // ignore malformed events
      }
    };

    return () => {
      es.close();
    };
  }, [user, addNotification, setNotifications, setUnreadCount]);
}
