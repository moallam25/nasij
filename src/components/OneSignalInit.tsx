'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(os: any) => void | Promise<void>>;
  }
}

// Env var takes precedence; falls back to the project's app ID
const APP_ID =
  process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || 'f4b5b1c8-dee5-4111-ba36-493bb8b8f764';

const SAFARI_WEB_ID =
  process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID ||
  'web.onesignal.auto.170dfd78-50f3-4c48-aaba-810262274b60';

export function OneSignalInit() {
  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({
        appId: APP_ID,
        safari_web_id: SAFARI_WEB_ID,
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        notifyButton: { enable: true },
        allowLocalhostAsSecureOrigin: true,
      });
    });
  }, []);

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
    />
  );
}
