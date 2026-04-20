'use client';
import { motion } from 'framer-motion';

export function RopeDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-6 py-8 ${className}`}>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="flex-1 h-6 rope-divider origin-right"
      />
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
        <circle cx="14" cy="14" r="12" stroke="#D8B37A" strokeWidth="1" />
        <circle cx="14" cy="14" r="4" fill="#2F5D4A" />
        <circle cx="14" cy="14" r="1.5" fill="#D8B37A" />
      </svg>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="flex-1 h-6 rope-divider origin-left"
      />
    </div>
  );
}
