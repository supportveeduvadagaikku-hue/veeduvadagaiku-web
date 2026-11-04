import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing, Check, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { enableBrowserPush, listenForPushMessages } from '../../config/messaging';
import { OwnerNotification, ownerService } from '../../services/owner.service';

export const OwnerNotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(
    typeof localStorage !== 'undefined' && localStorage.getItem('vv_owner_push_enabled') === 'true'
  );
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

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let disposed = false;
    listenForPushMessages((payload) => {
      queryClient.invalidateQueries({ queryKey: ['ownerNotifications'] });
      const title = payload.notification?.title || payload.data?.title || 'Veedu Vadagaikku Alert';
      const body = payload.notification?.body || payload.data?.body || 'New property update.';

      // Show actual native OS mobile/system notification
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              data: { url: payload.data?.url || '/owner/properties' },
            } as any);
          }).catch(() => {
            new Notification(title, { body, icon: '/favicon.ico' });
          });
        } catch {}
      }

      toast(`${title}: ${body}`, {
        duration: 5000,
      });
    }).then((stop) => {
      if (disposed) stop();
      else unsubscribe = stop;
    }).catch(() => undefined);
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [queryClient]);

  useEffect(() => {
    const notifications = notificationData?.notifications;
    if (!notifications) return;
    seenNotificationIds.current = new Set(notifications.map((notification) => notification.id));
  }, [notificationData?.notifications]);

  const handleEnablePush = async () => {
    setEnablingPush(true);
    try {
      const token = await enableBrowserPush();
      await ownerService.registerPushToken(token);
      localStorage.setItem('vv_owner_push_enabled', 'true');
      setPushEnabled(true);
      toast.success('Browser alerts enabled');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not enable browser alerts');
    } finally {
      setEnablingPush(false);
    }
  };

  const handleNotificationClick = (notification: OwnerNotification) => {
    if (!notification.readAt) markRead.mutate(notification.id);
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      {!pushEnabled && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-orange-300 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-md shadow-orange-500/20">
              <BellRing className="h-5 w-5 animate-pulse" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Enable Mobile Notifications</h4>
              <p className="text-xs text-gray-600">Get real phone alerts with sound & vibration when your property is approved.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEnablePush}
            disabled={enablingPush}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-orange-700 active:scale-95 transition-all"
          >
            {enablingPush ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            <span>{enablingPush ? 'Connecting...' : 'Tap to Allow Alerts'}</span>
          </button>
        </div>
      )}

      <div className="relative flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
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
              <p className="text-xs text-gray-500">Alerts for views of your listings</p>
            </div>
            {notificationData?.unreadCount ? (
              <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">
                {notificationData.unreadCount} new
              </span>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificationData?.notifications.length ? notificationData.notifications.slice(0, 12).map((notification) => (
              <Link
                key={notification.id}
                to={notification.href}
                onClick={() => handleNotificationClick(notification)}
                className={`block border-b border-gray-50 px-4 py-3 hover:bg-orange-50 ${notification.readAt ? 'bg-white' : 'bg-orange-50/50'}`}
              >
                <div className="flex gap-3">
                  <span className={`mt-0.5 rounded-full p-1.5 ${notification.readAt ? 'bg-gray-100 text-gray-500' : 'bg-orange-100 text-orange-700'}`}>
                    {notification.readAt ? <Check className="h-3.5 w-3.5" /> : <BellRing className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-900">{notification.title}</span>
                    <span className="mt-0.5 block text-xs text-gray-600">{notification.body}</span>
                    <span className="mt-1 block text-[11px] text-gray-400">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </span>
                </div>
              </Link>
            )) : (
              <p className="px-4 py-8 text-center text-sm text-gray-500">No property views to show yet.</p>
            )}
          </div>

          <div className="border-t border-gray-100 p-3">
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={enablingPush || pushEnabled}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:cursor-default disabled:bg-emerald-700"
            >
              {enablingPush ? <Loader2 className="h-4 w-4 animate-spin" /> : pushEnabled ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {enablingPush ? 'Enabling…' : pushEnabled ? 'Browser alerts enabled' : 'Enable browser alerts'}
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);
};
