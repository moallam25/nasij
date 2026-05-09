'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Returns the live count of orders in `pending_review` status.
 * Subscribes to Supabase Realtime so the count updates instantly
 * without polling — drives the notification badge in the sidebar nav.
 */
export function useOrdersBadge(): number {
  const [count, setCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCount = async () => {
    try {
      const supabase = createClient();
      const { count: c } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review');
      setCount(c ?? 0);
    } catch {
      // silently no-op
    }
  };

  useEffect(() => {
    fetchCount();

    let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;

    try {
      const supabase = createClient();
      channel = supabase
        .channel('orders-badge')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => {
            // Debounce to coalesce rapid bursts
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(fetchCount, 400);
          },
        )
        .subscribe();
    } catch {
      // silently no-op
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (channel) {
        try { channel.unsubscribe(); } catch { /* noop */ }
      }
    };
  }, []);

  return count;
}
