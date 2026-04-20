'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/provider';

export function OrderSuccessModal({
  open,
  onClose,
  orderCode,
}: {
  open: boolean;
  onClose: () => void;
  orderCode: string | null;
}) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!orderCode) return;
    await navigator.clipboard.writeText(orderCode);
    setCopied(true);
    toast.success(t.confirm.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {open && orderCode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-nasij-ink/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-nasij-cream rounded-[2rem] max-w-md w-full overflow-hidden shadow-2xl"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 end-4 z-10 w-9 h-9 rounded-full bg-nasij-secondary/50 hover:bg-nasij-secondary flex items-center justify-center transition-colors"
              aria-label="close"
            >
              <X size={16} className="text-nasij-primary" />
            </button>

            {/* Top decorative band */}
            <div className="relative h-32 bg-nasij-primary overflow-hidden">
              <div className="absolute inset-0 bg-thread-pattern opacity-30" />
              {/* Animated checkmark */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 12 }}
                className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-nasij-cream border-4 border-nasij-accent flex items-center justify-center shadow-xl"
              >
                <motion.svg
                  width="36" height="36" viewBox="0 0 36 36" fill="none"
                >
                  <motion.path
                    d="M8 18 L15 25 L28 11"
                    stroke="#2F5D4A"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
                  />
                </motion.svg>
              </motion.div>

              {/* Confetti dots */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    background: i % 2 ? '#D8B37A' : '#EAD9B6',
                    left: `${(i * 8.3) % 100}%`,
                    top: `${20 + (i * 7) % 60}%`,
                  }}
                  initial={{ scale: 0, y: 0 }}
                  animate={{ scale: [0, 1, 0], y: [0, -30, -60] }}
                  transition={{ delay: 0.4 + i * 0.05, duration: 1.5 }}
                />
              ))}
            </div>

            {/* Body */}
            <div className="px-8 pt-16 pb-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="display-heading text-2xl text-nasij-primary leading-snug">
                  {t.confirm.thanks} <span className="text-nasij-accent-dark">❤</span>
                </div>
                <p className="text-sm text-nasij-ink/60 mt-2">{t.confirm.received}</p>
              </motion.div>

              {/* Code box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.85 }}
                className="mt-6 bg-nasij-secondary/50 border-2 border-dashed border-nasij-accent rounded-2xl p-5"
              >
                <div className="text-[10px] uppercase tracking-[0.3em] text-nasij-primary/60 mb-1">
                  {t.confirm.code}
                </div>
                <div className="display-heading text-3xl text-nasij-primary tracking-wider" dir="ltr">
                  {orderCode}
                </div>
                <button
                  onClick={copy}
                  className="mt-3 inline-flex items-center gap-2 text-xs text-nasij-primary hover:text-nasij-primary-dark transition-colors"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? t.confirm.copied : t.confirm.copyCode}
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-5 space-y-1 text-sm text-nasij-ink/70"
              >
                <p>{t.confirm.reviewing}</p>
                <p>{t.confirm.contact}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.15 }}
                className="mt-4 text-[11px] text-nasij-ink/40"
              >
                {t.confirm.saveCode}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                className="mt-6 flex flex-col sm:flex-row gap-2"
              >
                <Link
                  href={`/track?code=${orderCode}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-nasij-primary text-nasij-cream rounded-full py-3 text-sm font-medium hover:bg-nasij-primary-dark transition-colors"
                >
                  <Search size={16} />
                  {t.confirm.track}
                </Link>
                <button
                  onClick={onClose}
                  className="flex-1 border-2 border-nasij-primary/20 text-nasij-primary rounded-full py-3 text-sm font-medium hover:bg-nasij-secondary/40 transition-colors"
                >
                  {t.confirm.close}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
