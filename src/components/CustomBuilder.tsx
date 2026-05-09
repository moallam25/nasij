'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Check, X, Ruler, Plus, ImageOff, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { submitOrder } from '@/lib/actions/orders';
import { RopeDivider } from './RopeDivider';
import { useLocale } from '@/lib/i18n/provider';
import { OrderSuccessModal } from './OrderSuccessModal';

type DBSize = { id: string; label: string; width_cm: number; length_cm: number };

const colorPalette = [
  { id: 'olive',      hex: '#2F5D4A' },
  { id: 'sand',       hex: '#EAD9B6' },
  { id: 'gold',       hex: '#D8B37A' },
  { id: 'terracotta', hex: '#C87456' },
  { id: 'ink',        hex: '#1C1917' },
  { id: 'cream',      hex: '#FAF5EA' },
  { id: 'rose',       hex: '#D49AA1' },
  { id: 'navy',       hex: '#1E3A5F' },
] as const;

// ─── step indicator ────────────────────────────────────────────────────────────
function StepBadge({ n, done }: { n: number; done: boolean }) {
  return (
    <motion.span
      animate={{ backgroundColor: done ? '#2F5D4A' : 'transparent', borderColor: done ? '#2F5D4A' : 'rgba(216,179,122,0.5)' }}
      transition={{ duration: 0.3 }}
      className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] font-bold"
      style={{ color: done ? '#FAF5EA' : '#2F5D4A' }}
    >
      {done ? <Check size={10} strokeWidth={3} /> : n}
    </motion.span>
  );
}

