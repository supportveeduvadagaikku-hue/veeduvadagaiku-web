import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing, Check } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listenForPushMessages } from '../../config/messaging';
import { OwnerNotification, ownerService } from '../../services/owner.service';

export const OwnerNotificationBell: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['ownerNotifications'],
    queryFn: () => ownerService.getNotifications(),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
  const notificationData = data?.data;
  const seenNotificationIds = useRef<Set<string> | null>(null);

  const markRead = useMutation({
    mutationFn: (id: string) => ownerService.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ownerNotifications'] }),
  });

  // Listen for foreground FCM push messages and show a native OS notification
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let disposed = false;
    listenForPushMessages((payload) => {
      queryClient.invalidateQueries({ queryKey: ['ownerNotifications'] });
      const title = payload.notification?.title || payload.data?.title || 'Veedu Vadagaikku Alert';
      const body = payload.notification?.body || payload.data?.body || 'New property update.';
      const tag = payload.data?.tag || payload.data?.notificationId || 'veedu_alert';

      // Show actual native OS mobile/system notification
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              icon: '/logo-emblem.png',
              badge: '/logo-emblem.png',
              tag,
              renotify: false,
              data: { url: payload.data?.url || '/owner/properties' },
            } as any);
          }).catch(() => {
            new Notification(title, { body, icon: '/logo-emblem.png', tag } as any);
          });
        } catch {}
      }

      toast(`${title}: ${body}`, { duration: 5000 });
    }).then((stop) => {
      if (disposed) stop();
      else unsubscribe = stop;
    }).catch(() => undefined);
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [queryClient]);

  // Track seen notification IDs (for future new-notification toasts if needed)
  useEffect(() => {
    const notifications = notificationData?.notifications;
    if (!notifications) return;
    seenNotificationIds.current = new Set(notifications.map((n) => n.id));
  }, [notificationData?.notifications]);

  const handleNotificationClick = (notification: OwnerNotification) => {
    if (!notification.readAt) markRead.mutate(notification.id);
    setOpen(false);
  };

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-orange-300"
        aria-label={`Notifications${notificationData?.unreadCount ? `, ${notificationData.unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        {notificationData?.unreadCount ? <BellRing className="h-4 w-4 text-orange-600" /> : <Bell className="h-4 w-4" />}
        <span>Notifications</span>
        {!!notificationData?.unreadCount && (
          <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
            {notificationData.unreadCount > 99 ? '99+' : notificationData.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h3 className="font-bold text-gray-900">Property activity</h3>
              <p className="text-xs text-gray-500">Alerts for your listings</p>
            </div>
            {notificationData?.unreadCount ? (
              <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">
                {notificationData.unreadCount} new
              </span>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificationData?.notifications.length
              ? notificationData.notifications.slice(0, 12).map((notification) => (
                  <Link
                    key={notification.id}
                    to={notification.href}
                    onClick={() => handleNotificationClick(notification)}
                    className={`block border-b border-gray-50 px-4 py-3 hover:bg-orange-50 ${
                      notification.readAt ? 'bg-white' : 'bg-orange-50/50'
                    }`}
                  >
                    <div className="flex gap-3">
                      <span
                        className={`mt-0.5 rounded-full p-1.5 ${
                          notification.readAt
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {notification.readAt ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <BellRing className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-gray-900">
                          {notification.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-600">
                          {notification.body}
                        </span>
                        <span className="mt-1 block text-[11px] text-gray-400">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </span>
                    </div>
                  </Link>
                ))
              : (
                <p className="px-4 py-8 text-center text-sm text-gray-500">
                  No notifications yet.
                </p>
              )}
          </div>
        </div>
      )}
    </div>
  );
};
