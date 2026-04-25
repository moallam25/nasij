'use client';

/**
 * Loads the OneSignal Web SDK v16 once in the root layout.
 * - No native prompt or bell button — opt-in is triggered explicitly per context.
 * - Pushes the init call to window.OneSignalDeferred so it runs even if this
 *   component mounts before the CDN script finishes downloading.
 */

import Script from 'next/script';
import { useEffect } from 'react';

// Make window.OneSignal / OneSignalDeferred available to TypeScript
declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(os: any) => void | Promise<void>>;
  }
}

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

export function OneSignalInit() {
  useEffect(() => {
    if (!APP_ID) return;
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({
        appId: APP_ID,
        // Service worker must live at the root to control the full scope
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        // Suppress native browser prompt — we ask explicitly per context
        notifyButton: { enable: false },
        welcomeNotification: { disable: true },
        allowLocalhostAsSecureOrigin: true,
      });
    });
  }, []);

  if (!APP_ID) return null;

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
    />
  );
}
