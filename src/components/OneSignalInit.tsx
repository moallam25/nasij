'use client';

/**
 * OneSignal SDK loader — mounts once in the root layout.
 *
 * Why we load the script imperatively instead of using next/script:
 *   - next/script inside a client component nested in App Router can fail to
 *     inject on client-side navigations (not just the first page load).
 *   - Splitting init between useEffect + a separate <Script> tag creates a
 *     race condition where the SDK can load before/after the deferred array
 *     is populated, depending on network speed and hydration timing.
 *   - useEffect + document.createElement guarantees the deferred array is
 *     always populated before the SDK script executes, because:
 *       1. useEffect fires synchronously after hydration
 *       2. the script is appended to <head> AFTER the array is set up
 *       3. async/defer scripts run after the current call stack clears
 */

import { useEffect } from 'react';

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(os: any) => void | Promise<void>>;
  }
}

const APP_ID =
  process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || 'f4b5b1c8-dee5-4111-ba36-493bb8b8f764';

const SAFARI_WEB_ID =
  process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID ||
  'web.onesignal.auto.170dfd78-50f3-4c48-aaba-810262274b60';

// Module-level flag — survives client-side route changes, prevents double-init.
// (A React ref would reset on unmount; a module var does not.)
let sdkBootstrapped = false;

export function OneSignalInit() {
  useEffect(() => {
    if (sdkBootstrapped) return;
    sdkBootstrapped = true;

    // ── Step 1: register the init callback BEFORE the script is appended ──
    // OneSignal SDK processes window.OneSignalDeferred once it loads. Pushing
    // here ensures the array is ready — the SDK will never miss this callback.
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        // Verbose logging in dev — invaluable for diagnosing subscription issues
        if (process.env.NODE_ENV !== 'production') {
          OneSignal.Debug?.setLogLevel('trace');
        }

        await OneSignal.init({
          appId: APP_ID,
          safari_web_id: SAFARI_WEB_ID,
          // serviceWorkerParam sets the SW scope explicitly.
          // The file path defaults to /OneSignalSDKWorker.js (root) — correct.
          serviceWorkerParam: { scope: '/' },
          notifyButton: { enable: true },
          // Allows localhost to be treated as a secure origin for local testing
          allowLocalhostAsSecureOrigin: true,
        });

        // Subscription status log — visible in browser DevTools console
        const perm = OneSignal.Notifications?.permissionNative ?? 'unknown';
        const subId = OneSignal.User?.PushSubscription?.id ?? null;
        console.info('[OneSignal] Init complete | permission:', perm, '| subscriptionId:', subId);
      } catch (err) {
        console.error('[OneSignal] Init failed:', err);
      }
    });

    // ── Step 2: append the SDK script to <head> ──
    // Using async + defer together: async makes it non-blocking; defer ensures
    // it runs after the document is parsed. Either alone would also work here.
    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.async = true;
    script.defer = true;
    script.onerror = () => console.error('[OneSignal] SDK script failed to load — check network/CSP');
    document.head.appendChild(script);
  }, []); // empty deps: this effect must run exactly once per page session

  return null; // no JSX — script is injected imperatively above
}
