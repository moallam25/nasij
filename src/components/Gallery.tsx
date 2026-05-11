'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, ArrowUpRight,
  ChevronLeft, ChevronRight,
  Phone, CreditCard, Truck, Check, Copy, ShoppingCart,
} from 'lucide-react';
import { useCart } from '@/lib/cart/context';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { submitOrder } from '@/lib/actions/orders';
import { RopeDivider } from './RopeDivider';
import { useLocale } from '@/lib/i18n/provider';
import { OrderSuccessModal } from './OrderSuccessModal';

type Product = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  description: string | null;
  category: string | null;
  discount_percent: number | null;
  is_featured: boolean;
  in_stock: boolean;
};

const FALLBACK_CATEGORY = 'all';
const cardSpring = { type: 'spring' as const, damping: 26, stiffness: 240, mass: 0.6 };

const PAYMENT_METHODS = [
  { id: 'vodafone_cash', icon: Phone,      ar: 'فودافون كاش',       en: 'Vodafone Cash' },
  { id: 'instapay',     icon: CreditCard, ar: 'انستاباي',           en: 'InstaPay' },
  { id: 'cod',          icon: Truck,      ar: 'الدفع عند الاستلام', en: 'Cash on Delivery' },
] as const;

const PAYMENT_ACCOUNTS: Record<string, string> = {
  vodafone_cash: '01010759640',
  instapay:      '01207003896',
};

// ─── Gallery ──────────────────────────────────────────────────────────────────

