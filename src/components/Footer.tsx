'use client';

import React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Logo } from './Logo';
import { useLocale } from '@/lib/i18n/provider';

const SOCIALS = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/nasij_eg/',
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com/@nasij_eg?lang=en',
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61589478241839',
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
];

export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="bg-nasij-primary-dark text-nasij-cream relative overflow-hidden">
      <div className="absolute inset-0 bg-thread-pattern opacity-10" />

      <div className="relative py-6 overflow-hidden border-y border-nasij-accent/20">
        <div className="flex whitespace-nowrap animate-marquee">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-12 px-6">
              {['نسيج', 'Handmade', 'صناعة يدوية', 'One of one', 'NASIJ'].map((w, j) => (
                <span key={`${i}-${j}`} className="display-heading italic text-3xl md:text-4xl text-nasij-accent">
                  {w} <span className="text-nasij-cream/40 mx-6">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-14 md:py-16 grid md:grid-cols-3 gap-10">
        <div className="md:col-span-1">
          <Logo inverted size="md" />
          <p className="mt-6 max-w-sm text-nasij-cream/60 text-sm leading-relaxed">{t.footer.desc}</p>
        </div>

        <div>
          <div className="text-xs tracking-wide text-nasij-accent mb-4">{t.footer.explore}</div>
          <ul className="space-y-2 text-sm text-nasij-cream/70">
            <li><a href="#about" className="hover:text-nasij-accent transition-colors">{t.nav.about}</a></li>
            <li><a href="#gallery" className="hover:text-nasij-accent transition-colors">{t.nav.gallery}</a></li>
            <li><a href="#custom" className="hover:text-nasij-accent transition-colors">{t.nav.custom}</a></li>
            <li><a href="#order" className="hover:text-nasij-accent transition-colors">{t.nav.order}</a></li>
            <li>
              <Link href="/track" className="hover:text-nasij-accent transition-colors inline-flex items-center gap-1.5">
                <Search size={12} /> {t.nav.track}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-xs tracking-wide text-nasij-accent mb-4">{t.footer.follow}</div>
          <div className="flex gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="w-11 h-11 rounded-full border border-nasij-cream/20 hover:border-nasij-accent hover:bg-nasij-accent hover:text-nasij-primary-dark text-nasij-cream/80 flex items-center justify-center transition-all"
              >
                <s.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
          <div className="mt-6 text-xs text-nasij-cream/50 leading-relaxed">
            @nasij_eg
          </div>
        </div>
      </div>

      <div className="relative border-t border-nasij-accent/20 py-6 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-nasij-cream/50">
        <div>© {new Date().getFullYear()} NASIJ — {t.footer.rights}</div>
        <div>{t.footer.crafted}</div>
      </div>
    </footer>
  );
}
