'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

/**
 * NASIJ logo.
 *
 * The logo image itself is NEVER recolored — colors stay 100% as-is.
 *
 * Animation modes:
 *   animated="subtle" — one faint ring, 60s rotation. For the navbar:
 *     visible motion but never distracting.
 *   animated={true}   — two opposing rings, 36s + 56s. For login / hero
 *     spots where handcrafted motion is part of the moment.
 *   animated={false}  — completely static (default).
 */
export function Logo({
  className = '',
  inverted = false,
  size = 'md',
  animated = false,
}: {
  className?: string;
  inverted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean | 'subtle';
}) {
  const h = { sm: 36, md: 46, lg: 64 }[size];

  const src = inverted ? '/nasij-logo-transparent.png' : '/nasij-logo-dark.png';

  const ImageEl = (
    <Image
      src={src}
      alt="NASIJ — نسيج"
      width={h * 2.5}
      height={h}
      priority
      className="object-contain"
      style={{ height: h, width: 'auto' }}
    />
  );

  if (!animated) {
    return <div className={`inline-flex items-center ${className}`}>{ImageEl}</div>;
  }

  const ringColor = inverted ? 'rgba(216,179,122,0.55)' : 'rgba(47,93,74,0.45)';

  if (animated === 'subtle') {
    const ringSize = h * 1.35;
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <motion.span
          aria-hidden
          className="absolute rounded-full pointer-events-none motion-reduce:hidden"
          style={{
            width: ringSize,
            height: ringSize,
            border: `1px dashed ${ringColor}`,
            opacity: 0.35,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, ease: 'linear', repeat: Infinity }}
        />
        <span className="relative">{ImageEl}</span>
      </div>
    );
  }

  const ringSize = h * 1.45;
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <motion.span
        aria-hidden
        className="absolute rounded-full pointer-events-none motion-reduce:hidden"
        style={{
          width: ringSize,
          height: ringSize,
          border: `1px dashed ${ringColor}`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 36, ease: 'linear', repeat: Infinity }}
      />
      <motion.span
        aria-hidden
        className="absolute rounded-full pointer-events-none motion-reduce:hidden"
        style={{
          width: ringSize * 1.18,
          height: ringSize * 1.18,
          border: `1px dotted ${ringColor}`,
          opacity: 0.5,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 56, ease: 'linear', repeat: Infinity }}
      />
      <span className="relative">{ImageEl}</span>
    </div>
  );
}
