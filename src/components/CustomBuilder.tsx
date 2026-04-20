'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Check, X, Ruler } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { submitOrder } from '@/lib/actions/orders';
import { RopeDivider } from './RopeDivider';
import { useLocale } from '@/lib/i18n/provider';
import { OrderSuccessModal } from './OrderSuccessModal';

type DBSize = { id: string; label: string; width_cm: number; length_cm: number };

const colorPalette = [
  { id: 'olive', hex: '#2F5D4A' },
  { id: 'sand', hex: '#EAD9B6' },
  { id: 'gold', hex: '#D8B37A' },
  { id: 'terracotta', hex: '#C87456' },
  { id: 'ink', hex: '#1C1917' },
  { id: 'cream', hex: '#FAF5EA' },
  { id: 'rose', hex: '#D49AA1' },
  { id: 'navy', hex: '#1E3A5F' },
] as const;

export function CustomBuilder() {
  const { t } = useLocale();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dbSizes, setDbSizes] = useState<DBSize[]>([]);
  const [size, setSize] = useState<string>('');
  const [customDims, setCustomDims] = useState<{ length: number; width: number } | null>(null);
  const [colors, setColors] = useState<string[]>(['olive', 'sand', 'gold']);
  const [notes, setNotes] = useState('');
  const [customer, setCustomer] = useState({ customer_name: '', phone: '', address: '', customer_email: '' });
  const [submitting, setSubmitting] = useState(false);

  const [customSizeOpen, setCustomSizeOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [orderCode, setOrderCode] = useState<string | null>(null);

  // Load active sizes from DB on mount
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('sizes')
      .select('id, label, width_cm, length_cm')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        const list = (data || []) as DBSize[];
        setDbSizes(list);
        // Default to the middle option if available, else first
        if (list.length && !size) {
          const mid = list[Math.floor(list.length / 2)];
          setSize(`${mid.width_cm}x${mid.length_cm}`);
        }
      });
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
    if (f.size > 10 * 1024 * 1024) {
      toast.error(t.custom.errSize);
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const toggleColor = (id: string) => {
    setColors((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(0, 5)));
  };

  const submit = async () => {
    if (!customer.customer_name || !customer.phone || !customer.address) {
      toast.error(t.custom.errFill);
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    try {
      let design_url: string | null = null;
      if (file) {
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

      // Reset
      setFile(null);
      setPreviewUrl(null);
      setNotes('');
      setCustomer({ customer_name: '', phone: '', address: '', customer_email: '' });
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const sizeDisplay = (s: string) => {
    if (s === 'custom' && customDims) return `${customDims.length} × ${customDims.width} cm`;
    return sizeLabels[s] ? `${sizeLabels[s].label} cm` : '—';
  };

  return (
    <section id="custom" className="relative py-24 md:py-32 px-6 weave-bg">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="text-xs tracking-wide text-nasij-accent-dark mb-4">{t.custom.kicker}</div>
          <h2 className="display-heading text-4xl md:text-6xl lg:text-7xl text-nasij-primary">
            {t.custom.title1} <span className="italic text-nasij-accent-dark">{t.custom.title2}</span>
          </h2>
          <p className="mt-6 max-w-xl mx-auto text-nasij-ink/70">{t.custom.desc}</p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 space-y-7 card-soft p-6 md:p-8"
          >
            {/* Upload */}
            <div>
              <div className="field-label">{t.custom.step1}</div>
              <label className="block cursor-pointer group">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
                <div className="border-2 border-dashed border-nasij-accent/40 rounded-2xl p-8 md:p-10 text-center hover:border-nasij-primary hover:bg-nasij-secondary/30 transition-all">
                  {previewUrl ? (
                    <div className="flex items-center justify-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="" className="w-16 h-16 object-cover rounded-lg" />
                      <div className="text-start">
                        <div className="text-sm font-medium text-nasij-primary">{file?.name}</div>
                        <div className="text-xs text-nasij-ink/50">{t.custom.replace}</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto text-nasij-primary mb-3" size={28} />
                      <div className="text-sm text-nasij-ink/70">
                        {t.custom.uploadHint} <span className="text-nasij-primary underline">{t.custom.uploadBrowse}</span>
                      </div>
                      <div className="text-xs text-nasij-ink/40 mt-1">{t.custom.uploadFmt}</div>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* Size — 3 presets + Custom CTA */}
            <div>
              <div className="field-label">{t.custom.step2}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {dbSizes.map((s) => {
                  const key = `${s.width_cm}x${s.length_cm}`;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setSize(key); setCustomDims(null); }}
                      className={`p-4 rounded-2xl border-2 text-start transition-all ${
                        size === key ? 'border-nasij-primary bg-nasij-primary text-nasij-cream' : 'border-nasij-accent/30 hover:border-nasij-accent'
                      }`}
                    >
                      <div className="text-sm font-medium">{s.label} <span className="opacity-60">cm</span></div>
                      <div className={`text-[10px] mt-1 ${size === key ? 'text-nasij-accent' : 'text-nasij-ink/50'}`}>
                        {s.width_cm}×{s.length_cm}
                      </div>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setCustomSizeOpen(true)}
                  className={`p-4 rounded-2xl border-2 text-start transition-all flex items-center gap-2 ${
                    size === 'custom' ? 'border-nasij-accent-dark bg-nasij-accent text-nasij-primary-dark' : 'border-dashed border-nasij-accent/50 hover:border-nasij-accent hover:bg-nasij-secondary/30'
                  }`}
                >
                  <Ruler size={16} />
                  <div>
                    <div className="text-sm font-medium">{t.custom.customSize}</div>
                    {size === 'custom' && customDims && (
                      <div className="text-[10px] mt-0.5">{customDims.length} × {customDims.width} cm</div>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Colors */}
            <div>
              <div className="field-label">{t.custom.step3}</div>
              <div className="flex flex-wrap gap-3">
                {colorPalette.map((c) => {
                  const active = colors.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleColor(c.id)}
                      title={(t.colors as any)[c.id]}
                      className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full border-2 transition-all ${
                        active ? 'border-nasij-primary scale-110' : 'border-nasij-accent/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      aria-label={(t.colors as any)[c.id]}
                    >
                      {active && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check size={18} className={c.hex === '#FAF5EA' || c.hex === '#EAD9B6' ? 'text-nasij-primary' : 'text-white'} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="field-label">{t.custom.step4}</div>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.custom.notes} className="field resize-none" />
            </div>

            {/* Contact */}
            <div className="pt-6 border-t border-nasij-accent/20 space-y-3">
              <div className="field-label">{t.custom.step5}</div>
              <input className="field" placeholder={t.custom.name} value={customer.customer_name} onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })} />
              <input className="field" placeholder={t.custom.phone} value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} dir="ltr" />
              <input type="email" className="field" placeholder={t.custom.email} value={customer.customer_email} onChange={(e) => setCustomer({ ...customer, customer_email: e.target.value })} dir="ltr" />
              <input className="field" placeholder={t.custom.address} value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
            </div>

            <button onClick={submit} disabled={submitting} className="btn-primary w-full disabled:opacity-50">
              {submitting ? (
                <><span className="loom-loader" style={{ width: 18, height: 18, borderWidth: 2 }} /> {t.custom.submitting}</>
              ) : (
                t.custom.submit
              )}
            </button>
          </motion.div>

          {/* Live preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="lg:sticky lg:top-28">
              <div className="text-xs tracking-wide text-nasij-accent-dark mb-4">{t.custom.preview}</div>
              <div className="aspect-square card-soft p-6 relative overflow-hidden">
                <div className="absolute inset-6 rounded-2xl overflow-hidden bg-nasij-primary">
                  {previewUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={previewUrl} alt="" className="w-full h-full object-cover opacity-90" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-nasij-cream/50 text-sm">{t.custom.previewEmpty}</div>
                  )}
                  <div className="absolute inset-0 flex flex-wrap opacity-30 mix-blend-multiply pointer-events-none">
                    {colors.map((id) => {
                      const c = colorPalette.find((x) => x.id === id);
                      return c ? <div key={id} className="flex-1" style={{ backgroundColor: c.hex, minWidth: '20%' }} /> : null;
                    })}
                  </div>
                  <div className="absolute top-0 inset-x-0 flex justify-between px-2">
                    {Array.from({ length: 16 }).map((_, i) => <div key={i} className="w-px h-3 bg-nasij-accent -translate-y-2" />)}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 flex justify-between px-2">
                    {Array.from({ length: 16 }).map((_, i) => <div key={i} className="w-px h-3 bg-nasij-accent translate-y-2" />)}
                  </div>
                </div>
              </div>
              <div className="mt-6 p-5 bg-nasij-secondary/40 rounded-2xl space-y-2 text-sm">
                <Row label={t.custom.pSize} value={sizeDisplay(size)} />
                <Row label={t.custom.pColors} value={colors.length > 0 ? colors.map((c) => (t.colors as any)[c]).join(', ') : t.custom.noColors} />
                <Row label={t.custom.pDesign} value={file ? t.custom.uploaded : t.custom.notUploaded} />
              </div>
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
        onApply={(dims) => {
          setCustomDims(dims);
          setSize('custom');
          setCustomSizeOpen(false);
        }}
      />
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-nasij-ink/50 text-[10px] tracking-wide">{label}</span>
      <span className="text-nasij-ink/80 text-end text-xs">{value}</span>
    </div>
  );
}

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
  const [width, setWidth] = useState<string>(initial?.width.toString() || '');

  const apply = () => {
    const l = parseInt(length, 10);
    const w = parseInt(width, 10);
    if (!l || !w || l < 30 || w < 30 || l > 500 || w > 500) {
      toast.error(t.custom.errDimensions);
      return;
    }
    onApply({ length: l, width: w });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-nasij-ink/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0.8 }}
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
              <button onClick={onClose} className="p-2 hover:bg-nasij-secondary rounded-full text-nasij-primary">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="field-label">{t.custom.length}</div>
                <input
                  type="number"
                  className="field text-xl display-heading"
                  placeholder="200"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  min="30"
                  max="500"
                  dir="ltr"
                />
              </div>
              <div>
                <div className="field-label">{t.custom.width}</div>
                <input
                  type="number"
                  className="field text-xl display-heading"
                  placeholder="150"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  min="30"
                  max="500"
                  dir="ltr"
                />
              </div>

              {/* Mini preview rectangle */}
              {length && width && parseInt(length) > 0 && parseInt(width) > 0 && (
                <div className="flex justify-center py-4">
                  <div
                    className="bg-nasij-primary/10 border-2 border-nasij-primary/30 rounded-lg flex items-center justify-center text-xs text-nasij-primary"
                    style={{
                      width: `${Math.min(180, (parseInt(width) / 500) * 180 + 40)}px`,
                      height: `${Math.min(180, (parseInt(length) / 500) * 180 + 40)}px`,
                    }}
                  >
                    {length} × {width} cm
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={onClose} className="flex-1 border-2 border-nasij-accent/40 text-nasij-ink/70 py-3 rounded-full hover:bg-nasij-secondary/40 transition-colors">
                  {t.custom.cancel}
                </button>
                <button onClick={apply} className="btn-primary flex-1">
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
