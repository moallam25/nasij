'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, Search } from 'lucide-react';
import { Logo } from './Logo';
import { useLocale } from '@/lib/i18n/provider';

// Must match the id="" attributes on each page section, in document order.
const SECTION_IDS = ['about', 'gallery', 'custom', 'why', 'order'];

export function Nav() {
  const [scrolled, setScrolled]           = useState(false);
  const [open, setOpen]                   = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const { t, toggleLocale, locale }       = useLocale();

  // Navbar background on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Active section tracker — passive scroll listener, O(n) sections per frame.
  // A section is "active" when its top edge has crossed 35% down from the
  // viewport top. We keep iterating in DOM order so the LAST qualifying
  // section wins (i.e. the one closest to / already past the trigger line).
  useEffect(() => {
    const TRIGGER = 0.35;

    const update = () => {
      const th = window.innerHeight * TRIGGER;
      let active = '';
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= th) active = `#${id}`;
      }
      setActiveSection(active);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const links = [
    { href: '#about',   label: t.nav.about   },
    { href: '#gallery', label: t.nav.gallery  },
    { href: '#custom',  label: t.nav.custom   },
    { href: '#why',     label: t.nav.why      },
    { href: '#order',   label: t.nav.order    },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-nasij-cream/90 backdrop-blur-md border-b border-nasij-accent/20 py-2'
            : 'py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Logo size="sm" animated="subtle" />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-7">
            {links.map((l) => {
              const isActive = activeSection === l.href;
              return (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setActiveSection(l.href)}
                  className={`relative py-1 text-sm transition-colors duration-200 group ${
                    isActive
                      ? 'text-nasij-primary font-medium'
                      : 'text-nasij-ink/70 hover:text-nasij-primary'
                  }`}
                >
                  {l.label}

                  {/* Active indicator — layoutId makes it spring between links */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-line"
                      className="absolute -bottom-0.5 inset-x-0 h-[2px] bg-nasij-accent rounded-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  {/* Hover underline — only shown when not active */}
                  {!isActive && (
                    <span className="absolute -bottom-0.5 inset-x-0 h-[2px] rounded-full bg-nasij-accent/40 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
                  )}
                </a>
              );
            })}
          </div>

          {/* Right controls — CTA removed */}
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
            <button
              className="lg:hidden text-nasij-primary p-2"
              onClick={() => setOpen(true)}
              aria-label="Menu"
            >
              <Menu size={26} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
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
              {links.map((l, i) => {
                const isActive = activeSection === l.href;
                return (
                  <motion.a
                    key={l.href}
                    href={l.href}
                    onClick={() => { setActiveSection(l.href); setOpen(false); }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                    className={`display-heading text-4xl transition-colors inline-flex items-center gap-3 ${
                      isActive ? 'text-nasij-accent-dark' : 'text-nasij-primary'
                    }`}
                  >
                    {l.label}
                    {/* Dot indicator for active item in mobile menu */}
                    {isActive && (
                      <motion.span
                        layoutId="mobile-active-dot"
                        className="w-2 h-2 rounded-full bg-nasij-accent shrink-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      />
                    )}
                  </motion.a>
                );
              })}

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
