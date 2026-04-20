# NASIJ — PROJECT LOG

> **Read this before any task. Append to it after every task. Do not edit previous entries.**
>
> This file is project memory. Every change, fix, and feature gets logged here in chronological order.

---

## Protocol for Future Sessions

**BEFORE starting work:**
1. Read this entire file from top to bottom.
2. Note the most recent entry and the current state summary at the bottom.
3. If the user's request overlaps with existing work, reference the relevant entry by number.

**AFTER completing a task:**
1. Append a new entry at the bottom in the format below.
2. Use ISO-8601 date (YYYY-MM-DD). The exact time is not needed unless multiple entries land on the same day.
3. Number entries sequentially across all sessions.
4. Do not rewrite history. If a later task changes or reverts an earlier one, describe that in the new entry.
5. Update the "Current State" section at the bottom so future sessions have a quick snapshot.

**Entry format:**

```
## Entry N — YYYY-MM-DD — Short Title
**Type:** Feature | Fix | Refactor | Infrastructure | Docs | Reverted
**Session:** <number or descriptor>
**Request:** <one-line summary of what the user asked for>

### Changed
- `path/to/file.ts` — what changed and why
- `path/to/other.tsx` — what changed and why

### Added
- `new/file.ts` — purpose

### Removed
- `deleted/file.ts` — reason

### DB Migration
- `supabase/migration_vN.sql` — what it does (or "none")

### Notes
Anything tricky, non-obvious, or worth remembering. Pitfalls encountered. Decisions made.

### Build Status
- Pass / Fail / Not run
```

---

## Entry 1 — 2026-04-18 — Initial project scaffold (pre-logging)
**Type:** Infrastructure
**Session:** 0 (pre-log)
**Request:** Initial NASIJ platform (tufting rug brand) built before the log existed.

### Summary
Project existed before this log was created. Reconstructed from `CHANGES.md` and git-like history across prior sessions. The original scaffold included:

- Next.js 14.2.15 App Router, Tailwind, Framer Motion, Supabase (SSR + JS SDK)
- Public site: Hero, About, Gallery, CustomBuilder, WhyNasij, OrderForm, Footer, Nav, OrderTimeline, OrderSuccessModal, RopeDivider
- Track page at `/track`
- Admin dashboard with Orders + Products pages
- i18n provider (Arabic RTL default + English)
- Supabase schema: `products`, `orders` tables; migrations v2 (order codes + workflow) and v3 (payments + timeline)
- Paymob integration scaffold
- Resend-based email notifications (templates: `orderSubmitted`, `priceReady`, `paymentSuccess`)

### Notes
No log existed. This entry is reconstructed. Subsequent entries capture work from the point the log was started.

---

## Entry 2 — 2026-04-19 — Email · Invoice · Currency · Hero green block · Typography
**Type:** Feature
**Session:** 1
**Request:** Make NASIJ production-ready: full email system, invoice PDF, EGP pricing, fix hero green block, logo rules, UI polish.

### Added
- `src/lib/actions/orders.ts` — server actions `submitOrder()`, `updateOrderStatus()` with automatic email firing
- `src/lib/invoices/InvoiceDocument.tsx` — @react-pdf/renderer invoice component (A4 bilingual AR/EN, EGP, embedded Cairo + Inter fonts from Google Fonts CDN)
- `src/app/api/invoice/[orderCode]/route.tsx` — Node-runtime PDF download route, session-gated

