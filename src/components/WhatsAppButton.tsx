'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

const PHONE = '201010759640';
const MESSAGE = 'مرحبا، أريد الاستفسار عن تصميم سجاد من نسيج';
const HREF = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;

/**
 * Floating WhatsApp CTA. Fixed bottom-right (visually — for an RTL site that
 * means inset-inline-end:bottom). Hidden on /dashboard so it doesn't cover
 * admin UI, and lifted on mobile to clear the sticky CTA on the home page.
 */
export function WhatsAppButton() {
  const pathname = usePathname() || '/';

  // Don't show inside the admin
  if (pathname.startsWith('/dashboard')) return null;

  // On the homepage, the sticky mobile CTA sits at the bottom-center of mobile
  // screens. Lift this button slightly on mobile when on the homepage.
  const isHome = pathname === '/';

  return (
    <motion.a
      href={HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp — تواصل معنا"
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 240, delay: 0.6 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className={`group fixed end-5 z-[60] inline-flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.6)] hover:bg-[#1ebe57] transition-colors w-14 h-14 md:w-16 md:h-16 ${
        isHome ? 'bottom-24 md:bottom-6' : 'bottom-6'
      }`}
    >
      {/* Soft pulsing ring */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-wa-pulse pointer-events-none"
      />

      {/* Inline SVG (no extra dependency) */}
      <svg
        viewBox="0 0 32 32"
        className="relative w-7 h-7 md:w-8 md:h-8"
        fill="currentColor"
        aria-hidden
      >
        <path d="M16.003 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.46 1.74 6.4l-1.83 6.69 6.86-1.8a12.77 12.77 0 0 0 6.03 1.53h.01c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.82-12.8-12.82Zm0 23.36h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-4.07 1.07 1.09-3.97-.25-.41A10.59 10.59 0 0 1 5.4 16c0-5.85 4.76-10.61 10.6-10.61 2.83 0 5.5 1.1 7.5 3.11a10.55 10.55 0 0 1 3.1 7.5c0 5.85-4.75 10.56-10.6 10.56Zm5.83-7.95c-.32-.16-1.9-.94-2.19-1.05-.3-.1-.51-.16-.73.16-.21.32-.84 1.05-1.03 1.27-.19.21-.38.24-.7.08-.32-.16-1.36-.5-2.59-1.6a9.78 9.78 0 0 1-1.79-2.23c-.19-.32-.02-.5.14-.66.14-.14.32-.38.48-.56.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.73-1.76-1-2.4-.26-.63-.53-.55-.73-.56-.19-.01-.4-.01-.62-.01-.21 0-.56.08-.85.4-.29.32-1.11 1.08-1.11 2.64s1.14 3.06 1.3 3.27c.16.21 2.25 3.43 5.45 4.81.76.33 1.36.53 1.82.68.77.24 1.46.21 2.01.13.61-.09 1.9-.78 2.16-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37Z" />
      </svg>

      <style jsx>{`
        @keyframes wa-pulse {
          0% { transform: scale(1); opacity: 0.55; }
          70% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-wa-pulse { animation: wa-pulse 2.4s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-wa-pulse { animation: none; }
        }
      `}</style>
    </motion.a>
  );
}
