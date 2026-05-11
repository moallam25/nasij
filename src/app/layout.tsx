import type { Metadata } from 'next';
import { Fraunces, Outfit, Cairo, Noto_Kufi_Arabic } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { LocaleProvider } from '@/lib/i18n/provider';
import { StoreShell } from '@/components/StoreShell';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { SetupBanner } from '@/components/SetupBanner';
import { OneSignalInit } from '@/components/OneSignalInit';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });
const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cairo',
  display: 'swap',
});
const notoKufi = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-noto-kufi',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NASIJ — نسيج | سجاد منقوش يدوياً',
  description: 'نسيج براند مصري بيحول تصميماتك لسجاد حقيقي مصنوع بإيد حرفيين.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${fraunces.variable} ${outfit.variable} ${cairo.variable} ${notoKufi.variable}`}
    >
      <body>
        <SetupBanner />
        <LocaleProvider>
          <StoreShell>
            {children}
          </StoreShell>
          <WhatsAppButton />
          <OneSignalInit />
          <SpeedInsights />
          <Analytics />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#2F5D4A',
                color: '#FAF5EA',
                borderRadius: '999px',
                padding: '12px 24px',
                fontSize: '14px',
                fontFamily: 'var(--font-cairo), var(--font-outfit), sans-serif',
              },
            }}
          />
        </LocaleProvider>
      </body>
    </html>
  );
}
