import { unsealData } from 'iron-session';
import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_NAME, type AdminSession } from '@/lib/session';

/**
 * Read and validate the admin session from the request cookie.
 *
 * Uses unsealData() rather than getIronSession(req, res) to avoid passing a
 * reference to the outgoing response into iron-session. getIronSession stores
 * the res reference and can mutate it (set/delete cookies) as a side-effect,
 * which could corrupt the response headers we return.
 *
 * process.env.SESSION_SECRET is read here (at call time), not at module-eval
 * time, so a Vercel Edge cold-start can never freeze it as ''.
 */
async function getAdminSession(request: NextRequest): Promise<AdminSession | null> {
  const secret = process.env.SESSION_SECRET;
  // Require a secret of at least 32 chars — iron-session's minimum
  if (!secret || secret.length < 32) return null;

  const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookieValue) return null;

  try {
    // ttl:0 → don't enforce seal-level TTL; we use expiresAt for our own check
    return await unsealData<AdminSession>(cookieValue, { password: secret, ttl: 0 });
  } catch {
    // Invalid or tampered cookie → treat as unauthenticated
    return null;
  }
}

function sessionIsValid(session: AdminSession | null): boolean {
  return (
    session !== null &&
    session.admin === true &&
    typeof session.expiresAt === 'number' &&
    session.expiresAt > Date.now()
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Evaluate session once and reuse — avoids calling getAdminSession twice
  const session = await getAdminSession(request);
  const authed = sessionIsValid(session);

  // ── /dashboard/login ────────────────────────────────────────────────────
  if (pathname === '/dashboard/login') {
    // Logged-in users visiting the login page get bounced to the dashboard
    return authed
      ? NextResponse.redirect(new URL('/dashboard', request.url))
      : NextResponse.next();
  }

  // ── /dashboard/diagnose ─────────────────────────────────────────────────
  // Always accessible so a broken setup can be diagnosed from the outside
  if (pathname === '/dashboard/diagnose') {
    return NextResponse.next();
  }

  // ── All other /dashboard routes ─────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!authed) {
      const loginUrl = new URL('/dashboard/login', request.url);
      if (pathname !== '/dashboard') loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── /api/invoice/* and /api/export/* ────────────────────────────────────
  if (pathname.startsWith('/api/invoice') || pathname.startsWith('/api/export')) {
    return authed
      ? NextResponse.next()
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── /invoice/* HTML print pages ─────────────────────────────────────────
  if (pathname.startsWith('/invoice')) {
    if (!authed) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/login?next=${encodeURIComponent(pathname)}`,
          request.url,
        ),
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Use (.*) regex patterns — unambiguous zero-or-more match in all Next.js 14 versions.
    // /dashboard/:path* has been observed to miss the bare /dashboard path in some
    // path-to-regexp releases shipped inside Next.js patch versions.
    '/dashboard(.*)',
    '/api/invoice/(.*)',
    '/api/export/(.*)',
    '/invoice/(.*)',
  ],
};
