'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { RopeDivider } from './RopeDivider';
import { useLocale } from '@/lib/i18n/provider';

export function About() {
  const { t } = useLocale();
  return (
    <section id="about" className="relative py-24 md:py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="text-xs tracking-wide text-nasij-accent-dark mb-4">{t.about.kicker}</div>
          <h2 className="display-heading text-4xl md:text-6xl lg:text-7xl text-nasij-primary">
            {t.about.title1}
            <br />
            <span className="italic text-nasij-accent-dark">{t.about.title2}</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Fabric-textured cream canvas — replaces the prior green block */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-nasij-accent/30"
              style={{
                background:
                  'radial-gradient(ellipse at 35% 25%, #FFFBF1 0%, #FAF5EA 55%, #EFE2C2 100%)',
                boxShadow:
                  '0 30px 80px -30px rgba(47,93,74,0.22), inset 0 0 0 1px rgba(216,179,122,0.18)',
              }}
            >
              {/* Woven warp + weft thread texture */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.32] pointer-events-none"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(0deg, transparent 0 3px, rgba(216,179,122,0.22) 3px 4px),
                    repeating-linear-gradient(90deg, transparent 0 3px, rgba(47,93,74,0.10) 3px 4px)
                  `,
                }}
              />

              {/* Diagonal woven highlight */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-30 pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, transparent 0 6px, rgba(184,147,90,0.18) 6px 7px)',
                }}
              />

              {/* Inner thread frame */}
              <div className="absolute inset-5 rounded-[1.5rem] border border-dashed border-nasij-accent/40 pointer-events-none" />

              {/* Subtle warp threads at top + bottom (matches Hero language) */}
              <svg
                viewBox="0 0 400 500"
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
              >
                {Array.from({ length: 22 }).map((_, i) => (
                  <line
                    key={`t-${i}`}
                    x1={40 + i * (320 / 21)}
                    y1="32"
                    x2={40 + i * (320 / 21)}
                    y2="14"
                    stroke="#D8B37A"
                    strokeWidth="1.1"
                    opacity="0.65"
                  />
                ))}
                {Array.from({ length: 22 }).map((_, i) => (
                  <line
                    key={`b-${i}`}
                    x1={40 + i * (320 / 21)}
                    y1="468"
                    x2={40 + i * (320 / 21)}
                    y2="486"
                    stroke="#D8B37A"
                    strokeWidth="1.1"
                    opacity="0.65"
                  />
                ))}
              </svg>

              {/* The NASIJ logo — original colors, untouched */}
              <div className="absolute inset-0 flex items-center justify-center p-12">
                <Image
                  src="/nasij-logo-dark.png"
                  alt="NASIJ — نسيج"
                  width={520}
                  height={520}
                  className="w-full h-auto object-contain max-h-[72%] drop-shadow-[0_8px_24px_rgba(47,93,74,0.18)]"
                />
              </div>

              {/* Tiny corner badge — handcrafted detail */}
              <div className="absolute bottom-5 end-5 flex items-center gap-1.5 bg-white/70 backdrop-blur rounded-full px-3 py-1 text-[10px] tracking-[0.2em] text-nasij-primary/80 border border-nasij-accent/30">
                <span className="w-1.5 h-1.5 rounded-full bg-nasij-accent" />
                HANDMADE
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            <p className="text-lg md:text-xl text-nasij-ink/85 leading-relaxed">{t.about.p1}</p>
            <p className="text-base md:text-lg text-nasij-ink/70 leading-relaxed">{t.about.p2}</p>
            <p className="text-base md:text-lg text-nasij-ink/70 leading-relaxed">{t.about.p3}</p>

            <div className="pt-6 grid grid-cols-3 gap-4 md:gap-6 border-t border-nasij-accent/20">
              <Stat n={t.about.stat1n} l={t.about.stat1l} />
              <Stat n={t.about.stat2n} l={t.about.stat2l} />
              <Stat n={t.about.stat3n} l={t.about.stat3l} />
            </div>
          </motion.div>
        </div>
      </div>
      <RopeDivider className="mt-20" />
    </section>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="display-heading text-2xl md:text-3xl text-nasij-primary">{n}</div>
      <div className="text-[10px] tracking-wide text-nasij-ink/50 mt-2">{l}</div>
    </div>
  );
}
