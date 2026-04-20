# NASIJ — Production Enhancements Changelog

Four consolidated sessions of upgrades on top of the original NASIJ codebase. Build verified — `next build` passes cleanly across all 14 routes.

---

## Sessions 1 & 2 — Foundation
*See git history; key items below.*

- Email notification system (Resend, RTL Arabic templates, 4 triggers, auto-fired from order flow)
- Invoice PDF system (A4, AR+EN, EGP, server-side @react-pdf/renderer)
- USD → EGP everywhere (`1,200 EGP` format)
- Hero & About green blocks → cream fabric canvases with logo + soft float
- Arabic typography polish (line-height, word-spacing)
- Login "failed to fetch" → friendly diagnostic errors
- Middleware fail-open semantics (no redirect loops)
- Floating WhatsApp button (RTL-aware, soft pulse, hides on dashboard)
- Animated logo (slow rotating thread halos, colors untouched)
- Performance: `<Image>` everywhere, `useMemo` for heavy SVGs, lazy loading
- Security: input sanitization, status whitelisting, service role server-only

---

## Sessions 3 & 4 — Sizes · CSV · Analytics · RTL · Realtime · RBAC

### 1. UI / UX Improvements
- New `.dashboard-scope` CSS class on the dashboard root applies a 15px base, larger `.text-xs` (0.8rem), `.text-sm` (0.92rem), `.text-base` (1rem), and tighter line-heights for readability on long shifts.
- Bumped muted text contrast from `/60` and `/40` → `/75` and `/50` across overview and product pages.
- All headings now show bilingual Arabic + English where appropriate (e.g. "Orders · الطلبات").

### 2. Logo System
- `Logo` component now supports three modes: `false` (static), `"subtle"` (one faint 60s rotation — for navbar), `true` (two opposing 36s/56s rings — for login/hero).
- **Animated logo moved to top navbar** in `Nav.tsx` (subtle mode) — visible motion without distraction.
- Footer reverted to static logo per spec.
- Dashboard sidebar uses full animation since it's a single brand moment per session.

### 3. Sizes Management System
- **DB:** `migration_v4.sql` — `sizes` table with `width_cm`, `length_cm`, `label`, `active`, `sort_order`, `unique(width_cm, length_cm)` constraint, RLS (public reads active sizes, auth manages all). Seeded with the 3 legacy sizes.
- **Server actions:** `src/lib/actions/sizes.ts` — `listSizes`, `createSize`, `toggleSize`, `deleteSize`. All write actions gated by `requireAdmin()`. Sanitizes input, validates 10–1000 cm bounds, detects duplicates.
- **Admin page:** `src/app/dashboard/sizes/page.tsx` — add form, table view, active/disabled toggle pill, delete with confirm.
- **Customer-facing:** `OrderForm.tsx` and `CustomBuilder.tsx` now fetch active sizes from DB on mount and render them dynamically. Hardcoded `80x120/120x180/160x230` removed.

### 4. Invoice + CSV Export
- Invoice PDF (already done in session 1)
- **CSV export** new in this pass:
  - Server action `exportOrdersCsv()` in `src/lib/actions/exports.ts`. RFC 4180 escaping. Includes order code, customer info, product, size, colors, notes, status, payment status, **price + cost + profit**, dates. Optional `from`/`to` window. UTF-8 BOM prefix so Excel handles Arabic correctly.
  - Route: `/api/export/orders` (Node runtime, RBAC-gated, middleware-protected).
  - **"Export CSV" button** in the orders dashboard header.

### 5. Analytics Dashboard
- New page `src/app/dashboard/analytics/page.tsx` powered by Recharts.
- Server action `getAnalytics()` in `src/lib/actions/analytics.ts` computes everything from the orders table:
  - 4 KPI cards: Total Revenue, Total Profit (revenue − cost), Total Orders, Avg Order Value
  - Daily 30-day **line chart** (orders + paid revenue, dual Y-axis)
  - Monthly 12-month **bar chart** (revenue + profit side-by-side)
  - Status **pie chart** with legend
  - Top sizes table (by orders, with revenue)
