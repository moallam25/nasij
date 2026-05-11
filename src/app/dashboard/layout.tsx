'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  LogOut, Package, ShoppingBag, LayoutDashboard,
  ExternalLink, BarChart3, Ruler, Stethoscope, Tag, Truck,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { AdminPushSubscribe } from '@/components/AdminPushSubscribe';
import { useOrdersBadge } from '@/lib/realtime/useOrdersBadge';
import toast from 'react-hot-toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  // Live count of orders waiting for admin review — drives the sidebar badge
  const pendingCount = useOrdersBadge();

  // Set Arabic + RTL on the document for the entire dashboard area.
  useEffect(() => {
    const prevDir  = document.documentElement.dir;
    const prevLang = document.documentElement.lang;
    document.documentElement.dir  = 'rtl';
    document.documentElement.lang = 'ar';
    return () => {
      document.documentElement.dir  = prevDir;
      document.documentElement.lang = prevLang;
    };
  }, []);

  if (pathname === '/dashboard/login') return <div dir="rtl">{children}</div>;

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('تم تسجيل الخروج');
    router.push('/dashboard/login');
    router.refresh();
  };

  const nav = [
    { href: '/dashboard',            label: 'الرئيسية',  en: 'Overview',    icon: LayoutDashboard, badge: 0 },
    { href: '/dashboard/analytics',  label: 'التحليلات', en: 'Analytics',   icon: BarChart3,       badge: 0 },
    { href: '/dashboard/orders',     label: 'الطلبات',   en: 'Orders',      icon: ShoppingBag,     badge: pendingCount },
    { href: '/dashboard/products',   label: 'المنتجات',  en: 'Products',    icon: Package,         badge: 0 },
    { href: '/dashboard/categories', label: 'الفئات',    en: 'Categories',  icon: Tag,             badge: 0 },
    { href: '/dashboard/sizes',      label: 'المقاسات',  en: 'Sizes',       icon: Ruler,           badge: 0 },
    { href: '/dashboard/shipping',   label: 'الشحن',     en: 'Shipping',    icon: Truck,           badge: 0 },
  ];

  return (
    <div className="dashboard-scope min-h-screen flex flex-col md:flex-row" dir="rtl">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="md:w-64 bg-nasij-primary text-nasij-cream md:min-h-screen flex md:flex-col shrink-0">
        <div className="p-6 border-b border-nasij-cream/10">
          <Logo inverted size="sm" animated />
        </div>

        <nav className="flex md:flex-col flex-1 p-4 gap-2 overflow-x-auto">
          {nav.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors shrink-0 ${
                  active
                    ? 'bg-nasij-cream text-nasij-primary'
                    : 'hover:bg-nasij-cream/10 text-nasij-cream/85'
                }`}
              >
                <n.icon size={16} className="shrink-0" />
                <span className="flex flex-col leading-tight text-start flex-1 min-w-0">
                  <span className="text-sm font-medium">{n.label}</span>
                  <span className={`text-[10px] tracking-wide ${active ? 'text-nasij-primary/60' : 'text-nasij-cream/50'}`}>
                    {n.en}
                  </span>
                </span>
                {/* Live pending-orders badge */}
                {n.badge > 0 && (
                  <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center bg-red-500 text-white tabular-nums">
                    {n.badge > 99 ? '99+' : n.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Diagnose */}
          <Link
            href="/dashboard/diagnose"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-nasij-cream/60 hover:bg-nasij-cream/10 shrink-0"
          >
            <Stethoscope size={16} className="shrink-0" />
            <span className="flex flex-col leading-tight text-start">
              <span>التشخيص</span>
              <span className="text-[10px] tracking-wide opacity-60">Diagnose</span>
            </span>
          </Link>

          {/* View Site */}
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-nasij-cream/60 hover:bg-nasij-cream/10 shrink-0"
          >
            <ExternalLink size={16} className="shrink-0" />
            <span className="flex flex-col leading-tight text-start">
              <span>عرض الموقع</span>
              <span className="text-[10px] tracking-wide opacity-60">View Site</span>
            </span>
          </Link>

          <AdminPushSubscribe />
        </nav>

        <button
          onClick={signOut}
          className="m-4 flex items-center gap-3 px-4 py-3 rounded-xl text-sm hover:bg-nasij-cream/10 text-nasij-cream/85"
        >
          <LogOut size={16} className="shrink-0" />
          <span className="flex flex-col leading-tight text-start">
            <span>تسجيل خروج</span>
            <span className="text-[10px] tracking-wide opacity-60">Sign out</span>
          </span>
        </button>
      </aside>

      <main className="flex-1 bg-nasij-secondary-light p-6 md:p-10 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
