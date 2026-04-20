'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, Search } from 'lucide-react';
import { Logo } from './Logo';
import { useLocale } from '@/lib/i18n/provider';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { t, toggleLocale, locale } = useLocale();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    handler();
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { href: '#about', label: t.nav.about },
    { href: '#gallery', label: t.nav.gallery },
    { href: '#custom', label: t.nav.custom },
    { href: '#why', label: t.nav.why },
    { href: '#order', label: t.nav.order },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-nasij-cream/90 backdrop-blur-md border-b border-nasij-accent/20 py-2' : 'py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0"><Logo size="sm" animated="subtle" /></Link>

          <div className="hidden lg:flex items-center gap-7">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-nasij-ink/80 hover:text-nasij-primary transition-colors relative group"
              >
                {l.label}
                <span className="absolute -bottom-1 inset-x-0 mx-auto w-0 h-px bg-nasij-accent group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/track"
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-nasij-primary/80 hover:text-nasij-primary px-3 py-2 rounded-full hover:bg-nasij-secondary/40 transition-colors"
            >
              <Search size={14} /> {t.nav.track}
            </Link>
            <button
              onClick={toggleLocale}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-nasij-primary border border-nasij-primary/20 hover:border-nasij-primary px-3 py-2 rounded-full transition-colors"
              aria-label="Toggle language"
            >
              <Globe size={14} />
              {t.common.lang}
            </button>
            <a
              href="#custom"
              className="hidden sm:inline-flex text-sm bg-nasij-primary text-nasij-cream px-5 py-2.5 rounded-full hover:bg-nasij-primary-dark transition-colors"
            >
              {t.nav.cta}
            </a>
            <button className="lg:hidden text-nasij-primary p-2" onClick={() => setOpen(true)} aria-label="Menu">
              <Menu size={26} />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: locale === 'ar' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: locale === 'ar' ? '-100%' : '100%' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 bg-nasij-cream lg:hidden flex flex-col"
          >
            <div className="p-6 flex items-center justify-between">
              <Logo size="sm" animated="subtle" />
              <button onClick={() => setOpen(false)} className="text-nasij-primary p-2">
                <X size={26} />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center gap-7 px-6">
              {links.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="display-heading text-4xl text-nasij-primary"
                >
                  {l.label}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex gap-3 mt-4"
              >
                <Link href="/track" onClick={() => setOpen(false)} className="btn-outline">
                  <Search size={16} /> {t.nav.track}
                </Link>
                <button onClick={toggleLocale} className="btn-outline">
                  <Globe size={16} /> {t.common.lang}
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
