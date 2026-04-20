'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type Handler = () => void;

/**
 * Subscribe to all INSERT/UPDATE/DELETE events on the `orders` table and call
 * `onChange` whenever something happens. Re-uses one Supabase client per
 * mount; cleans up on unmount.
 *
 * IMPORTANT: For this to fire, you need to enable Realtime on the `orders`
 * table in Supabase: Database → Replication → enable for `orders`.
 *
 * The hook is safe to import on the dashboard. If Supabase env vars are
 * missing it silently no-ops (avoids breaking the page).
 */
export function useOrdersRealtime(onChange: Handler) {
  const handlerRef = useRef(onChange);
  handlerRef.current = onChange;

  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;

    try {
      const supabase = createClient();
      channel = supabase
        .channel('orders-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => {
            handlerRef.current();
          }
        )
        .subscribe();
    } catch (e) {
      // env missing — no-op
      console.warn('[realtime] disabled:', e instanceof Error ? e.message : e);
    }

    return () => {
      if (channel) {
        try { channel.unsubscribe(); } catch { /* noop */ }
      }
    };
  }, []);
}
