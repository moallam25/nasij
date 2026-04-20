import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { readPublicEnv } from '@/lib/supabase/env';

/**
 * Server component — reads env at request time and renders a top banner if
 * Supabase isn't configured. Renders nothing when everything is healthy.
 *
 * Mounted in the root layout so it appears on every page until fixed.
 */
export function SetupBanner() {
  const { ok, checks } = readPublicEnv();
  if (ok) return null;

  const failing = checks.filter((c) => c.level === 'error').map((c) => c.key);

  return (
    <div
      className="w-full bg-amber-100 border-b border-amber-300 text-amber-950 px-4 py-2.5 text-sm flex items-center justify-center gap-3 flex-wrap"
      role="alert"
    >
      <AlertTriangle size={16} className="shrink-0" />
      <span>
        <strong>Setup required:</strong>{' '}
        {failing.length ? `Missing ${failing.join(', ')}.` : 'Supabase env not configured.'}
      </span>
      <Link
        href="/dashboard/diagnose"
        className="underline font-medium hover:text-amber-700"
      >
        Open diagnose →
      </Link>
    </div>
  );
}