export function Gallery() {
  const { t, locale } = useLocale();
  const isAr = locale === 'ar';
  const scrollRef = useRef<HTMLDivElement>(null);

  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState(FALLBACK_CATEGORY);
  const [orderCode, setOrderCode]     = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('products')
          .select('id, name, image, price, description, category, discount_percent, is_featured, in_stock')
          .eq('is_visible', true)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false });
        setProducts((data || []) as Product[]);
      } catch {
        // Supabase not configured — gallery shows empty state
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    const abs = Math.abs(el.scrollLeft);
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(abs > 8);
    setCanScrollRight(abs < max - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    updateArrows();
    return () => el.removeEventListener('scroll', updateArrows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setTimeout(updateArrows, 120);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, products]);

  const scroll = (dir: 'prev' | 'next') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 620;
    const goPositive = (dir === 'next') !== isAr;
    el.scrollBy({ left: goPositive ? amount : -amount, behavior: 'smooth' });
  };

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
      (p) => (p.category || FALLBACK_CATEGORY).toLowerCase() === activeCategory,
    );
  }, [products, activeCategory]);

  const labelFor = (cat: string) => {
    const dict = (t.gallery as any).categories as Record<string, string> | undefined;
    if (dict?.[cat]) return dict[cat];
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  return (
    <section id="gallery" className="relative py-28 md:py-36 bg-nasij-secondary-light overflow-hidden">

      {/* Header + filter pills */}
      <div className="max-w-7xl mx-auto px-6">
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

        {!loading && categoryList.length > 1 && (
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
                  : products.filter(
                      (p) => (p.category || FALLBACK_CATEGORY).toLowerCase() === cat,
                    ).length;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(cat)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-nasij-primary text-nasij-cream shadow-[0_8px_24px_-8px_rgba(47,93,74,0.4)]'
                      : 'bg-nasij-cream/60 text-nasij-ink/75 hover:bg-nasij-cream hover:text-nasij-primary'
                  }`}
                >
                  <span>{labelFor(cat)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-nasij-cream/20 text-nasij-cream' : 'bg-nasij-secondary/60 text-nasij-ink/60'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Carousel */}
      {loading ? (
        <div className="flex justify-center py-24"><span className="loom-loader" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 text-nasij-ink/55 text-base px-6">{t.gallery.empty}</div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 text-nasij-ink/55 text-base px-6">
          {(t.gallery as any).emptyFiltered || t.gallery.empty}
        </motion.div>
      ) : (
        <div className="relative">
          {/* Prev/Next */}
          <button
            onClick={() => scroll('prev')}
            aria-label="Previous"
            className={`absolute start-3 sm:start-5 top-[calc(50%-22px)] z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-nasij-cream border border-nasij-accent/20 shadow-md flex items-center justify-center text-nasij-primary transition-all duration-200 hover:bg-nasij-primary hover:text-nasij-cream hover:shadow-lg hover:scale-105 ${!canScrollLeft ? 'opacity-25 pointer-events-none' : ''}`}
          >
            <ChevronLeft size={18} className="flip-rtl" />
          </button>
          <button
            onClick={() => scroll('next')}
            aria-label="Next"
            className={`absolute end-3 sm:end-5 top-[calc(50%-22px)] z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-nasij-cream border border-nasij-accent/20 shadow-md flex items-center justify-center text-nasij-primary transition-all duration-200 hover:bg-nasij-primary hover:text-nasij-cream hover:shadow-lg hover:scale-105 ${!canScrollRight ? 'opacity-25 pointer-events-none' : ''}`}
          >
            <ChevronRight size={18} className="flip-rtl" />
          </button>

          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-14 sm:w-20 z-[1]" style={{ background: 'linear-gradient(90deg,#F5EBD5 0%,transparent 100%)' }} />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-14 sm:w-20 z-[1]" style={{ background: 'linear-gradient(-90deg,#F5EBD5 0%,transparent 100%)' }} />

          {/* Track */}
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6 no-scrollbar"
            style={{ paddingInline: 'max(24px, 5vw)' }}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} onClick={() => setSelected(p)} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6">
        <RopeDivider className="mt-10" />
      </div>

      {/* Detail + order modal */}
      <AnimatePresence>
        {selected && (
          <ProductModal
            product={selected}
            isAr={isAr}
            t={t}
            onClose={() => setSelected(null)}
            onOrderSuccess={(code) => {
              setSelected(null);
              setOrderCode(code);
              setOrderSuccess(true);
            }}
          />
        )}
      </AnimatePresence>

      <OrderSuccessModal open={orderSuccess} onClose={() => setOrderSuccess(false)} orderCode={orderCode} />
    </section>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

function ProductCard({ product, index, onClick }: { product: Product; index: number; onClick: () => void }) {
  const { addItem } = useCart();

  const finalPrice = product.discount_percent
    ? Math.round(Number(product.price) * (1 - product.discount_percent / 100))
    : Number(product.price);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({ id: product.id, name: product.name, nameAr: product.name, price: finalPrice, imageUrl: product.image, qty: 1 });
    toast.success('تمت الإضافة للسلة');
  };

  return (
    <motion.div
      layout
      initial={index < 8 ? { opacity: 0, y: 30 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ ...cardSpring, delay: index < 8 ? Math.min(index * 0.05, 0.32) : 0 }}
      whileHover={{ y: -6 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`Open ${product.name}`}
      className="group snap-start shrink-0 w-[240px] sm:w-[270px] md:w-[290px] aspect-[3/4] relative overflow-hidden rounded-3xl bg-nasij-primary text-start cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-nasij-accent focus-visible:ring-offset-4 focus-visible:ring-offset-nasij-secondary-light"
    >
      {product.image ? (
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 260px, 300px"
          loading={index < 4 ? 'eager' : 'lazy'}
          className="object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.06]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-nasij-primary to-nasij-primary-dark" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-nasij-ink/85 via-nasij-ink/25 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />
      <div className="absolute top-4 end-4 w-9 h-9 rounded-full bg-nasij-cream/90 backdrop-blur flex items-center justify-center opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
        <ArrowUpRight size={16} className="text-nasij-primary" />
      </div>
      <div className="absolute bottom-0 inset-x-0 p-5 text-nasij-cream">
        <div className="display-heading text-lg md:text-xl leading-tight line-clamp-2 transition-transform duration-500 group-hover:-translate-y-0.5">
          {product.name}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            {product.discount_percent ? (
              <>
                <span className="text-sm text-nasij-accent font-semibold">
                  {Math.round(Number(product.price) * (1 - product.discount_percent / 100)).toLocaleString('en-US')}
                  <span className="opacity-60 text-xs ms-0.5">EGP</span>
                </span>
                <span className="text-xs text-nasij-cream/50 line-through">
                  {Number(product.price).toLocaleString('en-US')}
                </span>
                <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  -{product.discount_percent}%
                </span>
              </>
            ) : (
              <span className="text-sm text-nasij-accent font-medium">
                {Number(product.price).toLocaleString('en-US')} <span className="opacity-70 text-xs">EGP</span>
              </span>
            )}
          </div>
          {product.category && product.category !== FALLBACK_CATEGORY && (
            <div className="text-[10px] tracking-wider uppercase text-nasij-cream/70 bg-nasij-cream/10 px-2 py-0.5 rounded-full backdrop-blur">
              {product.category}
            </div>
          )}
        </div>
      </div>

      {/* Add to cart — appears on hover */}
      {product.in_stock && (
        <button
          onClick={handleAddToCart}
          className="absolute bottom-4 end-4 w-9 h-9 rounded-full bg-nasij-accent flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-nasij-accent-dark shadow-lg"
          aria-label="أضف للسلة"
        >
          <ShoppingCart size={15} className="text-white" />
        </button>
      )}
    </motion.div>
  );
}

// ─── ProductModal (detail + inline order form) ────────────────────────────────

type ModalView = 'detail' | 'order';

function ProductModal({ product, isAr, t, onClose, onOrderSuccess }: {
  product: Product;
  isAr: boolean;
  t: any;
  onClose: () => void;
  onOrderSuccess: (code: string) => void;
}) {
  const { addItem } = useCart();
  const [view, setView]               = useState<ModalView>('detail');
  const [form, setForm]               = useState({ customer_name: '', phone: '', address: '', customer_email: '' });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [agreed, setAgreed]           = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [copiedId, setCopiedId]       = useState<string | null>(null);

  const modalFinalPrice = product.discount_percent
    ? Math.round(Number(product.price) * (1 - product.discount_percent / 100))
    : Number(product.price);

  const handleModalAddToCart = () => {
    addItem({ id: product.id, name: product.name, nameAr: product.name, price: modalFinalPrice, imageUrl: product.image, qty: 1 });
    toast.success('تمت الإضافة للسلة');
    onClose();
  };

  const copyAccount = async (pmId: string) => {
    const num = PAYMENT_ACCOUNTS[pmId];
    if (!num) return;
    await navigator.clipboard.writeText(num);
    setCopiedId(pmId);
    toast.success(isAr ? 'تم نسخ الرقم' : 'Number copied!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSubmit = async () => {
    if (!form.customer_name || !form.phone || !form.address) {
      toast.error(isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }
    if (!paymentMethod) {
      toast.error(isAr ? 'يرجى اختيار طريقة الدفع' : 'Please select a payment method');
      return;
    }
    if (!agreed) {
      toast.error(isAr ? 'يرجى الموافقة على شروط الدفع' : 'Please agree to the payment terms');
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitOrder({
        customer_name:  form.customer_name,
        phone:          form.phone,
        address:        form.address,
        customer_email: form.customer_email || null,
        notes:          isAr ? `استفسار عن: ${product.name}` : `Inquiry about: ${product.name}`,
        payment_method: paymentMethod,
      });
      if (!result.ok) throw new Error(result.error);
      onOrderSuccess(result.orderCode);
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-nasij-ink/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={cardSpring}
        className="relative bg-nasij-cream rounded-3xl overflow-hidden max-w-4xl w-full max-h-[92vh] flex flex-col md:grid md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-4 end-4 z-10 w-10 h-10 rounded-full bg-nasij-cream/90 hover:bg-white flex items-center justify-center shadow-md transition-all hover:scale-105">
          <X size={18} className="text-nasij-primary" />
        </button>

        {/* Image panel */}
        <div className="relative aspect-square md:aspect-auto bg-nasij-primary min-h-[200px] md:min-h-0">
          {product.image && (
            <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          )}
          {product.price > 0 && (
            <div className="absolute bottom-4 start-4 flex items-center gap-2">
              <div className="bg-nasij-primary/85 backdrop-blur text-nasij-cream px-4 py-2 rounded-full text-sm font-medium shadow">
                {product.discount_percent
                  ? `${Math.round(Number(product.price) * (1 - product.discount_percent / 100)).toLocaleString('en-US')} EGP`
                  : `${Number(product.price).toLocaleString('en-US')} EGP`}
              </div>
              {product.discount_percent ? (
                <div className="bg-red-500 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-full shadow">
                  -{product.discount_percent}%
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Content panel */}
        <div className="flex flex-col overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ── Detail view ── */}
            {view === 'detail' && (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: isAr ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isAr ? 16 : -16 }}
                transition={{ duration: 0.2 }}
                className="p-7 md:p-10 flex flex-col min-h-full"
              >
                <div className="flex items-center gap-2 text-xs tracking-wider text-nasij-accent-dark mb-3">
                  <Sparkles size={12} /> {t.gallery.handmade}
                </div>
                <h3 className="display-heading text-3xl md:text-4xl text-nasij-primary leading-tight">{product.name}</h3>
                <div className="mt-3 flex items-baseline gap-3 flex-wrap">
                  {product.discount_percent ? (
                    <>
                      <span className="display-heading text-2xl text-nasij-primary">
                        {Math.round(Number(product.price) * (1 - product.discount_percent / 100)).toLocaleString('en-US')}
                        <span className="text-base font-normal text-nasij-ink/50 ms-1">EGP</span>
                      </span>
                      <span className="text-lg text-nasij-ink/35 line-through">
                        {Number(product.price).toLocaleString('en-US')} EGP
                      </span>
                      <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-2.5 py-1 rounded-full">
                        {product.discount_percent}% OFF
                      </span>
                    </>
                  ) : (
                    <span className="display-heading text-2xl text-nasij-accent-dark">
                      {Number(product.price).toLocaleString('en-US')} <span className="text-base text-nasij-ink/50">EGP</span>
                    </span>
                  )}
                </div>
                {product.category && product.category !== FALLBACK_CATEGORY && (
                  <div className="mt-3 inline-flex items-center text-xs tracking-wider uppercase text-nasij-primary bg-nasij-secondary/60 px-3 py-1 rounded-full self-start">{product.category}</div>
                )}
                {product.description && (
                  <p className="mt-5 text-base text-nasij-ink/70 leading-relaxed flex-1">{product.description}</p>
                )}
                <div className="mt-auto pt-8 flex flex-col sm:flex-row gap-3">
                  {product.in_stock && (
                    <button
                      onClick={handleModalAddToCart}
                      className="btn-primary flex-1 justify-center inline-flex items-center gap-2"
                    >
                      <ShoppingCart size={16} /> أضف للسلة
                    </button>
                  )}
                  <button onClick={() => setView('order')} className="btn-outline flex-1 justify-center">{t.gallery.inquire}</button>
                  <a href="#custom" onClick={onClose} className="btn-outline flex-1 justify-center">{t.gallery.custom}</a>
                </div>
              </motion.div>
            )}

            {/* ── Order view ── */}
            {view === 'order' && (
              <motion.div
                key="order"
                initial={{ opacity: 0, x: isAr ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isAr ? 16 : -16 }}
                transition={{ duration: 0.2 }}
                className="p-7 md:p-10 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setView('detail')} className="w-8 h-8 rounded-full border border-nasij-accent/30 flex items-center justify-center text-nasij-primary hover:bg-nasij-secondary/40 transition-colors" aria-label="Back">
                    <ChevronLeft size={15} className="flip-rtl" />
                  </button>
                  <h4 className="display-heading text-xl text-nasij-primary">
                    {isAr ? 'استفسار عن المنتج' : 'Inquire about this product'}
                  </h4>
                </div>

                <div className="space-y-3 flex-1">
                  <input className="field" placeholder={isAr ? 'الاسم الكامل *' : 'Full name *'} value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
                  <input className="field" placeholder={isAr ? 'رقم الهاتف *' : 'Phone *'} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" />
                  <input type="email" className="field" placeholder={isAr ? 'البريد الإلكتروني (اختياري)' : 'Email (optional)'} value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} dir="ltr" />
                  <input className="field" placeholder={isAr ? 'العنوان *' : 'Address *'} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

                  {/* Payment methods — only shown when ordering from gallery */}
                  <div className="pt-1">
                    <div className="field-label">{isAr ? 'طريقة الدفع *' : 'Payment method *'}</div>
                    <div className="grid grid-cols-3 gap-2">
                      {PAYMENT_METHODS.map((pm) => {
                        const Icon = pm.icon;
                        const active = paymentMethod === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 text-center transition-all duration-200 ${
                              active
                                ? 'border-nasij-primary bg-nasij-primary/[0.07] shadow-sm'
                                : 'border-nasij-accent/25 hover:border-nasij-accent/60'
                            }`}
                          >
                            <Icon size={20} className={active ? 'text-nasij-primary' : 'text-nasij-ink/40'} />
                            <span className={`text-[11px] font-medium leading-tight ${active ? 'text-nasij-primary' : 'text-nasij-ink/60'}`}>
                              {isAr ? pm.ar : pm.en}
                            </span>
                            {active && (
                              <span className="w-4 h-4 rounded-full bg-nasij-primary flex items-center justify-center">
                                <Check size={10} className="text-white" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Copyable account number for electronic payments */}
                  {PAYMENT_ACCOUNTS[paymentMethod] && (
                    <div className="bg-nasij-primary/[0.06] border border-nasij-primary/20 rounded-2xl p-4">
                      <div className="text-[10px] uppercase tracking-wider text-nasij-primary/60 mb-2">
                        {isAr ? 'حوّل على الرقم' : 'Transfer to'}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="display-heading text-xl text-nasij-primary tracking-wider" dir="ltr">
                          {PAYMENT_ACCOUNTS[paymentMethod]}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyAccount(paymentMethod)}
                          className="flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-1.5 rounded-full border border-nasij-primary/20 hover:bg-nasij-primary/10 text-nasij-primary"
                        >
                          {copiedId === paymentMethod ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === paymentMethod ? (isAr ? 'تم' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Agreement checkbox */}
                  <button
                    type="button"
                    onClick={() => setAgreed(!agreed)}
                    className="flex items-start gap-3 w-full text-start pt-1"
                    role="checkbox"
                    aria-checked={agreed}
                  >
                    <div className={`w-5 h-5 mt-0.5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${agreed ? 'bg-nasij-primary border-nasij-primary' : 'border-nasij-accent/50'}`}>
                      {agreed && <Check size={11} className="text-white" />}
                    </div>
                    <span className="text-sm text-nasij-ink/65 leading-relaxed">
                      {isAr ? 'أوافق على شروط الدفع والاسترداد' : 'I agree to the payment & refund terms'}
                    </span>
                  </button>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary w-full justify-center mt-5 disabled:opacity-50"
                >
                  {submitting
                    ? <><span className="loom-loader" style={{ width: 16, height: 16, borderWidth: 2 }} />{isAr ? ' جاري الإرسال...' : ' Sending...'}</>
                    : isAr ? 'تأكيد الطلب' : 'Confirm order'}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
