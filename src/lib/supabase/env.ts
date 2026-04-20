/**
 * Single source of truth for reading Supabase env vars.
 *
 * Handles common .env.local mistakes:
 *   - leading/trailing whitespace
 *   - wrapping quotes ("..." or '...')
 *   - BOM characters at the start of a value
 *   - accidentally pasted "Bearer " prefix
 *
 * Validates the shape of the anon key (must be a 3-segment JWT) so we catch
 * cases where someone pasted the project ref or service-role key by mistake.
 */

export type EnvCheckLevel = 'ok' | 'warn' | 'error';

export type EnvCheck = {
  key: string;
  level: EnvCheckLevel;
  present: boolean;
  preview: string | null;   // safe preview (never reveals full secret)
  message: string;
};

const sanitize = (raw: string | undefined): string | undefined => {
  if (raw == null) return undefined;
  let v = String(raw);
  // Strip BOM
  v = v.replace(/^\uFEFF/, '');
  // Strip wrapping quotes
  v = v.trim().replace(/^['"]|['"]$/g, '');
  // Strip accidental "Bearer " prefix
  v = v.replace(/^Bearer\s+/i, '');
  return v.trim();
};

const isJwt = (s: string) => /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(s);

const previewSecret = (s: string | undefined): string | null => {
  if (!s) return null;
  if (s.length < 12) return `${s.slice(0, 2)}…(${s.length} chars)`;
  return `${s.slice(0, 6)}…${s.slice(-4)} (${s.length} chars)`;
};

/** Safe URL preview — full URL is fine to display, it's public. */
const previewUrl = (u: string | undefined): string | null => (u ? u : null);

/**
 * Read and sanitize the public Supabase env vars.
 * Returns the cleaned values plus a list of human-readable checks.
 */
export function readPublicEnv() {
  const url = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const checks: EnvCheck[] = [];

  // URL checks
  if (!url) {
    checks.push({
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      level: 'error',
      present: false,
      preview: null,
      message: 'Missing. Add it to .env.local at the project root and restart the dev server.',
    });
  } else if (!/^https?:\/\//i.test(url)) {
    checks.push({
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      level: 'error',
      present: true,
      preview: previewUrl(url),
      message: 'Should start with https:// — looks malformed.',
    });
  } else if (!/\.supabase\.(co|in)$/i.test(new URL(url).hostname)) {
    checks.push({
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      level: 'warn',
      present: true,
      preview: previewUrl(url),
      message: 'Hostname does not end in .supabase.co — make sure this is your project URL.',
    });
  } else {
    checks.push({
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      level: 'ok',
      present: true,
      preview: previewUrl(url),
      message: 'Looks valid.',
    });
  }

  // Anon key checks
  if (!anonKey) {
    checks.push({
      key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      level: 'error',
      present: false,
      preview: null,
      message: 'Missing. Copy it from Supabase → Project Settings → API → "anon public" key.',
    });
  } else if (!isJwt(anonKey)) {
    checks.push({
      key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      level: 'error',
      present: true,
      preview: previewSecret(anonKey),
      message: 'Does not look like a JWT (3 dot-separated segments). Did you paste the wrong value?',
    });
  } else {
    // Try to decode the role claim from the JWT body
    try {
      const body = JSON.parse(
        Buffer.from(anonKey.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
      );
      if (body.role && body.role !== 'anon') {
        checks.push({
          key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
          level: 'warn',
          present: true,
          preview: previewSecret(anonKey),
          message: `Role claim is "${body.role}", expected "anon". You may have pasted a different key.`,
        });
      } else {
        checks.push({
          key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
          level: 'ok',
          present: true,
          preview: previewSecret(anonKey),
          message: 'JWT shape looks correct.',
        });
      }
    } catch {
      checks.push({
        key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        level: 'warn',
        present: true,
        preview: previewSecret(anonKey),
        message: 'Could not decode JWT body; check it was copied in full.',
      });
    }
  }

  const ok = checks.every((c) => c.level !== 'error');

  return { url, anonKey, checks, ok };
}

/**
 * Server-only: also reads the service role key (never exposed to browser).
 */
export function readServerEnv() {
  const pub = readPublicEnv();
  const serviceKey = sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const serverChecks: EnvCheck[] = [];

  if (!serviceKey) {
    serverChecks.push({
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      level: 'warn',
      present: false,
      preview: null,
      message:
        'Missing. Server actions (sizes, exports, invoices) will fall back to the anon key and may fail RLS checks.',
    });
  } else if (!isJwt(serviceKey)) {
    serverChecks.push({
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      level: 'error',
      present: true,
      preview: previewSecret(serviceKey),
      message: 'Does not look like a JWT. Recopy from Supabase → Settings → API → "service_role".',
    });
  } else {
    serverChecks.push({
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      level: 'ok',
      present: true,
      preview: previewSecret(serviceKey),
      message: 'Present and well-formed.',
    });
  }

  return {
    ...pub,
    serviceKey,
    checks: [...pub.checks, ...serverChecks],
    ok: pub.ok && !serverChecks.some((c) => c.level === 'error'),
  };
}
