import type { SessionOptions } from 'iron-session';

export interface AdminSession {
  admin: boolean;
  expiresAt: number; // ms — checked server-side; separate from cookie/seal TTL
}

export const COOKIE_NAME = 'nasij_admin';
export const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Returns session options read fresh from process.env on every call.
 * Do NOT cache this as a module-level constant: in the Edge runtime the
 * module is evaluated once at cold-start, so a constant would freeze the
 * password as '' if SESSION_SECRET wasn't injected yet.
 */
export function getSessionOptions(): SessionOptions {
  return {
    cookieName: COOKIE_NAME,
    password: process.env.SESSION_SECRET || '',
    ttl: 0, // no Max-Age on cookie → cleared when browser closes
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    },
  };
}
