'use client';

import { useEffect, useState } from 'react';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { About } from '@/components/About';
import { Gallery } from '@/components/Gallery';
import { CustomBuilder } from '@/components/CustomBuilder';
import { WhyNasij } from '@/components/WhyNasij';
import { Footer } from '@/components/Footer';
import { useLocale } from '@/lib/i18n/provider';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function Home() {
  const { t, locale } = useLocale();
  const [showSticky, setShowSticky] = useState(false);
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY;
      const h = window.innerHeight;
      // show after scrolling past hero, hide near bottom (footer / forms have own CTAs)
      const max = document.documentElement.scrollHeight - h - 800;
      setShowSticky(y > h * 0.6 && y < max);
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <main className="relative">
      <Nav />
      <Hero />
      <About />
      <Gallery />
      <CustomBuilder />
      <WhyNasij />
      <Footer />

      {/* Sticky mobile CTA */}
      <AnimatePresence>
        {showSticky && (
          <motion.a
            href="#custom"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="sticky-mobile-cta bg-nasij-primary text-nasij-cream rounded-full py-4 px-6 flex items-center justify-center gap-2 font-medium"
          >
            {t.hero.ctaPrimary}
            <Arrow size={18} className="rtl:rotate-180" />
          </motion.a>
        )}
      </AnimatePresence>
    </main>
  );
}
