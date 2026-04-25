'use client';

/**
 * Renders a "Enable Notifications" button in the admin sidebar.
 * When clicked: requests push permission and tags the subscriber as role=admin
 * so server-side notifyAdminNewOrder() can target this device.
 *
 * Hidden once permission is granted (the tag persists in OneSignal).
 */

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

type PermState = 'loading' | 'default' | 'granted' | 'denied';

export function AdminPushSubscribe() {
  const [perm, setPerm] = useState<PermState>('loading');

  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      const native: string = OneSignal.Notifications?.permissionNative ?? 'default';
      setPerm(native as PermState);

      // If already subscribed, re-apply the admin tag (idempotent)
      if (native === 'granted') {
        await OneSignal.User?.addTag('role', 'admin').catch(() => {});
      }
    });
  }, []);

  const enable = async () => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      const granted: boolean = await OneSignal.Notifications.requestPermission();
      if (granted) {
        await OneSignal.User?.addTag('role', 'admin').catch(() => {});
        setPerm('granted');
      } else {
        setPerm('denied');
      }
    });
  };

  // Don't render anything while loading, already granted, or permanently denied
  if (perm !== 'default') return null;

  return (
    <button
      onClick={enable}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-nasij-cream/60 hover:bg-nasij-cream/10 shrink-0 w-full text-start transition-colors"
      title="Get push notifications for new orders"
    >
      <Bell size={16} className="shrink-0" />
      <span className="flex flex-col leading-tight text-start">
        <span>تفعيل الإشعارات</span>
        <span className="text-[10px] tracking-wide opacity-60">Enable Notifications</span>
      </span>
    </button>
  );
}
