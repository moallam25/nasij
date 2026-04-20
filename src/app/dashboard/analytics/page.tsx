'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Loader2, TrendingUp, ShoppingBag, DollarSign, BarChart3 } from 'lucide-react';
import { getAnalytics, type AnalyticsSnapshot } from '@/lib/actions/analytics';

const COLORS = ['#2F5D4A', '#D8B37A', '#B8935A', '#3E7962', '#EAD9B6', '#1F3F32', '#C87456'];

const fmtMoney = (n: number) => `${n.toLocaleString('en-US')} EGP`;

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch((e) => setError(e?.message || 'Failed to load analytics'));
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-red-800">
        Failed to load analytics: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-nasij-ink/60">
        <Loader2 className="animate-spin text-nasij-primary mb-4" size={28} />
        Loading analytics…
      </div>
    );
  }

  return (
    <div>
      <h1 className="display-heading text-4xl text-nasij-primary">Analytics</h1>
      <p className="text-nasij-ink/70 mt-2 text-base">
        Sales, revenue, profit, and order health.
      </p>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <Kpi
          label="Total Revenue"
          value={fmtMoney(data.totals.revenue)}
          sub={`${data.totals.paidOrderCount} paid orders`}
          icon={DollarSign}
          color="bg-nasij-primary text-nasij-cream"
        />
        <Kpi
          label="Total Profit"
          value={fmtMoney(data.totals.profit)}
          sub="Revenue − Cost"
          icon={TrendingUp}
          color="bg-nasij-accent text-nasij-primary-dark"
        />
        <Kpi
          label="Total Orders"
          value={String(data.totals.orderCount)}
          sub={`${data.totals.paidOrderCount} paid`}
          icon={ShoppingBag}
          color="bg-nasij-secondary text-nasij-primary-dark"
        />
        <Kpi
          label="Avg Order Value"
          value={fmtMoney(data.totals.avgOrderValue)}
          sub="Across paid orders"
          icon={BarChart3}
          color="bg-nasij-primary-light text-nasij-cream"
        />
      </div>

      {/* Daily orders + revenue (last 30 days) */}
      <div className="bg-white rounded-3xl p-6 mt-6">
        <div className="flex items-end justify-between mb-4">
          <h2 className="display-heading text-2xl text-nasij-primary">Last 30 Days</h2>
          <span className="text-xs text-nasij-ink/50">Orders & paid revenue per day</span>
        </div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={data.daily} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#EAD9B6" strokeDasharray="3 3" opacity={0.5} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B6660' }} interval="preserveStartEnd" />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6B6660' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6B6660' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #EAD9B6', fontSize: 13 }}
                formatter={(v: number, k: string) => (k === 'revenue' ? `${v.toLocaleString()} EGP` : v)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#2F5D4A" strokeWidth={2.2} dot={false} name="Orders" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#D8B37A" strokeWidth={2.2} dot={false} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly bar chart + status pie */}
      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6">
          <h2 className="display-heading text-2xl text-nasij-primary mb-4">Monthly (12 months)</h2>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={data.monthly} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#EAD9B6" strokeDasharray="3 3" opacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B6660' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B6660' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #EAD9B6', fontSize: 13 }}
                  formatter={(v: number) => `${v.toLocaleString()} EGP`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#2F5D4A" radius={[6, 6, 0, 0]} name="Revenue" />
                <Bar dataKey="profit" fill="#D8B37A" radius={[6, 6, 0, 0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6">
          <h2 className="display-heading text-2xl text-nasij-primary mb-4">Status</h2>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.statusBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #EAD9B6', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {data.statusBreakdown.map((s, i) => (
              <li key={s.status} className="flex items-center justify-between text-nasij-ink/80">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  {s.status.replace(/_/g, ' ')}
                </span>
                <span className="font-medium">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Top sizes table */}
      <div className="bg-white rounded-3xl p-6 mt-6">
        <h2 className="display-heading text-2xl text-nasij-primary mb-4">Top Sizes</h2>
        <table className="w-full text-base">
          <thead>
            <tr className="text-sm text-nasij-ink/60 border-b border-nasij-secondary/40">
              <th className="text-start py-2 font-medium">Size</th>
              <th className="text-end py-2 font-medium">Orders</th>
              <th className="text-end py-2 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.topProducts.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6 text-nasij-ink/40">
                  No data yet.
                </td>
              </tr>
            ) : (
              data.topProducts.map((p) => (
                <tr key={p.name} className="border-b border-nasij-secondary/20 last:border-0">
                  <td className="py-3 font-medium text-nasij-ink">{p.name}</td>
                  <td className="py-3 text-end text-nasij-ink/80">{p.orders}</td>
                  <td className="py-3 text-end text-nasij-ink/80">{fmtMoney(p.revenue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  color: string;
}) {
  return (
    <div className={`${color} rounded-3xl p-5`}>
      <Icon size={20} className="opacity-80" />
      <div className="display-heading text-2xl md:text-3xl mt-4 leading-tight">{value}</div>
      <div className="text-xs tracking-wide opacity-80 mt-2">{label}</div>
      {sub && <div className="text-[11px] opacity-60 mt-1">{sub}</div>}
    </div>
  );
}
