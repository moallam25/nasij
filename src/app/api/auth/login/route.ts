// bcryptjs requires the Node runtime — not Edge-compatible
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { getSessionOptions, SESSION_TTL_MS, type AdminSession } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (!rateLimit(`login:${ip}`).ok) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429 },
    );
  }

  let email: string, password: string;
  try {
    ({ email, password } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH;

  if (!ADMIN_EMAIL || !ADMIN_HASH || !process.env.SESSION_SECRET) {
    return NextResponse.json(
      { error: 'Server misconfigured — set ADMIN_EMAIL, ADMIN_PASSWORD_HASH, and SESSION_SECRET env vars.' },
      { status: 500 },
    );
  }

  const emailMatch =
    typeof email === 'string' &&
    email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();

  const passwordMatch =
    emailMatch &&
    typeof password === 'string' &&
    (await bcrypt.compare(password, ADMIN_HASH));

  if (!emailMatch || !passwordMatch) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const session = await getIronSession<AdminSession>(cookies(), getSessionOptions());
  session.admin = true;
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  await session.save();

  return NextResponse.json({ ok: true });
}
