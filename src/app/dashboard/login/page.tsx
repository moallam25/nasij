'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';

/**
 * Map raw Supabase / network errors to actionable messages. The infamous
 * "TypeError: Failed to fetch" is almost always one of:
 *   - missing or wrong NEXT_PUBLIC_SUPABASE_URL
 *   - Supabase project is paused
 *   - corporate firewall / ad-blocker / DNS issue
 *   - CORS misconfig (rare with @supabase/ssr)
 */
function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
    return 'Cannot reach Supabase. Check your internet connection and that NEXT_PUBLIC_SUPABASE_URL is correct in .env.local. Make sure your Supabase project is not paused.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'Wrong email or password. If this is your first time, create the admin user in Supabase Auth → Users first.';
  }
  if (lower.includes('email not confirmed')) {
    return 'This email has not been confirmed in Supabase. Confirm it from Supabase Auth → Users.';
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many sign-in attempts. Wait a minute and try again.';
  }
  if (lower.includes('supabase env missing')) {
    return msg;
  }
  return msg || 'Sign-in failed. Check the console for details.';
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envOk, setEnvOk] = useState<boolean | null>(null);

  useEffect(() => {
    const ok = isSupabaseConfigured();
    setEnvOk(ok);
    if (!ok) {
      setError(
        'Supabase env vars are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart the dev server.'
      );
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPwd = password;
    if (!trimmedEmail || !trimmedPwd) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPwd,
      });

      if (authError) {
        const friendly = friendlyError(authError);
        console.error('[login] auth error:', authError);
        setError(friendly);
        toast.error(friendly, { duration: 5000 });
        setLoading(false);
        return;
      }

      if (!data?.session) {
        setError('Sign-in succeeded but no session was returned. Try again.');
        setLoading(false);
        return;
      }

      toast.success('Welcome back');
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      const friendly = friendlyError(e);
      console.error('[login] caught:', e);
      setError(friendly);
      toast.error(friendly, { duration: 5000 });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 weave-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Logo animated />
        </div>

        <form
          onSubmit={submit}
          className="bg-nasij-cream border border-nasij-accent/20 rounded-3xl p-8 shadow-xl space-y-4"
          noValidate
        >
          <div className="text-center mb-4">
            <h1 className="display-heading text-3xl text-nasij-primary">Admin Dashboard</h1>
            <p className="text-sm text-nasij-ink/50 mt-1">Sign in to manage orders & products</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-2xl p-3 text-sm"
              role="alert"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </motion.div>
          )}

          {envOk === false && (
            <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 leading-relaxed">
              <strong>Setup needed:</strong> create <code className="bg-white px-1 rounded">.env.local</code> at the project root with:
              <pre className="mt-2 text-[10px] bg-white p-2 rounded overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...`}
              </pre>
            </div>
          )}

          <input
            type="email"
            className="field"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={loading}
            dir="ltr"
          />

          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              className="field pe-12"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute end-3 top-1/2 -translate-y-1/2 p-2 text-nasij-ink/50 hover:text-nasij-primary transition-colors"
              tabIndex={-1}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || envOk === false}
            className="btn-primary w-full justify-center"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <p className="text-xs text-center text-nasij-ink/40 pt-2">
            Create an admin user in Supabase Auth → Users first.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
