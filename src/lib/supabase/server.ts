import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { readPublicEnv } from './env';

/**
 * Server-side Supabase client for RSCs / route handlers.
 * Reads/writes the user's session cookies. Uses the shared env helper.
 */
export const createClient = () => {
  const { url, anonKey, ok } = readPublicEnv();
  if (!ok || !url || !anonKey) {
    throw new Error(
      'Supabase server client: env not configured. Check /dashboard/diagnose.'
    );
  }

  const cookieStore = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options?: any }[]) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* read-only context (RSC) — ignore */
        }
      },
    },
  });
};
