import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { enableBrowserPush } from '../config/messaging';
import { ownerService } from '../services/owner.service';

/**
 * Automatically requests notification permission and registers the FCM push
 * token right after a user logs in — no manual "Enable Notifications" button
 * needed.
 *
 * Rules:
 *  - Only runs once per browser session (tracked via localStorage flag).
 *  - Only requests for OWNER and ADMIN roles (they have backend notification support).
 *  - Silently skips if the browser doesn't support push or permission is denied.
 *  - Re-runs if the user logs out and logs in again (flag cleared on logout).
 */
export function usePostLoginNotifications() {
  const { user, isAuthenticated } = useAuth();
  const prompted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Only for roles that have backend push notification support
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') return;

    // If notifications are blocked or already denied by user, skip silently
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied') {
      return;
    }

    // Already registered in this session?
    const storageKey = `vv_push_registered_${user.id}`;
    if (localStorage.getItem(storageKey) === 'true') return;

    // Prevent double-firing in strict mode
    if (prompted.current) return;
    prompted.current = true;

    // Small delay so the user sees the welcome toast first, THEN the
    // browser permission prompt appears — avoids jarring instant popup.
    const timer = setTimeout(async () => {
      try {
        const token = await enableBrowserPush();
        await ownerService.registerPushToken(token);
        localStorage.setItem(storageKey, 'true');
        localStorage.setItem('vv_owner_push_enabled', 'true');
        console.info('[Push] Notifications registered successfully.');
      } catch (err) {
        // Silently ignore — user may have denied or browser doesn't support it.
        // Don't show an error toast; this is automatic, not user-initiated.
        console.info('[Push] Skipped:', err instanceof Error ? err.message : err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);
}

