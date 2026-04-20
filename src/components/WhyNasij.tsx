'use client';

import { motion } from 'framer-motion';
import { Scissors, Heart, Package, Sparkles } from 'lucide-react';
import { RopeDivider } from './RopeDivider';
import { useLocale } from '@/lib/i18n/provider';

export function WhyNasij() {
  const { t } = useLocale();

  const items = [
    { icon: Scissors, title: t.why.i1t, desc: t.why.i1d },
    { icon: Heart, title: t.why.i2t, desc: t.why.i2d },
    { icon: Sparkles, title: t.why.i3t, desc: t.why.i3d },
    { icon: Package, title: t.why.i4t, desc: t.why.i4d },
  ];

  return (
    <section id="why" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="text-xs tracking-wide text-nasij-accent-dark mb-4">{t.why.kicker}</div>
          <h2 className="display-heading text-5xl md:text-7xl text-nasij-primary">
            {t.why.title1}
            <br />
            <span className="italic text-nasij-accent-dark">{t.why.title2}</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group relative bg-nasij-cream border border-nasij-accent/20 rounded-3xl p-8 hover:border-nasij-primary/40 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-nasij-secondary flex items-center justify-center mb-6 group-hover:bg-nasij-primary transition-all">
                <item.icon size={24} className="text-nasij-primary group-hover:text-nasij-cream transition-colors" />
              </div>
              <div className="display-heading text-2xl text-nasij-primary mb-3">{item.title}</div>
              <p className="text-sm text-nasij-ink/60 leading-relaxed">{item.desc}</p>
              <div className="absolute top-6 end-6 text-xs text-nasij-accent-dark/60 display-heading">0{i + 1}</div>
            </motion.div>
          ))}
        </div>
      </div>
      <RopeDivider className="mt-24" />
    </section>
  );
}
