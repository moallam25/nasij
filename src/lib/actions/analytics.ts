'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/rbac';

export type AnalyticsSnapshot = {
  totals: {
    revenue: number;
    profit: number;
    orderCount: number;
    paidOrderCount: number;
    avgOrderValue: number;
  };
  daily: { date: string; orders: number; revenue: number }[]; // last 30 days
  monthly: { month: string; orders: number; revenue: number; profit: number }[]; // last 12 months
  statusBreakdown: { status: string; count: number }[];
  topProducts: { name: string; orders: number; revenue: number }[];
};

const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const isoMonth = (d: Date) => d.toISOString().slice(0, 7);

export async function getAnalytics(): Promise<AnalyticsSnapshot> {
  await requireAdmin();
  const supabase = createAdminClient();

  // Pull all orders (light columns) — for a tufting brand this is small data
  const { data: orders, error } = await supabase
    .from('orders')
    .select('order_code, status, payment_status, admin_price, cost_at_order, created_at, paid_at, size')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const rows = orders || [];

  // ---- Totals ----
  let revenue = 0;
  let profit = 0;
  let paidOrderCount = 0;
  for (const o of rows) {
    if (o.payment_status === 'paid') {
      const price = Number(o.admin_price || 0);
      const cost = Number(o.cost_at_order || 0);
      revenue += price;
      profit += price - cost;
      paidOrderCount += 1;
    }
  }

  // ---- Daily (last 30 days) ----
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailyMap = new Map<string, { orders: number; revenue: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dailyMap.set(isoDate(d), { orders: 0, revenue: 0 });
  }
  for (const o of rows) {
    const k = isoDate(new Date(o.created_at));
    const slot = dailyMap.get(k);
    if (!slot) continue;
    slot.orders += 1;
    if (o.payment_status === 'paid') slot.revenue += Number(o.admin_price || 0);
  }
  const daily = Array.from(dailyMap.entries()).map(([date, v]) => ({
    date: date.slice(5), // MM-DD
    orders: v.orders,
    revenue: Math.round(v.revenue),
  }));

  // ---- Monthly (last 12 months) ----
  const monthlyMap = new Map<string, { orders: number; revenue: number; profit: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthlyMap.set(isoMonth(d), { orders: 0, revenue: 0, profit: 0 });
  }
  for (const o of rows) {
    const k = isoMonth(new Date(o.created_at));
    const slot = monthlyMap.get(k);
    if (!slot) continue;
    slot.orders += 1;
    if (o.payment_status === 'paid') {
      const price = Number(o.admin_price || 0);
      const cost = Number(o.cost_at_order || 0);
      slot.revenue += price;
      slot.profit += price - cost;
    }
  }
  const monthly = Array.from(monthlyMap.entries()).map(([month, v]) => ({
    month: month.slice(2), // YY-MM
    orders: v.orders,
    revenue: Math.round(v.revenue),
    profit: Math.round(v.profit),
  }));

  // ---- Status breakdown ----
  const statusMap = new Map<string, number>();
  for (const o of rows) {
    statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1);
  }
  const statusBreakdown = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // ---- Top "products" — group by size since we sell custom rugs ----
  const sizeMap = new Map<string, { orders: number; revenue: number }>();
  for (const o of rows) {
    const key = o.size || 'unspecified';
    const slot = sizeMap.get(key) || { orders: 0, revenue: 0 };
    slot.orders += 1;
    if (o.payment_status === 'paid') slot.revenue += Number(o.admin_price || 0);
    sizeMap.set(key, slot);
  }
  const topProducts = Array.from(sizeMap.entries())
    .map(([name, v]) => ({ name: `${name} cm`, orders: v.orders, revenue: Math.round(v.revenue) }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  return {
    totals: {
      revenue: Math.round(revenue),
      profit: Math.round(profit),
      orderCount: rows.length,
      paidOrderCount,
      avgOrderValue: paidOrderCount ? Math.round(revenue / paidOrderCount) : 0,
    },
    daily,
    monthly,
    statusBreakdown,
    topProducts,
  };
}
