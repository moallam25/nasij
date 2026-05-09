'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export type RealtimeOrderEvent = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: Record<string, unknown> | null;
  oldRow: Record<string, unknown> | null;
};

type Handler = (event: RealtimeOrderEvent) => void;

/**
 * Subscribe to INSERT/UPDATE/DELETE events on the `orders` table.
 * The callback receives the event type + new/old row data so callers can
 * differentiate a new order from a status update.
 *
 * IMPORTANT: Enable Realtime on the `orders` table in Supabase:
 *   Database → Replication → toggle `orders`
 *
 * Safe to use in the dashboard — silently no-ops if env vars are missing.
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
          (payload) => {
            handlerRef.current({
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              newRow:    (payload.new as Record<string, unknown>) || null,
              oldRow:    (payload.old as Record<string, unknown>) || null,
            });
          },
        )
        .subscribe();
    } catch (e) {
      console.warn('[realtime] disabled:', e instanceof Error ? e.message : e);
    }

    return () => {
      if (channel) {
        try { channel.unsubscribe(); } catch { /* noop */ }
      }
    };
  }, []);
}
