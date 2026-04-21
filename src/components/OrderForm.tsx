'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/provider';
import { createClient } from '@/lib/supabase/client';
import { submitOrder } from '@/lib/actions/orders';
import { OrderSuccessModal } from './OrderSuccessModal';

type DBSize = { id: string; label: string; width_cm: number; length_cm: number };

export function OrderForm() {
  const { t } = useLocale();
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    customer_email: '',
    address: '',
    size: '',
    notes: '',
  });
  const [dbSizes, setDbSizes] = useState<DBSize[]>([]);
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [orderCode, setOrderCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase
        .from('sizes')
        .select('id, label, width_cm, length_cm')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .then(({ data }) => {
          const list = (data || []) as DBSize[];
          setDbSizes(list);
          if (list.length) {
            const mid = list[Math.floor(list.length / 2)];
            setForm((f) => ({ ...f, size: `${mid.width_cm}x${mid.length_cm}` }));
          }
        });
    } catch {
      // Supabase not configured
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name || !form.phone || !form.address) {
      toast.error(t.order.errFill);
      return;
    }
    setLoading(true);
    const result = await submitOrder({
      customer_name: form.customer_name,
      phone: form.phone,
      customer_email: form.customer_email || null,
      address: form.address,
      size: form.size,
      notes: form.notes || null,
    });
    setLoading(false);
    if (!result.ok) return toast.error(result.error);
    setOrderCode(result.orderCode);
    setSuccessOpen(true);
    setForm({
      customer_name: '',
      phone: '',
      customer_email: '',
      address: '',
      size: dbSizes.length ? `${dbSizes[Math.floor(dbSizes.length / 2)].width_cm}x${dbSizes[Math.floor(dbSizes.length / 2)].length_cm}` : '',
      notes: '',
    });
  };

  return (
    <section id="order" className="relative py-24 md:py-32 px-6 bg-nasij-primary text-nasij-cream overflow-hidden">
      <div className="absolute inset-0 bg-thread-pattern opacity-20" />
      <div className="relative max-w-4xl mx-auto grid md:grid-cols-2 gap-10 md:gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="text-xs tracking-wide text-nasij-accent mb-4">{t.order.kicker}</div>
          <h2 className="display-heading text-4xl md:text-5xl lg:text-6xl">
            {t.order.title1} <span className="italic text-nasij-accent">{t.order.title2}</span>
          </h2>
          <p className="mt-6 text-nasij-cream/70 leading-relaxed">{t.order.desc}</p>
          <div className="mt-8 space-y-2 text-sm text-nasij-cream/60">
            <div>✦ {t.order.f1}</div>
            <div>✦ {t.order.f2}</div>
            <div>✦ {t.order.f3}</div>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          onSubmit={submit}
          className="space-y-3 bg-nasij-cream/5 backdrop-blur border border-nasij-cream/10 rounded-3xl p-6 md:p-8"
        >
          {[
            { k: 'customer_name', placeholder: t.order.name, type: 'text', required: true },
            { k: 'phone', placeholder: t.order.phone, type: 'tel', required: true, dir: 'ltr' },
            { k: 'customer_email', placeholder: t.order.email, type: 'email', required: false, dir: 'ltr' },
            { k: 'address', placeholder: t.order.address, type: 'text', required: true },
          ].map((f) => (
            <input
              key={f.k}
              type={f.type}
              dir={f.dir as any}
              className="field bg-nasij-cream/10 text-nasij-cream placeholder:text-nasij-cream/40 border-nasij-cream/20 focus:bg-nasij-cream/15"
              placeholder={f.placeholder}
              value={(form as any)[f.k]}
              onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
              required={f.required}
            />
          ))}
          <select
            className="field bg-nasij-cream/10 text-nasij-cream border-nasij-cream/20"
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
          >
            {dbSizes.length === 0 && (
              <option value="" className="text-nasij-ink">— Loading sizes —</option>
            )}
            {dbSizes.map((s) => (
              <option key={s.id} value={`${s.width_cm}x${s.length_cm}`} className="text-nasij-ink">
                {s.label} cm
              </option>
            ))}
          </select>
          <textarea
            rows={3}
            className="field bg-nasij-cream/10 text-nasij-cream placeholder:text-nasij-cream/40 border-nasij-cream/20 focus:bg-nasij-cream/15 resize-none"
            placeholder={t.order.notes}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-nasij-accent text-nasij-primary-dark rounded-full py-4 font-medium hover:bg-nasij-secondary transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading ? (<><span className="loom-loader" style={{ width: 16, height: 16, borderWidth: 2 }} /> {t.order.sending}</>) : t.order.send}
          </button>
        </motion.form>
      </div>

      <OrderSuccessModal open={successOpen} onClose={() => setSuccessOpen(false)} orderCode={orderCode} />
    </section>
  );
}
