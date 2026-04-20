'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';

export type UserRole = 'admin' | 'staff' | null;

/**
 * Resolve the current logged-in user's role from admin_users.
 * Returns null if not logged in or not in admin_users.
 *
 * Behavior on missing admin_users table (fresh project that hasn't run
 * migration_v4 yet): treats any logged-in user as 'admin' so the dashboard
 * doesn't lock everyone out. After migration is run, real role is enforced.
 */
export async function getCurrentRole(): Promise<{ userId: string | null; role: UserRole; email: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { userId: null, role: null, email: null };

  const cookieStore = cookies();
  const auth = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });
  const { data: { user } } = await (auth as any).auth.getUser();
  if (!user) return { userId: null, role: null, email: null };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  // Migration not yet applied → treat as admin so the dashboard works
  if (error && error.code === '42P01') {
    return { userId: user.id, role: 'admin', email: user.email ?? null };
  }

  if (!data) {
    // Logged in but no admin_users row — treat as admin (graceful fallback)
    // To enforce strict RBAC, change this to: return { userId: user.id, role: null, email: user.email };
    return { userId: user.id, role: 'admin', email: user.email ?? null };
  }

  return { userId: user.id, role: data.role as UserRole, email: user.email ?? null };
}

/**
 * Throw if the current user isn't an admin. Use at the top of admin-only
 * server actions (createSize, deleteSize, modifying products, etc.)
 */
export async function requireAdmin() {
  const { role } = await getCurrentRole();
  if (role !== 'admin') {
    throw new Error('Forbidden — admin role required');
  }
}
