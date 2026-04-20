'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowRight, ShoppingBag, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function DashboardHome() {
  const [stats, setStats] = useState({
    orders: 0,
    products: 0,
    pendingReview: 0,
    awaitingCustomer: 0,
    confirmed: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [orders, products, pending, awaiting, confirmed, recentRes] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'waiting_customer_confirmation'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('orders').select('order_code, customer_name, status, created_at').order('created_at', { ascending: false }).limit(5),
      ]);
      setStats({
        orders: orders.count || 0,
        products: products.count || 0,
        pendingReview: pending.count || 0,
        awaitingCustomer: awaiting.count || 0,
        confirmed: confirmed.count || 0,
      });
      setRecent(recentRes.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'bg-nasij-primary text-nasij-cream' },
    { label: 'Need Review', value: stats.pendingReview, icon: AlertCircle, color: 'bg-nasij-secondary text-nasij-primary-dark', urgent: stats.pendingReview > 0 },
    { label: 'Awaiting Customer', value: stats.awaitingCustomer, icon: Clock, color: 'bg-nasij-accent text-nasij-primary-dark' },
    { label: 'In Production', value: stats.confirmed, icon: CheckCircle, color: 'bg-nasij-primary-light text-nasij-cream' },
  ];

  return (
    <div>
      <h1 className="display-heading text-4xl text-nasij-primary">Studio Overview · لوحة التحكم</h1>
      <p className="text-nasij-ink/75 mt-2 text-base">A snapshot of NASIJ today.</p>

      {loading ? (
        <div className="flex justify-center py-16"><span className="loom-loader" /></div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {cards.map((c) => (
              <div key={c.label} className={`${c.color} rounded-3xl p-6 relative`}>
                {c.urgent && <span className="absolute top-4 end-4 status-dot bg-red-500" />}
                <c.icon size={22} className="opacity-80" />
                <div className="display-heading text-4xl mt-6">{c.value}</div>
                <div className="text-xs tracking-wide opacity-70 mt-2">{c.label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mt-6">
            {/* Recent orders */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="display-heading text-2xl text-nasij-primary">Recent Orders</h2>
                <Link href="/dashboard/orders" className="text-sm text-nasij-primary hover:text-nasij-primary-dark inline-flex items-center gap-1">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              {recent.length === 0 ? (
                <div className="text-center py-8 text-nasij-ink/50 text-sm">No orders yet.</div>
              ) : (
                <div className="space-y-2">
                  {recent.map((o: any) => (
                    <Link href="/dashboard/orders" key={o.order_code} className="flex items-center justify-between p-3 hover:bg-nasij-secondary/30 rounded-xl transition-colors">
                      <div>
                        <div className="font-medium text-sm text-nasij-primary tracking-wider" dir="ltr">{o.order_code}</div>
                        <div className="text-sm text-nasij-ink/75">{o.customer_name}</div>
                      </div>
                      <div className="text-xs text-nasij-ink/50" dir="ltr">
                        {new Date(o.created_at).toLocaleDateString('en-GB')}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Link href="/dashboard/products" className="group block bg-white rounded-3xl p-6 hover:shadow-xl transition-shadow">
                <Package className="text-nasij-primary mb-3" size={22} />
                <div className="display-heading text-xl text-nasij-primary">Manage Products</div>
                <div className="text-sm text-nasij-ink/60 mt-1">{stats.products} in catalog</div>
                <ArrowRight className="text-nasij-primary group-hover:translate-x-1 transition-transform mt-3" size={16} />
              </Link>
              <div className="bg-nasij-primary text-nasij-cream rounded-3xl p-6">
                <div className="text-xs tracking-wide text-nasij-accent mb-2">Quick Tip</div>
                <p className="text-sm text-nasij-cream/80 leading-relaxed">
                  Set a price on pending orders → click <b>WhatsApp</b> to send the customer the prefilled price confirmation in Arabic.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
