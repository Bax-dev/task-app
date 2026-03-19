'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: notifData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<{ notifications: any[]; unreadCount: number }>('/api/notifications'),
  });

  const markReadMutation = useMutation({
    mutationFn: (ids: string[]) => api.post('/api/notifications/read', { notificationIds: ids }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/api/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = notifData?.notifications ?? [];
  const unreadCount = notifData?.unreadCount ?? 0;

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border">
          {notifications.map((notif: any) => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 p-4 hover:bg-secondary/30 transition-colors cursor-pointer ${
                !notif.read ? 'bg-primary/5' : ''
              }`}
              onClick={() => {
                if (!notif.read) markReadMutation.mutate([notif.id]);
                if (notif.link) router.push(notif.link);
              }}
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.read ? 'bg-transparent' : 'bg-destructive'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{notif.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatTime(notif.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      )}
    </div>
  );
}
