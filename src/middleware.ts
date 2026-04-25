import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware:
 *   - Protects /dashboard/* (except /dashboard/login)
 *   - Protects /api/invoice/* (returns 401)
 *   - Redirects logged-in users away from /dashboard/login
 *
 * Fail-open semantics: if Supabase env vars are missing or the auth check
 * itself throws (network blip, paused project), we let the request through.
 * The login page renders its own diagnostic UI; blocking here would just
 * give the user an opaque redirect loop.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Env not configured: let everything through so the login page can show
  // its own "env missing" message. Without this, /dashboard would redirect
  // to /dashboard/login which would redirect back, etc.
  if (!url || !anonKey) {
    if (path.startsWith('/api/invoice') || path.startsWith('/api/export') || path.startsWith('/invoice')) {
      return NextResponse.json(
        { error: 'Supabase env not configured on the server' },
        { status: 500 }
      );
    }
    return response;
  }

  let user: { id: string } | null = null;

  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: any }[]) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (e) {
    console.error('[middleware] auth check failed:', e);
    if (path.startsWith('/api/invoice') || path.startsWith('/api/export')) {
      return NextResponse.json(
        { error: 'Auth service unreachable' },
        { status: 503 }
      );
    }
    return response;
  }

  // Always allow the login page and the diagnose page through.
  // The diagnose page exists to help fix a broken setup — gating it behind
  // login when login itself is broken creates a chicken-and-egg trap.
  if (path === '/dashboard/login' || path === '/dashboard/diagnose') {
    if (path === '/dashboard/login' && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return response;
  }

  // Protect /dashboard/*
  if (path.startsWith('/dashboard') && !user) {
    const loginUrl = new URL('/dashboard/login', request.url);
    if (path !== '/dashboard') loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  // Protect /api/invoice/* and /api/export/*
  if ((path.startsWith('/api/invoice') || path.startsWith('/api/export')) && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Protect /invoice/* HTML print pages
  if (path.startsWith('/invoice') && !user) {
    return NextResponse.redirect(new URL(`/dashboard/login?next=${path}`, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/invoice/:path*', '/api/export/:path*', '/invoice/:path*'],
};
