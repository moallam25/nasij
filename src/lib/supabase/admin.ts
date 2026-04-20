import { createClient } from '@supabase/supabase-js';
import { readServerEnv } from './env';

/**
 * Service-role Supabase client for trusted server-side operations
 * (server actions, webhooks, invoice/CSV/analytics routes).
 *
 * NEVER import this from a client component. Server-side only.
 *
 * Falls back to the anon key (with a warning) if SUPABASE_SERVICE_ROLE_KEY
 * is not configured — RLS will then limit what can be read/written.
 */
export function createAdminClient() {
  const { url, anonKey, serviceKey } = readServerEnv();
  if (!url || !anonKey) {
    throw new Error('Supabase admin client: NEXT_PUBLIC_SUPABASE_URL or _ANON_KEY missing.');
  }

  if (!serviceKey) {
    if (typeof process !== 'undefined') {
      console.warn(
        '[supabase/admin] SUPABASE_SERVICE_ROLE_KEY missing — falling back to anon key. ' +
          'Server actions will be subject to RLS.'
      );
    }
    return createClient(url, anonKey);
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
