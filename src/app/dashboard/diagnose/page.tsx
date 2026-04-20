'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, RefreshCw, ExternalLink, Terminal } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { readPublicEnv, type EnvCheck } from '@/lib/supabase/env';

type DiagnoseResponse = {
  timestamp: string;
  nodeEnv: string;
  nextRuntime: string;
  env: { url: string | null; checks: EnvCheck[]; ok: boolean };
  testQuery: any;
};

export default function DiagnosePage() {
  const [serverData, setServerData] = useState<DiagnoseResponse | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [serverLoading, setServerLoading] = useState(true);

  const [browserData, setBrowserData] = useState<{ ok: boolean; count?: number | null; error?: string; durationMs: number } | null>(null);
  const [browserLoading, setBrowserLoading] = useState(true);

  // Browser-side env (read at render time)
  const browserEnv = readPublicEnv();

  const runServer = async () => {
    setServerLoading(true);
    setServerErr(null);
    try {
      const r = await fetch('/api/diagnose', { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as DiagnoseResponse;
      setServerData(j);
    } catch (e: any) {
      setServerErr(e?.message || String(e));
    } finally {
      setServerLoading(false);
    }
  };

  const runBrowser = async () => {
    setBrowserLoading(true);
    const start = Date.now();
    try {
      const supabase = createClient();
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      setBrowserData({
        ok: !error,
        count: count ?? null,
        error: error?.message,
        durationMs: Date.now() - start,
      });
    } catch (e: any) {
      setBrowserData({ ok: false, error: e?.message || String(e), durationMs: Date.now() - start });
    } finally {
      setBrowserLoading(false);
    }
  };

  useEffect(() => {
    runServer();
    runBrowser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overallOk =
    browserEnv.ok &&
    serverData?.env.ok === true &&
    serverData?.testQuery?.ok === true &&
    browserData?.ok === true;

  return (
    <div dir="ltr" className="min-h-screen bg-nasij-secondary-light px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="display-heading text-4xl text-nasij-primary">Supabase Diagnose</h1>
            <p className="text-nasij-ink/75 mt-2 text-base">
              Verifies env loading, key shape, and live connectivity from both the browser and the server.
            </p>
          </div>
          <button
            onClick={() => { runServer(); runBrowser(); }}
            className="inline-flex items-center gap-2 bg-nasij-primary text-nasij-cream px-4 py-2 rounded-full text-sm hover:bg-nasij-primary-dark transition-colors"
          >
            <RefreshCw size={14} /> Re-run
          </button>
        </div>

        {/* Overall verdict */}
        <div
          className={`rounded-3xl p-5 mb-6 flex items-center gap-3 border ${
            overallOk
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {overallOk ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
          <div className="font-medium">
            {overallOk
              ? 'All checks passed. Your Supabase connection is working from both browser and server.'
              : 'One or more checks failed. See the breakdown below.'}
          </div>
        </div>

        {/* Browser side */}
        <Section title="Browser context">
          <CheckList checks={browserEnv.checks} />
          <div className="mt-4 border-t border-nasij-secondary/40 pt-4">
            <div className="text-xs tracking-widest uppercase text-nasij-ink/55 mb-2">
              Browser test query (products count)
            </div>
            {browserLoading ? (
              <div className="flex items-center gap-2 text-nasij-ink/70 text-sm">
                <Loader2 size={14} className="animate-spin" /> Running…
              </div>
            ) : browserData?.ok ? (
              <div className="flex items-center gap-2 text-emerald-700 text-sm">
                <CheckCircle2 size={16} />
                Got {browserData.count ?? 0} rows in {browserData.durationMs} ms.
              </div>
            ) : (
              <div className="flex items-start gap-2 text-red-700 text-sm">
                <XCircle size={16} className="shrink-0 mt-0.5" />
                <code className="font-mono text-xs leading-relaxed">{browserData?.error || 'unknown error'}</code>
              </div>
            )}
          </div>
        </Section>

        {/* Server side */}
        <Section title="Server context">
          {serverLoading ? (
            <div className="flex items-center gap-2 text-nasij-ink/70 text-sm">
              <Loader2 size={14} className="animate-spin" /> Querying /api/diagnose…
            </div>
          ) : serverErr ? (
            <div className="text-red-700 text-sm">Could not reach /api/diagnose: {serverErr}</div>
          ) : serverData ? (
            <>
              <CheckList checks={serverData.env.checks} />
              <div className="mt-4 border-t border-nasij-secondary/40 pt-4">
                <div className="text-xs tracking-widest uppercase text-nasij-ink/55 mb-2">
                  Server test query (products count)
                </div>
                {serverData.testQuery?.skipped ? (
                  <div className="text-nasij-ink/60 text-sm">Skipped — env not configured.</div>
                ) : serverData.testQuery?.ok ? (
                  <div className="flex items-center gap-2 text-emerald-700 text-sm">
                    <CheckCircle2 size={16} />
                    Got {serverData.testQuery.productCount ?? 0} rows in {serverData.testQuery.durationMs} ms (HTTP {serverData.testQuery.httpStatus}).
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-red-700 text-sm">
                    <XCircle size={16} className="shrink-0 mt-0.5" />
                    <div className="font-mono text-xs leading-relaxed">
                      <div><strong>{serverData.testQuery?.error?.code || 'error'}:</strong> {serverData.testQuery?.error?.message}</div>
                      {serverData.testQuery?.error?.hint && <div className="opacity-70">hint: {serverData.testQuery.error.hint}</div>}
                      {serverData.testQuery?.error?.details && <div className="opacity-70">details: {serverData.testQuery.error.details}</div>}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 text-xs text-nasij-ink/55 flex flex-wrap gap-x-4">
                <span>Node env: <code className="font-mono">{serverData.nodeEnv}</code></span>
                <span>Runtime: <code className="font-mono">{serverData.nextRuntime}</code></span>
                <span>Checked: {new Date(serverData.timestamp).toLocaleTimeString()}</span>
              </div>
            </>
          ) : null}
        </Section>

        {/* Setup guide */}
        {!overallOk && <SetupGuide />}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl p-6 mb-4 border border-nasij-secondary/40">
      <h2 className="display-heading text-2xl text-nasij-primary mb-4">{title}</h2>
      {children}
    </div>
  );
}

function CheckList({ checks }: { checks: EnvCheck[] }) {
  return (
    <ul className="space-y-3">
      {checks.map((c) => (
        <li key={c.key} className="flex items-start gap-3">
          {c.level === 'ok' && <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />}
          {c.level === 'warn' && <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />}
          {c.level === 'error' && <XCircle size={18} className="text-red-600 shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <code className="font-mono text-sm text-nasij-ink">{c.key}</code>
              {c.preview && (
                <code className="font-mono text-xs text-nasij-ink/60 bg-nasij-cream/70 px-2 py-0.5 rounded">
                  {c.preview}
                </code>
              )}
            </div>
            <div className="text-sm text-nasij-ink/75 mt-1">{c.message}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SetupGuide() {
  return (
    <div className="bg-nasij-primary text-nasij-cream rounded-3xl p-6 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Terminal size={18} />
        <h3 className="display-heading text-xl">Fix Setup</h3>
      </div>
      <ol className="space-y-3 text-sm text-nasij-cream/90 leading-relaxed list-decimal list-inside">
        <li>
          Create <code className="font-mono bg-nasij-primary-dark/60 px-1.5 py-0.5 rounded">.env.local</code> at the
          project root (same folder as <code className="font-mono bg-nasij-primary-dark/60 px-1.5 py-0.5 rounded">package.json</code>).
        </li>
        <li>
          Paste your project's keys from{' '}
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="underline inline-flex items-center gap-1"
          >
            Supabase → Project Settings → API <ExternalLink size={11} />
          </a>
          :
          <pre className="bg-nasij-primary-dark/60 rounded-xl p-3 mt-2 text-xs overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...`}
          </pre>
        </li>
        <li>
          <strong>No quotes</strong> around values. <strong>No spaces</strong> around <code className="font-mono">=</code>.
        </li>
        <li>
          <strong>Restart the dev server</strong> after editing the file —{' '}
          <code className="font-mono bg-nasij-primary-dark/60 px-1.5 py-0.5 rounded">NEXT_PUBLIC_*</code> values are baked in at startup.
        </li>
        <li>
          In Supabase, verify your project is <strong>not paused</strong> (free-tier projects pause after a week of inactivity).
        </li>
        <li>Hit <strong>Re-run</strong> at the top of this page.</li>
      </ol>
    </div>
  );
}
