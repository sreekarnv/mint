'use client';

import NotificationEmptyState from '@/components/(app)/notifications/notification-empty-state';
import NotificationItem from '@/components/(app)/notifications/notification-item';
import NotificationTimelineSkeleton from '@/components/(app)/notifications/notification-timeline-skeleton';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/query-keys';
import {
  useNotificationStore,
  type Notification,
} from '@/lib/stores/notification.store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isToday, isYesterday } from 'date-fns';
import { useEffect } from 'react';

export function NotificationsClient() {
  const queryClient = useQueryClient();
  const {
    notifications,
    markRead,
    markAllRead,
    unreadCount,
    setNotifications,
  } = useNotificationStore();

  const { data: freshNotifications, isLoading } = useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => apiClient.get<Notification[]>('/api/v1/notifications/'),
    staleTime: 0,
  });

  useEffect(() => {
    if (freshNotifications) setNotifications(freshNotifications);
  }, [freshNotifications, setNotifications]);

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.post('/api/v1/notifications/read-all'),
    onSuccess: () => {
      markAllRead();
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(),
      });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/api/v1/notifications/${id}/read`),
  });

  function handleRead(n: Notification) {
    if (!n.read) {
      markRead(n.id);
      markReadMutation.mutate(n.id);
    }
  }

  const groups = [
    {
      label: 'Today',
      items: notifications.filter((n) => isToday(new Date(n.createdAt))),
    },
    {
      label: 'Yesterday',
      items: notifications.filter((n) => isYesterday(new Date(n.createdAt))),
    },
    {
      label: 'Earlier',
      items: notifications.filter(
        (n) =>
          !isToday(new Date(n.createdAt)) &&
          !isYesterday(new Date(n.createdAt)),
      ),
    },
  ].filter(({ items }) => items.length > 0);

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          {unreadCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {unreadCount}
              </span>{' '}
              unread
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No new activity</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground -mt-0.5"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <NotificationTimelineSkeleton />
      ) : notifications?.length === 0 ? (
        <NotificationEmptyState />
      ) : (
        <div className="space-y-8">
          {groups.map(({ label, items }) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-4 ml-[calc(20px+20px)]">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                  {label}
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              <div>
                {items.map((n, i) => (
                  <NotificationItem
                    key={n.id}
                    n={n}
                    isLast={i === items.length - 1}
                    onRead={handleRead}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