export function CustomBuilder() {
  const { t, locale } = useLocale();
  const isAr = locale === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile]           = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [dbSizes, setDbSizes]     = useState<DBSize[]>([]);
  const [sizesLoading, setSizesLoading] = useState(true);
  const [size, setSize]           = useState<string>('');
  const [customDims, setCustomDims] = useState<{ length: number; width: number } | null>(null);

  const [colors, setColors]       = useState<string[]>(['olive', 'sand', 'gold']);
  const [customColorHex, setCustomColorHex] = useState('#2F5D4A');

  const [notes, setNotes]         = useState('');
  const [customer, setCustomer]   = useState({ customer_name: '', phone: '', address: '', customer_email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver]   = useState(false);

  const [customSizeOpen, setCustomSizeOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [orderCode, setOrderCode] = useState<string | null>(null);

  const hasImage = !!file && !!previewUrl;

  // Load active sizes
  useEffect(() => {
    try {
      createClient()
        .from('sizes')
        .select('id, label, width_cm, length_cm')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .then(({ data }) => {
          const list = (data || []) as DBSize[];
          setDbSizes(list);
          if (list.length && !size) {
            const mid = list[Math.floor(list.length / 2)];
            setSize(`${mid.width_cm}x${mid.length_cm}`);
          }
          setSizesLoading(false);
        });
    } catch {
      setSizesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sizeLabels: Record<string, { label: string; sub: string }> = Object.fromEntries(
    dbSizes.map((s) => [
      `${s.width_cm}x${s.length_cm}`,
      { label: s.label, sub: `${s.width_cm}×${s.length_cm} cm` },
    ])
  );

  const onFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error(t.custom.errSize); return; }
    // Simulate a brief processing state for UX feedback
    setUploading(true);
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setTimeout(() => setUploading(false), 600);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleColor = (id: string) => {
    setColors((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(0, 5));
  };

  const submit = async () => {
    if (!customer.customer_name || !customer.phone || !customer.address) {
      toast.error(t.custom.errFill); return;
    }
    setSubmitting(true);
    try {
      let design_url: string | null = null;
      if (file) {
        const supabase = createClient();
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('designs').upload(path, file);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('designs').getPublicUrl(path);
        design_url = data.publicUrl;
      }

      const finalSize = size === 'custom' && customDims
        ? `${customDims.length}x${customDims.width}`
        : size;

      const result = await submitOrder({
        customer_name: customer.customer_name,
        phone: customer.phone,
        address: customer.address,
        customer_email: customer.customer_email || null,
        notes: notes || null,
        size: finalSize,
        length_cm: customDims?.length ?? null,
        width_cm: customDims?.width ?? null,
        colors: colors.join(','),
        design_url,
      });

      if (!result.ok) throw new Error(result.error);

      setOrderCode(result.orderCode);
      setSuccessOpen(true);
      setFile(null); setPreviewUrl(null); setNotes('');
      setCustomer({ customer_name: '', phone: '', address: '', customer_email: '' });
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const sizeDisplay = (s: string) => {
    if (s === 'custom' && customDims) return `${customDims.length} × ${customDims.width} cm`;
    return sizeLabels[s] ? `${sizeLabels[s].label}` : '—';
  };

  // Step completion checks
  const step1Done = hasImage;
  const step2Done = !!size;
  const step3Done = hasImage || colors.length > 0; // image overrides colors
  const step4Done = notes.length > 0;
  const step5Done = !!(customer.customer_name && customer.phone && customer.address);

  return (
    <section id="custom" className="relative py-24 md:py-32 px-6 weave-bg overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] text-nasij-accent-dark mb-5 uppercase">
            {t.custom.kicker}
          </div>
          <h2 className="display-heading text-4xl md:text-6xl lg:text-7xl text-nasij-primary">
            {t.custom.title1}{' '}
            <span className="italic text-nasij-accent-dark">{t.custom.title2}</span>
          </h2>
          <p className="mt-5 max-w-lg mx-auto text-nasij-ink/65 leading-relaxed">{t.custom.desc}</p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-start">

          {/* ── Form Panel ──────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: isAr ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 space-y-6 card-soft p-6 md:p-9"
          >
            {/* ── Step 1: Upload ──────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <StepBadge n={1} done={step1Done} />
                <span className="field-label mb-0">{t.custom.step1}</span>
              </div>

              <label
                className="block cursor-pointer"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files[0]); }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0] || null)}
                />
                <motion.div
                  animate={{ borderColor: dragOver ? '#2F5D4A' : hasImage ? '#2F5D4A' : 'rgba(216,179,122,0.4)', backgroundColor: dragOver ? 'rgba(47,93,74,0.04)' : 'transparent' }}
                  transition={{ duration: 0.2 }}
                  className="relative border-2 border-dashed rounded-2xl overflow-hidden transition-shadow hover:shadow-sm"
                  style={{ minHeight: hasImage ? '100px' : '130px' }}
                >
                  <AnimatePresence mode="wait">
                    {uploading ? (
                      <motion.div
                        key="uploading"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center gap-3 py-10"
                      >
                        <span className="loom-loader" style={{ width: 28, height: 28, borderWidth: 2 }} />
                        <span className="text-xs text-nasij-ink/50">{isAr ? 'جاري المعالجة...' : 'Processing...'}</span>
                      </motion.div>
                    ) : hasImage ? (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-4 p-4"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl!} alt="" className="w-16 h-16 object-cover rounded-xl ring-2 ring-nasij-primary/20" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-nasij-primary truncate">{file?.name}</div>
                          <div className="text-xs text-nasij-ink/40 mt-0.5">{t.custom.replace}</div>
                        </div>
                        <button
                          type="button"
                          onClick={clearImage}
                          className="p-1.5 rounded-full hover:bg-red-50 text-nasij-ink/40 hover:text-red-500 transition-colors shrink-0"
                          aria-label="Remove image"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center"
                      >
                        <motion.div
                          animate={{ y: dragOver ? -4 : 0 }}
                          transition={{ type: 'spring', damping: 10 }}
                          className="w-12 h-12 rounded-2xl bg-nasij-secondary/60 flex items-center justify-center mb-1"
                        >
                          <Upload className="text-nasij-primary" size={20} />
                        </motion.div>
                        <div className="text-sm text-nasij-ink/70">
                          {t.custom.uploadHint}{' '}
                          <span className="text-nasij-primary font-medium underline underline-offset-2">{t.custom.uploadBrowse}</span>
                        </div>
                        <div className="text-xs text-nasij-ink/35">{t.custom.uploadFmt}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </label>
            </div>

            {/* ── Step 2: Size ────────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <StepBadge n={2} done={step2Done} />
                <span className="field-label mb-0">{t.custom.step2}</span>
              </div>
              {sizesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-[66px] rounded-2xl bg-nasij-secondary/30 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {dbSizes.map((s) => {
                    const key = `${s.width_cm}x${s.length_cm}`;
                    const active = size === key;
                    return (
                      <motion.button
                        key={s.id}
                        type="button"
                        onClick={() => { setSize(key); setCustomDims(null); }}
                        whileTap={{ scale: 0.97 }}
                        animate={{ borderColor: active ? '#2F5D4A' : 'rgba(216,179,122,0.3)', backgroundColor: active ? '#2F5D4A' : 'transparent' }}
                        transition={{ duration: 0.18 }}
                        className={`p-4 rounded-2xl border-2 text-start transition-shadow ${active ? 'shadow-md' : 'hover:border-nasij-accent/60'}`}
                        style={{ color: active ? '#FAF5EA' : '#1C1917' }}
                      >
                        <div className="text-sm font-semibold">{s.label}</div>
                        <div className={`text-[10px] mt-0.5 font-mono ${active ? 'opacity-70' : 'opacity-40'}`}>
                          {s.width_cm}×{s.length_cm} cm
                        </div>
                      </motion.button>
                    );
                  })}
                  <motion.button
                    type="button"
                    onClick={() => setCustomSizeOpen(true)}
                    whileTap={{ scale: 0.97 }}
                    animate={{ borderColor: size === 'custom' ? '#D8B37A' : 'rgba(216,179,122,0.4)', backgroundColor: size === 'custom' ? 'rgba(216,179,122,0.15)' : 'transparent' }}
                    transition={{ duration: 0.18 }}
                    className="p-4 rounded-2xl border-2 border-dashed text-start flex items-start gap-2 hover:border-nasij-accent hover:bg-nasij-secondary/20"
                  >
                    <Ruler size={15} className="text-nasij-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-nasij-primary">{t.custom.customSize}</div>
                      {size === 'custom' && customDims && (
                        <div className="text-[10px] mt-0.5 text-nasij-accent-dark font-mono">
                          {customDims.length}×{customDims.width} cm
                        </div>
                      )}
                    </div>
                  </motion.button>
                </div>
              )}
            </div>

            {/* ── Step 3: Colors ──────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <StepBadge n={3} done={step3Done} />
                <span className="field-label mb-0">{t.custom.step3}</span>
              </div>

              <AnimatePresence mode="wait">
                {hasImage ? (
                  <motion.div
                    key="colors-hidden"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 py-3 px-4 bg-nasij-secondary/40 rounded-2xl border border-nasij-accent/20">
                      <div className="w-8 h-8 rounded-xl bg-nasij-primary/10 flex items-center justify-center shrink-0">
                        <ImageOff size={14} className="text-nasij-primary" />
                      </div>
                      <p className="text-xs text-nasij-ink/60 leading-snug">
                        {isAr
                          ? 'صورتك هتحدد الألوان. تقدر تضيف ألوان إضافية لو عاوز.'
                          : 'Your image sets the palette. You can still add accent colors below.'}
                      </p>
                    </div>
                    <ColorPicker
                      colors={colors}
                      toggleColor={toggleColor}
                      customColorHex={customColorHex}
                      setCustomColorHex={setCustomColorHex}
                      setColors={setColors}
                      t={t}
                      isAr={isAr}
                      compact
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="colors-full"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35 }}
                    className="overflow-hidden"
                  >
                    <ColorPicker
                      colors={colors}
                      toggleColor={toggleColor}
                      customColorHex={customColorHex}
                      setCustomColorHex={setCustomColorHex}
                      setColors={setColors}
                      t={t}
                      isAr={isAr}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Step 4: Notes ───────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <StepBadge n={4} done={step4Done} />
                <span className="field-label mb-0">{t.custom.step4}</span>
              </div>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.custom.notes}
                className="field resize-none"
              />
            </div>

            {/* ── Step 5: Contact ─────────────────────────────────── */}
            <div className="pt-5 border-t border-nasij-accent/15 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <StepBadge n={5} done={step5Done} />
                <span className="field-label mb-0">{t.custom.step5}</span>
              </div>
              <input className="field" placeholder={t.custom.name} value={customer.customer_name} onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })} />
              <input className="field" placeholder={t.custom.phone} value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} dir="ltr" />
              <input type="email" className="field" placeholder={t.custom.email} value={customer.customer_email} onChange={(e) => setCustomer({ ...customer, customer_email: e.target.value })} dir="ltr" />
              <input className="field" placeholder={t.custom.address} value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
            </div>

            {/* ── Submit ──────────────────────────────────────────── */}
            <motion.button
              onClick={submit}
              disabled={submitting}
              whileHover={submitting ? {} : { y: -2 }}
              whileTap={submitting ? {} : { scale: 0.98 }}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="loom-loader" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  {t.custom.submitting}
                </>
              ) : (
                <>
                  {t.custom.submit}
                  <ChevronRight size={16} className={isAr ? 'rotate-180' : ''} />
                </>
              )}
            </motion.button>
          </motion.div>

          {/* ── Live Preview Panel ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: isAr ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="lg:sticky lg:top-28 space-y-5">
              <div className="text-[10px] tracking-[0.2em] text-nasij-accent-dark uppercase mb-1">
                {t.custom.preview}
              </div>

              {/* Preview canvas */}
              <motion.div
                className="card-soft p-4 relative overflow-hidden cursor-zoom-in"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              >
                <div className="aspect-square rounded-xl overflow-hidden relative bg-nasij-primary">
                  {/* Uploaded image */}
                  <AnimatePresence>
                    {previewUrl && (
                      <motion.img
                        key={previewUrl}
                        src={previewUrl}
                        alt=""
                        initial={{ opacity: 0, scale: 1.06 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                  </AnimatePresence>

                  {/* Color overlay swatches */}
                  <AnimatePresence>
                    {!hasImage && colors.length > 0 && (
                      <motion.div
                        key="swatches"
                        initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 flex pointer-events-none mix-blend-multiply"
                      >
                        {colors.map((id) => {
                          const c = colorPalette.find((x) => x.id === id);
                          const hex = c?.hex ?? (id.startsWith('#') ? id : undefined);
                          return hex ? <div key={id} className="flex-1 transition-all duration-500" style={{ backgroundColor: hex }} /> : null;
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Loom thread fringe — top */}
                  <div className="absolute top-0 inset-x-0 flex justify-between px-3 pointer-events-none">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div key={i} className="w-px h-4 bg-nasij-accent opacity-60 -translate-y-2" />
                    ))}
                  </div>
                  {/* Loom thread fringe — bottom */}
                  <div className="absolute bottom-0 inset-x-0 flex justify-between px-3 pointer-events-none">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div key={i} className="w-px h-4 bg-nasij-accent opacity-60 translate-y-2" />
                    ))}
                  </div>

                  {/* Empty state */}
                  {!previewUrl && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-nasij-cream/40">
                      <div className="w-12 h-12 rounded-2xl border-2 border-nasij-cream/20 flex items-center justify-center">
                        <Upload size={18} />
                      </div>
                      <span className="text-xs tracking-wide">{t.custom.previewEmpty}</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Color dots row */}
              <AnimatePresence>
                {colors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2 flex-wrap"
                  >
                    {colors.map((id) => {
                      const c = colorPalette.find((x) => x.id === id);
                      const hex = c?.hex ?? (id.startsWith('#') ? id : '#ccc');
                      return (
                        <motion.div
                          key={id}
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: hex }}
                          title={(t.colors as any)[id] || id}
                        />
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Summary card */}
              <div className="p-4 bg-nasij-secondary/40 rounded-2xl space-y-2.5 text-sm border border-nasij-accent/15">
                <SummaryRow label={t.custom.pSize} value={sizeDisplay(size)} done={step2Done} />
                <SummaryRow
                  label={t.custom.pColors}
                  value={colors.length > 0
                    ? colors.map((c) => c.startsWith('#') ? c : (t.colors as any)[c]).join('، ')
                    : t.custom.noColors}
                  done={colors.length > 0}
                />
                <SummaryRow
                  label={t.custom.pDesign}
                  value={file ? `✓ ${file.name.slice(0, 18)}${file.name.length > 18 ? '…' : ''}` : t.custom.notUploaded}
                  done={hasImage}
                />
              </div>

              {/* Progress hint */}
              <div className="flex gap-1.5">
                {[step1Done, step2Done, step3Done, step4Done, step5Done].map((done, i) => (
                  <motion.div
                    key={i}
                    animate={{ backgroundColor: done ? '#2F5D4A' : 'rgba(216,179,122,0.3)' }}
                    transition={{ duration: 0.3 }}
                    className="h-1 flex-1 rounded-full"
                  />
                ))}
              </div>
              <p className="text-[11px] text-nasij-ink/40 text-center">
                {[step1Done, step2Done, step3Done, step4Done, step5Done].filter(Boolean).length} / 5{' '}
                {isAr ? 'خطوات مكتملة' : 'steps completed'}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <RopeDivider className="mt-24" />

      <OrderSuccessModal open={successOpen} onClose={() => setSuccessOpen(false)} orderCode={orderCode} />
      <CustomSizeModal
        open={customSizeOpen}
        onClose={() => setCustomSizeOpen(false)}
        initial={customDims}
        onApply={(dims) => { setCustomDims(dims); setSize('custom'); setCustomSizeOpen(false); }}
      />
    </section>
  );
}

// ─── Colour Picker (extracted to keep main component readable) ─────────────────

function ColorPicker({
  colors, toggleColor, customColorHex, setCustomColorHex, setColors, t, isAr, compact,
}: {
  colors: string[];
  toggleColor: (id: string) => void;
  customColorHex: string;
  setCustomColorHex: (v: string) => void;
  setColors: React.Dispatch<React.SetStateAction<string[]>>;
  t: any;
  isAr: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'mt-3' : ''}>
      <div className={`flex flex-wrap gap-2.5 ${compact ? '' : ''}`}>
        {colorPalette.map((c) => {
          const active = colors.includes(c.id);
          const isLight = c.hex === '#FAF5EA' || c.hex === '#EAD9B6';
          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => toggleColor(c.id)}
              title={(t.colors as any)[c.id]}
              whileTap={{ scale: 0.9 }}
              animate={{ scale: active ? 1.12 : 1, borderColor: active ? '#2F5D4A' : 'rgba(216,179,122,0.25)' }}
              transition={{ type: 'spring', damping: 14, stiffness: 280 }}
              className="relative w-10 h-10 md:w-12 md:h-12 rounded-full border-2 shadow-sm"
              style={{ backgroundColor: c.hex }}
              aria-label={(t.colors as any)[c.id]}
              aria-pressed={active}
            >
              <AnimatePresence>
                {active && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Check size={14} strokeWidth={3} className={isLight ? 'text-nasij-primary' : 'text-white'} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}

        {/* Custom hex colors added by the user */}
        {colors.filter((c) => c.startsWith('#')).map((hex) => (
          <motion.button
            key={hex}
            type="button"
            onClick={() => setColors((c) => c.filter((x) => x !== hex))}
            title={`Remove ${hex}`}
            whileTap={{ scale: 0.9 }}
            className="relative w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-nasij-primary shadow-sm"
            style={{ backgroundColor: hex }}
            aria-label={`Remove custom color ${hex}`}
          >
            <X size={12} className="absolute inset-0 m-auto text-white drop-shadow" />
          </motion.button>
        ))}
      </div>

      {/* Custom color picker */}
      <div className="flex items-center gap-3 mt-3.5 pt-3 border-t border-nasij-accent/15">
        <span className="text-xs text-nasij-ink/45 shrink-0">{isAr ? 'لون مخصص' : 'Custom'}</span>
        <label className="relative cursor-pointer shrink-0">
          <input
            type="color"
            value={customColorHex}
            onChange={(e) => setCustomColorHex(e.target.value)}
            className="sr-only"
          />
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-9 h-9 rounded-full border-2 border-nasij-accent/40 shadow-sm"
            style={{ backgroundColor: customColorHex }}
            title={customColorHex}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            if (colors.length >= 5) { toast.error(isAr ? 'الحد الأقصى ٥ ألوان' : 'Max 5 colors'); return; }
            if (!colors.includes(customColorHex)) setColors((c) => [...c, customColorHex].slice(0, 5));
          }}
          className="inline-flex items-center gap-1 text-xs text-nasij-primary border border-nasij-primary/25 px-3 py-1.5 rounded-full hover:bg-nasij-primary/8 transition-colors"
        >
          <Plus size={11} /> {isAr ? 'إضافة' : 'Add'}
        </button>
        <span className="text-[10px] font-mono text-nasij-ink/30 ms-auto">{customColorHex}</span>
      </div>
    </div>
  );
}

// ─── Summary row ──────────────────────────────────────────────────────────────

function SummaryRow({ label, value, done }: { label: string; value: string; done: boolean }) {
  return (
    <div className="flex justify-between gap-2 items-baseline">
      <span className="text-nasij-ink/45 text-[10px] tracking-wide shrink-0">{label}</span>
      <motion.span
        animate={{ color: done ? '#2F5D4A' : 'rgba(28,25,23,0.5)' }}
        className="text-xs text-end font-medium truncate max-w-[60%]"
      >
        {value}
      </motion.span>
    </div>
  );
}

// ─── Custom Size Modal ─────────────────────────────────────────────────────────

function CustomSizeModal({
  open, onClose, onApply, initial,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (d: { length: number; width: number }) => void;
  initial: { length: number; width: number } | null;
}) {
  const { t } = useLocale();
  const [length, setLength] = useState<string>(initial?.length.toString() || '');
  const [width, setWidth]   = useState<string>(initial?.width.toString() || '');

  const apply = () => {
    const l = parseInt(length, 10);
    const w = parseInt(width, 10);
    if (!l || !w || l < 30 || w < 30 || l > 500 || w > 500) {
      toast.error(t.custom.errDimensions); return;
    }
    onApply({ length: l, width: w });
  };

  // Proportional mini-preview
  const pW = width  ? Math.min(140, (parseInt(width)  / 500) * 130 + 40) : 0;
  const pH = length ? Math.min(140, (parseInt(length) / 500) * 130 + 40) : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-nasij-ink/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-nasij-cream w-full max-w-md rounded-t-3xl md:rounded-3xl p-7 md:p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-nasij-secondary flex items-center justify-center">
                  <Ruler className="text-nasij-primary" size={18} />
                </div>
                <div>
                  <h3 className="display-heading text-xl text-nasij-primary">{t.custom.customSizeTitle}</h3>
                  <p className="text-xs text-nasij-ink/50 mt-0.5">{t.custom.customSizeDesc}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-nasij-secondary rounded-full text-nasij-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="field-label">{t.custom.length}</div>
                <input type="number" className="field text-xl display-heading" placeholder="200"
                  value={length} onChange={(e) => setLength(e.target.value)} min="30" max="500" dir="ltr" />
              </div>
              <div>
                <div className="field-label">{t.custom.width}</div>
                <input type="number" className="field text-xl display-heading" placeholder="150"
                  value={width} onChange={(e) => setWidth(e.target.value)} min="30" max="500" dir="ltr" />
              </div>

              <AnimatePresence>
                {pW > 0 && pH > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="flex justify-center py-4"
                  >
                    <div
                      className="bg-nasij-primary/10 border-2 border-nasij-primary/25 rounded-xl flex items-center justify-center text-xs text-nasij-primary font-medium transition-all duration-300"
                      style={{ width: pW, height: pH }}
                    >
                      {length} × {width}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 border-2 border-nasij-accent/35 text-nasij-ink/60 py-3 rounded-full hover:bg-nasij-secondary/40 transition-colors text-sm">
                  {t.custom.cancel}
                </button>
                <button onClick={apply} className="btn-primary flex-1 justify-center">
                  {t.custom.apply}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
