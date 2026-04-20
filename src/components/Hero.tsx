'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useLocale } from '@/lib/i18n/provider';

export function Hero() {
  const { t, locale } = useLocale();
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  // Memoize the 48 warp-thread positions — pure geometry, never changes
  const warpThreads = useMemo(
    () => Array.from({ length: 24 }, (_, i) => 40 + i * (320 / 23)),
    []
  );

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-28 pb-36 md:pb-24 weave-bg">
      <div className="absolute inset-0 bg-thread-pattern opacity-40 pointer-events-none" />

      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute -end-40 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border-2 border-nasij-accent/30 hidden lg:block pointer-events-none"
      >
        <div className="absolute inset-8 rounded-full border border-nasij-primary/20" />
        <div className="absolute inset-16 rounded-full border border-nasij-accent/20" />
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center w-full">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 bg-nasij-secondary/60 border border-nasij-accent/40 px-4 py-1.5 rounded-full text-xs text-nasij-primary mb-8"
          >
            <Sparkles size={12} /> {t.hero.badge}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="display-heading text-5xl sm:text-6xl md:text-7xl lg:text-[6.5rem] text-nasij-primary leading-[1.1]"
          >
            {t.hero.titleLine1}
            <br />
            {t.hero.titleLine2}{' '}
            <span className="italic text-nasij-accent-dark">{t.hero.titleAccent}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="mt-8 max-w-md text-base md:text-lg text-nasij-ink/70 leading-relaxed"
          >
            {t.hero.desc}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <a href="#custom" className="btn-primary group">
              {t.hero.ctaPrimary}
              <Arrow size={18} className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </a>
            <a href="#gallery" className="btn-outline">{t.hero.ctaSecondary}</a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-12 md:mt-16 flex items-center gap-4 md:gap-6 text-xs text-nasij-ink/50 flex-wrap"
          >
            <span>{t.hero.step1}</span>
            <span className="w-6 md:w-8 h-px bg-nasij-accent" />
            <span>{t.hero.step2}</span>
            <span className="w-6 md:w-8 h-px bg-nasij-accent" />
            <span>{t.hero.step3}</span>
          </motion.div>
        </div>

        {/* Hero visual: NASIJ logo on a soft fabric-textured cream canvas with subtle float */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="relative hidden lg:block"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="relative aspect-square max-w-md ms-auto"
          >
            {/* Soft halo behind the canvas */}
            <div className="absolute -inset-6 rounded-[2.5rem] bg-nasij-accent/10 blur-3xl pointer-events-none" />

            {/* The fabric canvas — cream, textured, framed in soft accent threads */}
            <div
              className="relative w-full h-full rounded-[2rem] overflow-hidden border border-nasij-accent/30"
              style={{
                background:
                  'radial-gradient(circle at 30% 25%, #FFFBF1 0%, #FAF5EA 55%, #F2E6CA 100%)',
                boxShadow:
                  '0 30px 80px -30px rgba(47,93,74,0.25), inset 0 0 0 1px rgba(216,179,122,0.15)',
              }}
            >
              {/* Woven fabric texture — vertical + horizontal threads */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.35] pointer-events-none"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(0deg, transparent 0 3px, rgba(216,179,122,0.18) 3px 4px),
                    repeating-linear-gradient(90deg, transparent 0 3px, rgba(47,93,74,0.10) 3px 4px)
                  `,
                }}
              />

              {/* Inner thread frame */}
              <div className="absolute inset-5 rounded-[1.5rem] border border-dashed border-nasij-accent/40 pointer-events-none" />

              {/* Top + bottom warp threads — keep the woven feel from the original */}
              <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full pointer-events-none">
                {warpThreads.map((x, i) => (
                  <line
                    key={`t-${i}`}
                    x1={x}
                    y1="32"
                    x2={x}
                    y2="14"
                    stroke="#D8B37A"
                    strokeWidth="1.2"
                    opacity="0.7"
                  />
                ))}
                {warpThreads.map((x, i) => (
                  <line
                    key={`b-${i}`}
                    x1={x}
                    y1="368"
                    x2={x}
                    y2="386"
                    stroke="#D8B37A"
                    strokeWidth="1.2"
                    opacity="0.7"
                  />
                ))}
              </svg>

              {/* The NASIJ logo — original colors, just placed nicely */}
              <div className="absolute inset-0 flex items-center justify-center p-14">
                <Image
                  src="/nasij-logo-dark.png"
                  alt="NASIJ — نسيج"
                  width={520}
                  height={520}
                  priority
                  className="w-full h-auto object-contain max-h-[70%] drop-shadow-[0_8px_24px_rgba(47,93,74,0.18)]"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