### Changed
- `src/lib/notifications/templates.ts` — added `statusChanged` template; all templates show price as `1,200 EGP` with `جنيه مصري` subtitle
- `src/lib/notifications/index.ts` — added `notify.statusChanged()` with Arabic status label + description maps
- `src/components/Hero.tsx` — **replaced the large green `<rect fill="#2F5D4A" />` block** with a cream fabric-textured canvas (radial gradient + woven thread overlay) containing the NASIJ logo (colors unchanged) with a 7s Framer Motion float
- `src/components/Gallery.tsx`, `src/app/dashboard/products/page.tsx` — `$` price → `EGP` everywhere
- `src/lib/i18n/dictionaries.ts` — Arabic suffix `جنيه` → `ج.م` for tighter display
- `src/lib/order-utils.ts` — WhatsApp price message uses `ج.م`
- `src/app/payment/simulate/page.tsx` — `جنيه` → `EGP`
- `src/components/OrderForm.tsx`, `src/components/CustomBuilder.tsx` — wired to `submitOrder()` server action
- `src/app/dashboard/orders/page.tsx` — wired `updateOrderStatus()`, added Invoice PDF download button, added `FileDown` icon import
- `src/middleware.ts` — added `/api/invoice/*` to protected matcher
- `src/app/globals.css` — Arabic typography polish (`line-height: 1.85`, `word-spacing: 0.04em`), `.section-rhythm` and `.soft-float` utilities

### DB Migration
- none (migrations v2 and v3 already covered all needed fields)

### Installed
- `@react-pdf/renderer@^4.0.0`

### Notes
- react-pdf does not natively reshape Arabic glyphs. Short labels in invoices render fine with embedded Cairo. Long Arabic paragraphs would need an `arabic-reshaper` pre-pass — out of scope.
- Invoice route uses `renderToBuffer` then wraps result in `new Uint8Array(buffer)` to satisfy `NextResponse` BodyInit type.

### Build Status
Pass.

---

## Entry 3 — 2026-04-19 — Login bug · WhatsApp · About green block · Animated logo · Perf · Security
**Type:** Fix + Feature
**Session:** 2
**Request:** Debug login "failed to fetch", restore WhatsApp button, fix remaining green block, animate logo, performance + security pass.

### Added
- `src/components/WhatsAppButton.tsx` — floating RTL-aware WhatsApp CTA (phone `201010759640`, prefilled message `مرحبا، أريد الاستفسار عن تصميم سجاد من نسيج`). Pulse animation, hides on `/dashboard/*`, lifts on mobile homepage, respects `prefers-reduced-motion`.

### Changed
- `src/lib/supabase/client.ts` — env validation with clear error messages, `isSupabaseConfigured()` helper, sanity-checks URL format
- `src/app/dashboard/login/page.tsx` — rewritten with `friendlyError()` mapper (translates "Failed to fetch" into actionable text), inline error block, env-missing panel, password show/hide, autocomplete attrs, loading spinner
- `src/middleware.ts` — fail-open semantics (no redirect loops on env missing or network errors), try/catch around `getUser()`, `?next=` redirect preservation
- `src/components/About.tsx` — **replaced the second green block** (the `bg-nasij-primary` + warmth-gradient SVG) with matching cream fabric-textured canvas + NASIJ logo + 8s float animation
- `src/components/Logo.tsx` — added optional `animated` prop: two concentric dashed/dotted rings rotate slowly (36s + 56s, opposing). Logo image colors never modified. `motion-reduce:hidden` on rings.
- `src/components/Gallery.tsx` — `<img>` → `next/image` with `fill`, `sizes`, `loading="lazy"` past first 2 cards
- `src/app/dashboard/products/page.tsx` — same `<img>` → `next/image` treatment
- `src/components/Hero.tsx` — wrapped 48 warp-thread positions in `useMemo`
- `src/app/layout.tsx` — mounted `WhatsAppButton` globally
- `src/components/Footer.tsx`, `src/app/dashboard/login/page.tsx` — enabled `<Logo animated />`
- `src/lib/actions/orders.ts` — input sanitization in `submitOrder()` (strips control chars, collapses whitespace, length caps: name 120, phone 30, email 254, address 500, notes 2000; email regex; http(s)-only URL filter; integer range on dimensions). `updateOrderStatus()` whitelists allowed status values (defense in depth).

### Notes
- "Failed to fetch" root cause is almost always: missing env, wrong Supabase URL, or paused project. The new login page tells the user exactly which one.

### Build Status
Pass.

---

## Entry 4 — 2026-04-19 — Sizes system · RBAC · Move logo to navbar · CSV export · Analytics · RTL admin · Realtime
**Type:** Feature
**Session:** 3–4
**Request:** Eight-area production upgrade: UI polish, move animated logo to navbar, sizes CRUD, invoice+CSV, analytics dashboard, Resend fix, RTL admin, RBAC + lifecycle + realtime.

