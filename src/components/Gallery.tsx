'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { X, Sparkles, ArrowUpRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { RopeDivider } from './RopeDivider';
import { useLocale } from '@/lib/i18n/provider';

type Product = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  description: string | null;
  category: string | null;
};

const FALLBACK_CATEGORY = 'all';

// Animation timings — soft + premium, never aggressive
const cardSpring = { type: 'spring' as const, damping: 26, stiffness: 240, mass: 0.6 };

export function Gallery() {
  const { t } = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(FALLBACK_CATEGORY);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      setProducts((data || []) as Product[]);
      setLoading(false);
    };
    load();
  }, []);

  // Build the category list dynamically from the products in the DB so admins
  // can add new categories simply by setting `category` on a product.
  const categoryList = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      const c = (p.category || FALLBACK_CATEGORY).trim().toLowerCase();
      if (c && c !== FALLBACK_CATEGORY) set.add(c);
    }
    return [FALLBACK_CATEGORY, ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    if (activeCategory === FALLBACK_CATEGORY) return products;
    return products.filter(
      (p) => (p.category || FALLBACK_CATEGORY).toLowerCase() === activeCategory
    );
  }, [products, activeCategory]);

  // Pretty label for a category — try i18n dictionary, fall back to capitalized id
  const labelFor = (cat: string) => {
    const dict = (t.gallery as any).categories as Record<string, string> | undefined;
    if (dict && dict[cat]) return dict[cat];
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  return (
    <section id="gallery" className="relative py-28 md:py-36 px-6 bg-nasij-secondary-light overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex items-end justify-between flex-wrap gap-6 mb-10"
        >
          <div>
            <div className="text-xs tracking-[0.2em] text-nasij-accent-dark mb-4 uppercase">
              {t.gallery.kicker}
            </div>
            <h2 className="display-heading text-5xl md:text-7xl text-nasij-primary leading-tight">
              {t.gallery.title1}
              <br />
              <span className="italic">{t.gallery.title2}</span>
            </h2>
          </div>
          <p className="max-w-sm text-base text-nasij-ink/75 leading-relaxed">{t.gallery.desc}</p>
        </motion.div>

        {/* Category filter pills */}
        {!loading && categoryList.length > 1 && (
          <LayoutGroup id="gallery-filter">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex items-center gap-2 flex-wrap mb-10"
              role="tablist"
              aria-label="Product categories"
            >
              {categoryList.map((cat) => {
                const isActive = activeCategory === cat;
                const count =
                  cat === FALLBACK_CATEGORY
                    ? products.length
                    : products.filter((p) => (p.category || FALLBACK_CATEGORY).toLowerCase() === cat).length;
                return (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveCategory(cat)}
                    className={`relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-nasij-cream'
                        : 'text-nasij-ink/75 hover:text-nasij-primary'
                    }`}
                  >
                    {/* Sliding pill background — only on the active tab */}
                    {isActive && (
                      <motion.span
                        layoutId="filter-pill"
                        className="absolute inset-0 rounded-full bg-nasij-primary shadow-[0_8px_24px_-8px_rgba(47,93,74,0.4)]"
                        transition={cardSpring}
                      />
                    )}
                    <span className="relative z-10">{labelFor(cat)}</span>
                    <span
                      className={`relative z-10 text-[10px] px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-nasij-cream/20 text-nasij-cream' : 'bg-nasij-secondary/60 text-nasij-ink/60'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </LayoutGroup>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-24">
            <span className="loom-loader" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 text-nasij-ink/55 text-base">{t.gallery.empty}</div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 text-nasij-ink/55 text-base"
          >
            {(t.gallery as any).emptyFiltered || t.gallery.empty}
          </motion.div>
        ) : (
          <LayoutGroup id="gallery-grid">
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    index={i}
                    onClick={() => setSelected(p)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <ProductModal
            product={selected}
            onClose={() => setSelected(null)}
            handmadeLabel={t.gallery.handmade}
            inquireLabel={t.gallery.inquire}
            customLabel={t.gallery.custom}
          />
        )}
      </AnimatePresence>

      <RopeDivider className="mt-24" />
    </section>
  );
}

// --------------------------------------------------------------
// Card — equal aspect ratio, no asymmetric "featured" sizing
// --------------------------------------------------------------
function ProductCard({
  product,
  index,
  onClick,
}: {
  product: Product;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      layout
      // Only the first 8 cards animate in on initial load — past that, the
      // user is scrolling/filtering and we keep things instant.
      initial={index < 8 ? { opacity: 0, y: 30 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
      transition={{ ...cardSpring, delay: index < 8 ? Math.min(index * 0.04, 0.32) : 0 }}
      whileHover={{ y: -6 }}
      onClick={onClick}
      aria-label={`Open ${product.name}`}
      className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-nasij-primary text-start cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-nasij-accent focus-visible:ring-offset-4 focus-visible:ring-offset-nasij-secondary-light"
    >
      {product.image ? (
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          loading={index < 4 ? 'eager' : 'lazy'}
          className="object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.06]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-nasij-primary to-nasij-primary-dark" />
      )}

      {/* Bottom gradient veil — content reads on top of imagery */}
      <div className="absolute inset-0 bg-gradient-to-t from-nasij-ink/85 via-nasij-ink/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />

      {/* Top-right hover hint */}
      <div className="absolute top-4 end-4 w-9 h-9 rounded-full bg-nasij-cream/90 backdrop-blur flex items-center justify-center opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
        <ArrowUpRight size={16} className="text-nasij-primary" />
      </div>

      {/* Caption */}
      <div className="absolute bottom-0 inset-x-0 p-5 md:p-6 text-nasij-cream">
        <div className="display-heading text-xl md:text-2xl leading-tight line-clamp-2 transition-transform duration-500 group-hover:-translate-y-0.5">
          {product.name}
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="text-sm text-nasij-accent font-medium">
            {Number(product.price).toLocaleString('en-US')}{' '}
            <span className="opacity-70 text-xs">EGP</span>
          </div>
          {product.category && product.category !== FALLBACK_CATEGORY && (
            <div className="text-[10px] tracking-wider uppercase text-nasij-cream/70 bg-nasij-cream/10 px-2 py-0.5 rounded-full backdrop-blur">
              {product.category}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// --------------------------------------------------------------
// Modal
// --------------------------------------------------------------
function ProductModal({
  product,
  onClose,
  handmadeLabel,
  inquireLabel,
  customLabel,
}: {
  product: Product;
  onClose: () => void;
  handmadeLabel: string;
  inquireLabel: string;
  customLabel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-nasij-ink/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={cardSpring}
        className="relative bg-nasij-cream rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] grid md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 z-10 w-10 h-10 rounded-full bg-nasij-cream/90 hover:bg-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
          aria-label="Close"
        >
          <X size={18} className="text-nasij-primary" />
        </button>

        <div className="relative aspect-square md:aspect-auto bg-nasij-primary">
          {product.image && (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          )}
        </div>

        <div className="p-7 md:p-10 flex flex-col overflow-y-auto">
          <div className="flex items-center gap-2 text-xs tracking-wider text-nasij-accent-dark">
            <Sparkles size={12} /> {handmadeLabel}
          </div>
          <h3 className="display-heading text-3xl md:text-4xl text-nasij-primary mt-3 leading-tight">
            {product.name}
          </h3>
          <div className="display-heading text-2xl text-nasij-accent-dark mt-3">
            {Number(product.price).toLocaleString('en-US')}{' '}
            <span className="text-base text-nasij-ink/55">EGP</span>
          </div>

          {product.category && product.category !== FALLBACK_CATEGORY && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs tracking-wider uppercase text-nasij-primary bg-nasij-secondary/60 px-3 py-1 rounded-full self-start">
              {product.category}
            </div>
          )}

          {product.description && (
            <p className="mt-6 text-base text-nasij-ink/75 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="mt-auto pt-8 flex gap-3">
            <a href="#order" onClick={onClose} className="btn-primary flex-1 justify-center">
              {inquireLabel}
            </a>
            <a href="#custom" onClick={onClose} className="btn-outline flex-1 justify-center">
              {customLabel}
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
