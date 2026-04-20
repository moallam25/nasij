'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Search, Package, CreditCard, Check, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLocale } from '@/lib/i18n/provider';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { OrderTimeline } from '@/components/OrderTimeline';
import { initiatePayment } from '@/lib/actions/payments';
import toast from 'react-hot-toast';

type Order = {
  id: string;
  order_code: string;
  customer_name: string;
  status: string;
  admin_price: number | null;
  admin_notes: string | null;
  size: string | null;
  created_at: string;
  design_url: string | null;
  payment_status: string | null;
  // timestamps for timeline
  submitted_at: string | null;
  pricing_added_at: string | null;
  confirmed_at: string | null;
  paid_at: string | null;
  in_production_at: string | null;
  delivered_at: string | null;
};

function TrackInner() {
  const { t } = useLocale();
  const params = useSearchParams();
  const router = useRouter();
  const [code, setCode] = useState(params.get('code') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [paying, setPaying] = useState(false);

  const lookup = async (lookupCode?: string) => {
    const c = (lookupCode ?? code).trim().toUpperCase();
    if (!c) return;
    setLoading(true);
    setNotFound(false);
    const supabase = createClient();
    const { data } = await supabase
      .from('orders')
      .select('id, order_code, customer_name, status, admin_price, admin_notes, size, created_at, design_url, payment_status, submitted_at, pricing_added_at, confirmed_at, paid_at, in_production_at, delivered_at')
      .eq('order_code', c)
      .maybeSingle();
    setLoading(false);
    if (!data) {
      setOrder(null);
      setNotFound(true);
    } else {
      setOrder(data as Order);
      setNotFound(false);
    }
  };

  useEffect(() => {
    const initial = params.get('code');
    if (initial) lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePay = async () => {
    if (!order) return;
    setPaying(true);
    toast.loading(t.track.processing, { id: 'pay' });
    const result = await initiatePayment(order.order_code);
    toast.dismiss('pay');
    setPaying(false);
    if (!result.ok) return toast.error(result.error || 'Payment error');
    if (result.checkoutUrl?.startsWith('/')) {
      router.push(result.checkoutUrl);
    } else {
      window.location.href = result.checkoutUrl!;
    }
  };

  const canPay = order
    && order.admin_price != null
    && order.payment_status !== 'paid'
    && !['rejected', 'delivered', 'completed'].includes(order.status);

  return (
    <main className="min-h-screen flex flex-col">
      <Nav />
      <section className="flex-1 pt-32 pb-20 px-6 weave-bg">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <Package className="mx-auto text-nasij-primary mb-4" size={32} />
            <h1 className="display-heading text-4xl md:text-5xl text-nasij-primary">{t.track.title}</h1>
            <p className="mt-3 text-nasij-ink/60">{t.track.subtitle}</p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={(e) => { e.preventDefault(); lookup(); }}
            className="mt-10 flex gap-2"
          >
            <input
              className="field flex-1 text-center display-heading text-2xl tracking-wider uppercase"
              placeholder={t.track.placeholder}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              dir="ltr"
            />
            <button type="submit" className="btn-primary px-6" disabled={loading}>
              {loading ? <span className="loom-loader" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Search size={16} /> {t.track.check}</>}
            </button>
          </motion.form>

          {notFound && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-center">
              {t.track.notFound}
            </motion.div>
          )}

          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              key={order.order_code}
              className="mt-8 card-soft overflow-hidden"
            >
              {/* Header */}
              <div className="bg-nasij-primary text-nasij-cream p-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-[10px] tracking-wide text-nasij-accent">{t.confirm.code}</div>
                  <div className="display-heading text-3xl tracking-wider" dir="ltr">{order.order_code}</div>
                </div>
                <div className="text-end">
                  <div className="text-[10px] tracking-wide text-nasij-accent">{order.customer_name}</div>
                  <div className="text-xs opacity-70 mt-1">{new Date(order.created_at).toLocaleDateString('en-GB')}</div>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                {/* Status description */}
                <div>
                  <div className="text-[10px] tracking-wide text-nasij-ink/50 mb-2">{t.track.status}</div>
                  <p className="text-nasij-ink/80 leading-relaxed">
                    {(t.statusDesc as any)[order.status] || ''}
                  </p>
                </div>

                {/* Final Price + Pay button */}
                {order.admin_price !== null && (
                  <div className="bg-nasij-secondary/40 rounded-2xl p-5 md:p-6">
                    <div className="text-[10px] tracking-wide text-nasij-ink/50">{t.track.finalPrice}</div>
                    <div className="display-heading text-3xl md:text-4xl text-nasij-primary mt-1 mb-4">
                      {Number(order.admin_price).toLocaleString()}{' '}
                      <span className="text-base text-nasij-ink/60">{t.track.currency}</span>
                    </div>

                    {order.payment_status === 'paid' ? (
                      <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm">
                        <Check size={14} /> {t.track.paymentSuccess}
                      </div>
                    ) : order.payment_status === 'pending' ? (
                      <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm">
                        <Clock size={14} /> {t.track.paymentPending}
                      </div>
                    ) : canPay ? (
                      <button
                        onClick={handlePay}
                        disabled={paying}
                        className="btn-primary w-full sm:w-auto"
                      >
                        <CreditCard size={18} />
                        {paying ? t.track.processing : t.track.payNow}
                      </button>
                    ) : null}

                    {order.payment_status === 'failed' && (
                      <p className="mt-3 text-sm text-red-700">{t.track.paymentFailed}</p>
                    )}
                  </div>
                )}

                {/* Admin notes */}
                {order.admin_notes && (
                  <div className="border-s-4 border-nasij-accent ps-4">
                    <div className="text-[10px] tracking-wide text-nasij-ink/50">{t.track.adminNotes}</div>
                    <p className="text-sm text-nasij-ink/80 mt-1 leading-relaxed">{order.admin_notes}</p>
                  </div>
                )}

                {/* Timeline */}
                <div className="pt-4 border-t border-nasij-accent/20">
                  <div className="text-xs tracking-wide text-nasij-accent-dark mb-6">{t.track.timeline}</div>
                  <OrderTimeline
                    status={order.status}
                    paymentStatus={order.payment_status}
                    timestamps={{
                      submitted_at: order.submitted_at,
                      pricing_added_at: order.pricing_added_at,
                      confirmed_at: order.confirmed_at,
                      paid_at: order.paid_at,
                      in_production_at: order.in_production_at,
                      delivered_at: order.delivered_at,
                    }}
                  />
                </div>

                {order.design_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={order.design_url} alt="design" className="w-full max-h-64 object-contain rounded-2xl bg-nasij-secondary/30 p-4" />
                )}

                <button
                  onClick={() => { setOrder(null); setCode(''); }}
                  className="text-sm text-nasij-primary hover:text-nasij-primary-dark transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowRight size={14} className="rtl:rotate-180" /> {t.track.back}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="loom-loader" /></div>}>
      <TrackInner />
    </Suspense>
  );
}
