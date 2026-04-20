import { createBrowserClient } from '@supabase/ssr';
import { readPublicEnv } from './env';

let _client: ReturnType<typeof createBrowserClient> | null = null;
let _logged = false;

/**
 * Browser-side Supabase client.
 *
 * - Uses the shared env helper so the same sanitization (whitespace, BOM,
 *   wrapping quotes, accidental "Bearer " prefix) applies in every context.
 * - Singleton: re-uses one client per browser session so we don't open
 *   multiple websocket connections.
 * - Throws a clear, actionable error if env is missing — the diagnostic
 *   page at /dashboard/diagnose can be opened to investigate.
 */
export const createClient = () => {
  if (_client) return _client;

  const { url, anonKey, checks, ok } = readPublicEnv();

  if (!ok || !url || !anonKey) {
    const errors = checks.filter((c) => c.level === 'error');
    const msg =
      errors.length > 0
        ? errors.map((c) => `${c.key}: ${c.message}`).join(' · ')
        : 'Supabase env not configured.';
    if (typeof window !== 'undefined') console.error('[supabase/client]', msg);
    throw new Error(`${msg}  →  Open /dashboard/diagnose for details.`);
  }

  // One-time visibility log so devs can sanity-check what URL the browser
  // is actually hitting (URL is public; the anon key preview is partial).
  if (typeof window !== 'undefined' && !_logged) {
    _logged = true;
    // eslint-disable-next-line no-console
    console.log(
      '%c[supabase] connected',
      'color:#2F5D4A;font-weight:600',
      `\n  URL: ${url}\n  anon: ${anonKey.slice(0, 6)}…${anonKey.slice(-4)}`
    );
  }

  _client = createBrowserClient(url, anonKey);
  return _client;
};

/** Safe non-throwing check for use in UI to disable buttons / show banners. */
export const isSupabaseConfigured = () => {
  const { ok } = readPublicEnv();
  return ok;
};
