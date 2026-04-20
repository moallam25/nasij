'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Search } from 'lucide-react';
import { Suspense } from 'react';
import { useLocale } from '@/lib/i18n/provider';

function SuccessInner() {
  const params = useSearchParams();
  const code = params.get('code');
  const { t, locale } = useLocale();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 weave-bg">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full bg-nasij-cream rounded-3xl shadow-2xl border border-nasij-accent/30 p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 12 }}
          className="w-20 h-20 mx-auto bg-emerald-500 rounded-full flex items-center justify-center mb-6"
        >
          <Check className="text-white" size={36} strokeWidth={3} />
        </motion.div>

        <h1 className="display-heading text-3xl text-nasij-primary mb-3">
          {locale === 'ar' ? 'تم الدفع بنجاح' : 'Payment successful'}
        </h1>
        <p className="text-nasij-ink/70 leading-relaxed">
          {locale === 'ar'
            ? 'استلمنا دفعتك. هنبدأ نسج سجادتك ونبعتلك تحديثات.'
            : 'We received your payment. We\'ll begin crafting your rug and send you updates.'}
        </p>

        {code && (
          <div className="bg-nasij-secondary/40 rounded-2xl p-4 my-6">
            <div className="text-[10px] tracking-wide text-nasij-ink/50">
              {locale === 'ar' ? 'كود الطلب' : 'Order Code'}
            </div>
            <div className="display-heading text-2xl text-nasij-primary tracking-wider mt-1" dir="ltr">
              {code}
            </div>
          </div>
        )}

        <Link
          href={`/track?code=${code || ''}`}
          className="btn-primary w-full justify-center"
        >
          <Search size={16} />
          {locale === 'ar' ? 'تتبع طلبك' : 'Track your order'}
        </Link>

        <Link href="/" className="block mt-4 text-sm text-nasij-ink/50 hover:text-nasij-primary">
          {locale === 'ar' ? '← العودة للرئيسية' : '← Back to home'}
        </Link>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="loom-loader" /></div>}>
      <SuccessInner />
    </Suspense>
  );
}
