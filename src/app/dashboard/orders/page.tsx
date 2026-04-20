'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, ExternalLink, MessageCircle, Edit3, Check, X, Phone, MapPin, Clock, FileDown, Download, Wifi,
} from 'lucide-react';
import {
  ORDER_STATUSES, STATUS_COLORS, buildWhatsAppUrl, buildPriceMessage, type OrderStatus,
} from '@/lib/order-utils';
import { useOrdersRealtime } from '@/lib/realtime/useOrdersRealtime';

type Order = {
  id: string;
  order_code: string;
  customer_name: string;
  phone: string;
  customer_email: string | null;
  address: string;
  notes: string | null;
  design_url: string | null;
  size: string | null;
  colors: string | null;
  status: OrderStatus;
  admin_price: number | null;
  admin_notes: string | null;
  confirmation_sent: boolean;
  payment_status: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending_review: 'Pending Review',
  pricing_added: 'Pricing Added',
  waiting_customer_confirmation: 'Awaiting Customer',
  confirmed: 'Confirmed',
  paid: 'Paid',
  in_production: 'In Production',
  delivered: 'Delivered',
  rejected: 'Rejected',
  completed: 'Completed',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [editing, setEditing] = useState<Order | null>(null);
  const [previewDesign, setPreviewDesign] = useState<string | null>(null);

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Realtime: any insert/update/delete on `orders` triggers a debounced reload.
  // Requires Realtime enabled on the orders table in Supabase.
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useOrdersRealtime(() => {
    if (reloadTimer.current) clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(() => {
      load();
    }, 600);
  });

  const updateStatus = async (id: string, status: string) => {
    const { updateOrderStatus } = await import('@/lib/actions/orders');
    const result = await updateOrderStatus(id, status);
    if (!result.ok) return toast.error(result.error || 'Update failed');
    toast.success('Status updated');
    setOrders((p) => p.map((o) => (o.id === id ? { ...o, status: status as OrderStatus } : o)));
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this order? This cannot be undone.')) return;
    const supabase = createClient();
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Order deleted');
    setOrders((p) => p.filter((o) => o.id !== id));
  };

  const openWhatsApp = (o: Order) => {
    if (!o.admin_price) {
      toast.error('Set a price first');
      return;
    }
    const url = buildWhatsAppUrl(o.phone, buildPriceMessage(o.order_code, o.admin_price, o.customer_name));
    window.open(url, '_blank', 'noopener,noreferrer');

    // Mark confirmation_sent + bump status if still in pricing_added
    const supabase = createClient();
    const updates: any = { confirmation_sent: true };
    if (o.status === 'pricing_added') updates.status = 'waiting_customer_confirmation';
    supabase.from('orders').update(updates).eq('id', o.id).then(({ error }) => {
      if (!error) {
        setOrders((p) => p.map((x) => (x.id === o.id ? { ...x, ...updates } : x)));
      }
    });
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const counts = ORDER_STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="display-heading text-4xl text-nasij-primary">Orders · الطلبات</h1>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full" title="Live updates via Supabase Realtime">
              <Wifi size={11} />
              <span className="status-dot bg-emerald-500" />
              Live
            </span>
          </div>
          <p className="text-nasij-ink/70 mt-2 text-base">{orders.length} total · {counts.pending_review || 0} need review</p>
        </div>
        <a
          href="/api/export/orders"
          className="inline-flex items-center gap-2 bg-nasij-primary text-nasij-cream px-5 py-2.5 rounded-full hover:bg-nasij-primary-dark transition-colors text-sm font-medium"
          title="Download all orders as CSV"
        >
          <Download size={16} /> Export CSV
        </a>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap mt-6">
        <FilterPill label="All" count={orders.length} active={filter === 'all'} onClick={() => setFilter('all')} />
        {ORDER_STATUSES.map((s) => (
          <FilterPill
            key={s}
            label={STATUS_LABELS[s]}
            count={counts[s] || 0}
            active={filter === s}
            onClick={() => setFilter(s)}
          />
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><span className="loom-loader" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center text-nasij-ink/50 mt-8">No orders here.</div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onEdit={() => setEditing(o)}
              onUpdateStatus={(s) => updateStatus(o.id, s)}
              onDelete={() => remove(o.id)}
              onWhatsApp={() => openWhatsApp(o)}
              onPreviewDesign={() => o.design_url && setPreviewDesign(o.design_url)}
            />
          ))}
        </div>
      )}

      {/* Edit drawer */}
      <AnimatePresence>
        {editing && (
          <EditDrawer
            order={editing}
            onClose={() => setEditing(null)}
            onSaved={(updated) => {
              setOrders((p) => p.map((o) => (o.id === updated.id ? updated : o)));
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Design preview */}
      <AnimatePresence>
        {previewDesign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-nasij-ink/80 flex items-center justify-center p-6"
            onClick={() => setPreviewDesign(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewDesign} alt="design" className="max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterPill({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs tracking-wide transition-colors flex items-center gap-2 ${
        active ? 'bg-nasij-primary text-nasij-cream' : 'bg-white text-nasij-ink/60 hover:bg-nasij-secondary'
      }`}
    >
      {label}
      <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? 'bg-nasij-cream/20' : 'bg-nasij-secondary/60'}`}>
        {count}
      </span>
    </button>
  );
}

function OrderCard({
  order, onEdit, onUpdateStatus, onDelete, onWhatsApp, onPreviewDesign,
}: {
  order: Order;
  onEdit: () => void;
  onUpdateStatus: (s: string) => void;
  onDelete: () => void;
  onWhatsApp: () => void;
  onPreviewDesign: () => void;
}) {
  const ageHours = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 3600000);
  const ageLabel = ageHours < 24 ? `${ageHours}h ago` : `${Math.floor(ageHours / 24)}d ago`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 grid md:grid-cols-[80px_1fr_auto] gap-5 items-start"
    >
      {/* Design thumb */}
      <button
        onClick={onPreviewDesign}
        className="w-20 h-20 rounded-xl overflow-hidden bg-nasij-secondary flex items-center justify-center shrink-0 disabled:cursor-default"
        disabled={!order.design_url}
      >
        {order.design_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={order.design_url} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform" />
        ) : (
          <span className="text-[10px] text-nasij-ink/40 text-center px-2">No design</span>
        )}
      </button>

      {/* Body */}
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="display-heading text-lg text-nasij-primary tracking-wider" dir="ltr">{order.order_code}</span>
          <span className="text-sm font-medium text-nasij-ink">{order.customer_name}</span>
          <span className="text-xs text-nasij-ink/40 inline-flex items-center gap-1"><Clock size={10} /> {ageLabel}</span>
          {order.confirmation_sent && (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Check size={10} /> WhatsApp sent
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-nasij-ink/60">
          <span className="inline-flex items-center gap-1" dir="ltr"><Phone size={11} /> {order.phone}</span>
          <span className="inline-flex items-center gap-1"><MapPin size={11} /> {order.address}</span>
          {order.size && <span>Size: <b className="text-nasij-ink/80">{order.size}</b></span>}
        </div>
        {order.colors && <div className="text-xs text-nasij-ink/60">Colors: <b className="text-nasij-ink/80">{order.colors}</b></div>}
        {order.notes && <div className="text-sm text-nasij-ink/60 italic">"{order.notes}"</div>}

        {/* Pricing/admin row */}
        {(order.admin_price !== null || order.admin_notes) && (
          <div className="bg-nasij-secondary/30 rounded-xl p-3 mt-2 grid sm:grid-cols-[auto_1fr] gap-3 items-start">
            {order.admin_price !== null && (
              <div>
                <div className="text-[10px] text-nasij-ink/50 tracking-wide">Final Price</div>
                <div className="display-heading text-xl text-nasij-primary">{Number(order.admin_price).toLocaleString()} <span className="text-xs text-nasij-ink/50">EGP</span></div>
              </div>
            )}
            {order.admin_notes && (
              <div className="text-xs text-nasij-ink/70 leading-relaxed">{order.admin_notes}</div>
            )}
          </div>
        )}

        {order.design_url && (
          <a href={order.design_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-nasij-primary hover:underline">
            Open design <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Actions column */}
      <div className="flex md:flex-col gap-2 items-stretch md:items-end shrink-0">
        <select
          value={order.status}
          onChange={(e) => onUpdateStatus(e.target.value)}
          className={`text-xs px-3 py-2 rounded-full border-0 font-medium cursor-pointer tracking-wide ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}
        >
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        <div className="flex gap-1 justify-end">
          <button
            onClick={onEdit}
            className="px-3 py-2 text-xs bg-nasij-primary text-nasij-cream rounded-full hover:bg-nasij-primary-dark transition-colors inline-flex items-center gap-1.5"
            title="Set price & notes"
          >
            <Edit3 size={12} /> Price/Notes
          </button>

          <button
            onClick={onWhatsApp}
            disabled={!order.admin_price}
            className="px-3 py-2 text-xs bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            title={order.admin_price ? 'Send price via WhatsApp' : 'Set price first'}
          >
            <MessageCircle size={12} /> WhatsApp
          </button>

          <a
            href={order.admin_price ? `/api/invoice/${order.order_code}` : undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!order.admin_price}
            onClick={(e) => { if (!order.admin_price) e.preventDefault(); }}
            className={`px-3 py-2 text-xs rounded-full transition-colors inline-flex items-center gap-1.5 ${
              order.admin_price
                ? 'bg-nasij-accent text-nasij-primary-dark hover:bg-nasij-accent-dark hover:text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
            }`}
            title={order.admin_price ? 'Download Invoice PDF' : 'Set price first to enable invoice'}
          >
            <FileDown size={12} /> Invoice PDF
          </a>

          <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-full" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function EditDrawer({
  order, onClose, onSaved,
}: {
  order: Order;
  onClose: () => void;
  onSaved: (o: Order) => void;
}) {
  const [price, setPrice] = useState<string>(order.admin_price?.toString() || '');
  const [notes, setNotes] = useState(order.admin_notes || '');
  const [autoStatus, setAutoStatus] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const supabase = createClient();
    const updates: any = {
      admin_price: price ? Number(price) : null,
      admin_notes: notes || null,
    };
    // Auto-bump status when price first added
    if (autoStatus && price && order.status === 'pending_review') {
      updates.status = 'pricing_added';
    }
    const { data, error } = await supabase.from('orders').update(updates).eq('id', order.id).select('*').single();
    if (error) {
      setSaving(false);
      return toast.error(error.message);
    }

    // Optionally send price-ready email to customer
    if (sendEmail && price && (data as any)?.customer_email) {
      try {
        const { notifyPriceReady } = await import('@/lib/actions/payments');
        const r = await notifyPriceReady(order.order_code);
        if (r.ok) toast.success('Saved · Email sent');
        else toast.success('Saved (email not sent: ' + (r.error || 'unknown') + ')');
      } catch {
        toast.success('Saved');
      }
    } else {
      toast.success('Saved');
    }
    setSaving(false);
    onSaved(data as Order);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-nasij-ink/70 flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-nasij-cream rounded-t-3xl md:rounded-3xl max-w-lg w-full p-6 md:p-8 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[10px] tracking-wide text-nasij-ink/50">{order.order_code}</div>
            <h2 className="display-heading text-2xl text-nasij-primary">Set Price & Notes</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-nasij-secondary rounded-full"><X size={18} /></button>
        </div>

        <div className="space-y-5">
          <div>
            <div className="field-label">Final Price (EGP)</div>
            <input
              type="number"
              className="field text-2xl display-heading"
              placeholder="e.g. 4500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              dir="ltr"
            />
          </div>
          <div>
            <div className="field-label">Admin Notes (visible to customer on /track)</div>
            <textarea
              rows={4}
              className="field resize-none"
              placeholder="e.g. We adjusted the size slightly to match your reference. Lead time ~3 weeks."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {order.status === 'pending_review' && price && (
            <label className="flex items-center gap-2 text-sm text-nasij-ink/70">
              <input type="checkbox" checked={autoStatus} onChange={(e) => setAutoStatus(e.target.checked)} className="rounded" />
              Auto-update status to "Pricing Added"
            </label>
          )}
          {price && (order as any).customer_email && (
            <label className="flex items-center gap-2 text-sm text-nasij-ink/70">
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="rounded" />
              Email customer the price + payment link
            </label>
          )}
          <button onClick={save} disabled={saving} className="btn-primary w-full justify-center">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
