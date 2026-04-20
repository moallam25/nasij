import { NextResponse } from 'next/server';
import { readServerEnv } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/diagnose
 *
 * Public diagnostic endpoint that returns:
 *   - environment-variable status (server-side view)
 *   - the result of a live SELECT against the products table
 *   - response time of the test query
 *
 * Returns sanitized previews — full secrets are NEVER included in the response.
 */
export async function GET() {
  const env = readServerEnv();

  const out: any = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'unknown',
    nextRuntime: process.env.NEXT_RUNTIME || 'nodejs',
    env: {
      url: env.url || null,
      checks: env.checks,
      ok: env.ok,
    },
    testQuery: null as any,
  };

  if (!env.url || !env.anonKey) {
    out.testQuery = { skipped: true, reason: 'env not configured' };
    return NextResponse.json(out, { status: 200 });
  }

  // Live test query — counts the products table.
  const start = Date.now();
  try {
    const supabase = createAdminClient();
    const { count, error, status } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    out.testQuery = {
      ok: !error,
      durationMs: Date.now() - start,
      httpStatus: status || null,
      productCount: count ?? null,
      error: error
        ? {
            code: error.code || null,
            message: error.message,
            hint: error.hint || null,
            details: error.details || null,
          }
        : null,
    };
  } catch (e: any) {
    out.testQuery = {
      ok: false,
      durationMs: Date.now() - start,
      error: { message: e?.message || String(e) },
    };
  }

  return NextResponse.json(out, { status: 200 });
}