- Profit calc uses `orders.cost_at_order` (snapshotted at order time so cost changes don't break history).

### 6. Email Notification System (Resend)
- Already complete from session 1: server-side only, env-gated, fires on order create / price set / payment success / status change. RTL Arabic templates. See `src/lib/notifications/`.

### 7. Arabic / RTL Admin Dashboard
- Dashboard layout flipped from `dir="ltr"` to `dir="rtl"` and `lang="ar"`.
- Sidebar nav labels now bilingual: Arabic primary, English in muted small text.
- Sign-out toast in Arabic.
- `globals.css` adds `[dir='rtl'] [dir='ltr']` `unicode-bidi: isolate` so Latin order codes/dates inside Arabic text render correctly.

### 8. System Enhancements
- **RBAC:** `migration_v4.sql` adds `admin_users` table with `admin`/`staff` roles + `is_admin()` SECURITY DEFINER function + RLS. `src/lib/auth/rbac.ts` provides `getCurrentRole()` and `requireAdmin()` server helpers. All sizes write actions, CSV export, and analytics are gated. Graceful fallback if migration not yet applied (treats logged-in user as admin so dashboard isn't bricked).
- **Order lifecycle status system:** Already complete from earlier — `pending_review → pricing_added → waiting_customer_confirmation → confirmed → paid → in_production → delivered`, enforced by DB check constraint and now also by server-action whitelist.
- **Supabase Realtime:** `src/lib/realtime/useOrdersRealtime.ts` reusable hook subscribes to `postgres_changes` on the orders table. Wired into the orders dashboard with a 600ms debounce. Live indicator pill in the orders header. (Requires enabling Realtime on the `orders` table in Supabase: Database → Replication.)

---

## Database Setup

Run in order:
```sql
-- supabase/schema.sql
-- supabase/migration_v2.sql
-- supabase/migration_v3.sql
-- supabase/migration_v4.sql   <-- NEW: sizes, admin_users, profit fields
```

Then in Supabase Dashboard:
1. **Database → Replication** → enable for the `orders` table (for Realtime updates)
2. **Auth → Users** → create your admin user
3. **SQL editor** → make yourself an admin:
   ```sql
   insert into admin_users (user_id, role)
   values ('YOUR-AUTH-USER-UUID', 'admin');
   ```

---

## Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # required — server actions, invoice, CSV export
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
RESEND_API_KEY=re_...                      # optional — enables email
RESEND_FROM_EMAIL=NASIJ <hello@nasij.studio>
PAYMOB_API_KEY=...                         # optional — enables real payments
PAYMOB_INTEGRATION_ID=...
PAYMOB_IFRAME_ID=...
PAYMOB_HMAC_SECRET=...
```

---

## Build Status

```
Route (app)                              Size     First Load JS
┌ ○ /                                    11.9 kB         222 kB
├ ƒ /api/export/orders                   0 B                0 B
├ ƒ /api/invoice/[orderCode]             0 B                0 B
├ ƒ /api/payments/paymob/webhook         0 B                0 B
├ ○ /dashboard                           2.57 kB         159 kB
├ ○ /dashboard/analytics                 109 kB          196 kB
├ ○ /dashboard/login                     3.4 kB          199 kB
├ ○ /dashboard/orders                    7.59 kB         198 kB
├ ○ /dashboard/products                  3.08 kB         163 kB
├ ○ /dashboard/sizes                     2.48 kB          95 kB
├ ƒ /payment/simulate                    176 B          94.5 kB
├ ○ /payment/success                     6.92 kB         137 kB
└ ○ /track                               5.6 kB          216 kB
+ Middleware                             79.6 kB
```

14 routes total. Analytics is the biggest at 109 KB due to Recharts; everything else lean.
