'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const body = await res.json();

      if (!res.ok) {
        const msg = body?.error || 'Sign-in failed.';
        setError(msg);
        toast.error(msg, { duration: 5000 });
        setLoading(false);
        return;
      }

      toast.success('Welcome back');
      router.push(next);
      router.refresh();
    } catch {
      const msg = 'Network error — check your connection.';
      setError(msg);
      toast.error(msg, { duration: 5000 });
      setLoading(false);
    }
  };

  return (
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
        disabled={loading}
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
    </form>
  );
}

export default function LoginPage() {
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
        <Suspense>
          <LoginForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