### Added
- `supabase/migration_v4.sql` — `sizes` table (label, width_cm, length_cm, active, sort_order, unique(width_cm,length_cm), RLS, bump-trigger). `admin_users` table with `admin | staff` roles + `is_admin()` SECURITY DEFINER function + RLS. `products.cost` and `orders.cost_at_order` for profit tracking. Indexes on created_at, paid_at.
- `src/lib/actions/sizes.ts` — `listSizes`, `createSize`, `toggleSize`, `deleteSize`. All writes gated by `requireAdmin()`. 10–1000 cm bounds, duplicate detection.
- `src/app/dashboard/sizes/page.tsx` — admin CRUD: add form, table with active/disabled toggle pill, delete with confirm.
- `src/lib/auth/rbac.ts` — `getCurrentRole()` and `requireAdmin()` server helpers. Graceful fallback if migration v4 not applied (treats logged-in user as admin so dashboard isn't bricked).
- `src/lib/actions/exports.ts` — `exportOrdersCsv()` with RFC 4180 escaping, optional date window, includes price+cost+profit columns, UTF-8 BOM prefix for Excel Arabic support.
- `src/app/api/export/orders/route.ts` — CSV download route, Node runtime.
- `src/lib/actions/analytics.ts` — `getAnalytics()` returns totals (revenue, profit, orders, AOV), daily 30-day series, monthly 12-month series, status breakdown, top sizes.
- `src/app/dashboard/analytics/page.tsx` — Recharts dashboard: 4 KPI cards, daily line chart (dual Y-axis for orders+revenue), monthly bar chart (revenue+profit side-by-side), status pie, top sizes table.
- `src/lib/realtime/useOrdersRealtime.ts` — reusable hook subscribing to `postgres_changes` on orders table with debounce.

### Changed
- `src/components/Logo.tsx` — added `"subtle"` mode (one faint 60s ring, for navbar). Three modes total: `false | "subtle" | true`.
- `src/components/Nav.tsx` — navbar logo uses `animated="subtle"`.
- `src/components/Footer.tsx` — reverted to static logo (per spec: animation moves to navbar).
- `src/app/dashboard/layout.tsx` — flipped `dir="ltr"` → `dir="rtl"`, `lang="en"` → `lang="ar"`. Bilingual nav labels (Arabic primary, English muted small). Arabic sign-out toast. Added `dashboard-scope` class for readability CSS scope. Added Analytics + Sizes nav entries with new icons.
- `src/app/dashboard/orders/page.tsx` — Export CSV button in header; Live indicator pill; wired `useOrdersRealtime` with 600ms debounced reload; bilingual title.
- `src/app/dashboard/page.tsx`, `src/app/dashboard/products/page.tsx` — larger readable text, bumped muted contrast from `/60` → `/75`, bilingual titles.
- `src/app/globals.css` — `.dashboard-scope` selector applies 15px base; bumped `.text-xs` to 0.8rem, `.text-sm` to 0.92rem, `.text-base` to 1rem. Added `html[dir='rtl'] [dir='ltr']` unicode-bidi isolation. Recharts tooltip contrast fix.
- `src/components/OrderForm.tsx`, `src/components/CustomBuilder.tsx` — fetch active sizes from DB on mount, render dynamically. Hardcoded `80x120/120x180/160x230` removed.
- `src/middleware.ts` — added `/api/export/*` to protected matcher.
- `src/lib/auth/rbac.ts` — cast `auth as any` for `.auth.getUser()` to work around narrow SSR client typing.

### Installed
- `recharts@2.13.0`

### DB Migration
- `supabase/migration_v4.sql` (must be run manually in Supabase SQL editor)

### Notes
- After running migration v4, the admin must `insert into admin_users (user_id, role) values ('<uuid>', 'admin');` to grant themselves admin role. Graceful fallback treats any logged-in user as admin until this is done.
- Realtime requires enabling replication on the `orders` table in Supabase Dashboard → Database → Replication.

### Build Status
Pass — 14 routes. Analytics page is the largest at 109 KB (Recharts).

---

## Entry 5 — 2026-04-19 — Products section redesign · Categories
**Type:** Feature
**Session:** 5
**Request:** Horizontal grid layout, equal-size cards, smooth animations, category filter system.

### Added
- `supabase/migration_v5.sql` — adds `products.category` text column (default `'all'`), index, backfill.

### Changed
- `src/components/Gallery.tsx` — completely rewritten:
  - Equal-size cards (`aspect-[4/5]`), no asymmetric "featured 2x2" sizing
  - Responsive grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`
  - Category filter pills with sliding active background (Framer `layoutId="filter-pill"`)
  - Categories built dynamically from DB values
  - `LayoutGroup` + `AnimatePresence mode="popLayout"` for smooth filter reflow
  - Spring-based animations (damping 26, stiffness 240)
  - Hover: `y: -6` lift, 1.1s image zoom, gradient veil deepens, `ArrowUpRight` hint pops in
  - Smart staggering: first 8 cards stagger-fade in on mount, later cards appear instantly
  - Per-card category badge
  - Modal redesigned with cleaner spacing, sparkle accent
- `src/lib/i18n/dictionaries.ts` — added `gallery.filterAll`, `gallery.emptyFiltered`, `gallery.categories.{all|modern|classic|kids|custom|bohemian}` (AR + EN)
- `src/app/dashboard/products/page.tsx` — added `category` to `Product` type + empty form + `openEdit`. Added category dropdown between Description and Image. Category badge on each product card. `CATEGORY_OPTIONS = ['all', 'modern', 'classic', 'kids', 'bohemian', 'custom']`.

### DB Migration
- `supabase/migration_v5.sql`

### Notes
- Categories are free-text on the `products` table rather than a separate categories table — small curated set, rare changes. Admins can add new categories by just setting a new value on a product.

### Build Status
Pass — 14 routes. Home JS went 11.9 KB → 13.1 KB (Framer LayoutGroup overhead).

---

## Entry 6 — 2026-04-19 — Supabase diagnostic system · Setup banner
**Type:** Fix + Infrastructure
**Session:** 6
**Request:** Fix "No API key found" connection errors. User asked for hardcoded-key fallback — refused on security grounds (keys would end up in git history). Built diagnostic system instead.

### Added
- `src/lib/supabase/env.ts` — shared env helper. Sanitizes BOM, wrapping quotes, accidental `Bearer ` prefix, leading/trailing whitespace. Validates URL format and `.supabase.co` hostname. Validates anon key as 3-segment JWT and decodes role claim. Returns structured `EnvCheck[]` with `ok | warn | error` levels and safe previews (never reveals full secrets). Two readers: `readPublicEnv()` and `readServerEnv()`.
- `src/app/api/diagnose/route.ts` — public diagnostic endpoint. Returns env summary + live test query results (counts products table) with timing, HTTP status, Supabase error code/hint/details.
- `src/app/dashboard/diagnose/page.tsx` — visual diagnostic UI. Runs both browser + server tests in parallel. Shows pass/fail badges with safe previews. Inline setup guide that auto-appears when unhealthy.
- `src/components/SetupBanner.tsx` — site-wide amber banner when env is missing. Renders nothing when healthy. Links to `/dashboard/diagnose`.

### Changed
- `src/lib/supabase/client.ts` — now uses `readPublicEnv()`. Singleton client (re-uses one instance per browser session, avoids multiple websocket connections). One-time `console.log` on successful connection showing URL and partial anon key for dev visibility.
- `src/lib/supabase/server.ts` — uses shared helper.
- `src/lib/supabase/admin.ts` — uses `readServerEnv()`. Falls back to anon key with warning if `SUPABASE_SERVICE_ROLE_KEY` missing.
- `src/middleware.ts` — `/dashboard/diagnose` and `/api/diagnose` always bypass auth (so you can reach them when login itself is broken).
- `src/app/dashboard/layout.tsx` — added bilingual "التشخيص / Diagnose" link to sidebar with `Stethoscope` icon.
- `src/app/layout.tsx` — mounted `<SetupBanner />` above `<LocaleProvider>` so the amber banner appears on every page until env is fixed.

### Notes
- **Refused hardcoded-key fallback** per user's original request. Explained to user that anon keys in source code end up in git history permanently. Built diagnostic UI as the better alternative — tells you exactly what's wrong without the security cost.
- JWT role claim check catches the most common paste error: copying the service_role key into `NEXT_PUBLIC_SUPABASE_ANON_KEY` (role would be `service_role`, not `anon`).
- Bearer-prefix stripper handles a surprisingly common paste error where users copy `Authorization: Bearer eyJ...` headers from docs.

### Build Status
Pass — 16 routes now. `/dashboard/diagnose` 4.48 KB, `/api/diagnose` dynamic.

---

## Entry 7 — 2026-04-19 — Added PROJECT_LOG.md
**Type:** Infrastructure / Docs
**Session:** 7
**Request:** Create a persistent `PROJECT_LOG.md` that logs every change in chronological order. Read before working, update after each task. Structured, timestamped, append-only. Treat as project memory.

### Added
- `PROJECT_LOG.md` (this file) — append-only chronological log of every change, fix, and feature. Reconstructs entries 1–6 from `CHANGES.md` and session memory. Defines the protocol (read first, append after, never rewrite) and an entry-format template for future sessions.

### Notes
- **Read-first-append-after protocol** is documented at the top of the file. All future sessions must follow it.
- `CHANGES.md` is kept as a higher-level user-facing changelog (what changed and why, written for non-engineers). `PROJECT_LOG.md` is the engineering log (what files changed, what decisions were made, what to remember).
- Entries 1–6 were reconstructed, not originally logged in real-time. From Entry 7 onward, every task appends its own entry as part of the task.

### Build Status
Not run — docs-only change, no code modified.

---

## Current State Snapshot

**Last updated:** 2026-04-19 (Entry 7)

**Stack:**
- Next.js 14.2.15 (App Router)
- React 18.3.1, TypeScript 5.6.3
- Supabase (@supabase/ssr 0.5.2, @supabase/supabase-js 2.45.4)
- Tailwind 3.4.13 + Framer Motion 11.11.1
- @react-pdf/renderer 4.0.0, recharts 2.13.0, resend 4.0.1
- lucide-react 0.451.0

**Routes (16 total):**
- Public: `/`, `/track`, `/payment/simulate`, `/payment/success`
- Dashboard: `/dashboard`, `/dashboard/login`, `/dashboard/diagnose`, `/dashboard/analytics`, `/dashboard/orders`, `/dashboard/products`, `/dashboard/sizes`
- API: `/api/diagnose`, `/api/export/orders`, `/api/invoice/[orderCode]`, `/api/payments/paymob/webhook`

**DB migrations to run in order:**
1. `supabase/schema.sql`
2. `supabase/migration_v2.sql` — order codes + workflow
3. `supabase/migration_v3.sql` — payments + timeline
4. `supabase/migration_v4.sql` — sizes + admin_users + cost fields
5. `supabase/migration_v5.sql` — products.category

**Post-migration setup:**
- Enable Realtime on the `orders` table (Database → Replication)
- Create admin user in Supabase Auth → Users
- `insert into admin_users (user_id, role) values ('<uuid>', 'admin');`

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

**Optional env vars:**
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_IFRAME_ID`, `PAYMOB_HMAC_SECRET`

**Known limitations:**
- `@react-pdf/renderer` does not natively reshape Arabic glyphs. Short Arabic labels render OK with embedded Cairo; long Arabic paragraphs in PDFs would need an `arabic-reshaper` pre-pass.
- Paymob is a scaffold — real API calls are commented out and need to be enabled once credentials are available.
- No email-verification flow for admin users beyond Supabase's built-in one.

**Build health:** Last verified Pass. 16 routes, home page 13.1 KB JS, analytics is largest at 109 KB (Recharts).
