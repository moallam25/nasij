import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { getSessionOptions, type AdminSession } from '@/lib/session';

export async function POST() {
  const session = await getIronSession<AdminSession>(cookies(), getSessionOptions());
  session.destroy();
  return NextResponse.json({ ok: true });
}
