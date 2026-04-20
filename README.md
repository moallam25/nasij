# NASIJ — نسيج (v3)

Production order-management platform for an Egyptian handmade tufted rug brand.

**Stack:** Next.js 14 App Router · Tailwind · Supabase · Framer Motion · Resend · Paymob (scaffold) · Arabic-first i18n

---

## 🚀 Quick start

```bash
npm install
cp .env.example .env.local        # fill in keys (see below)
```

In Supabase SQL editor, run **in order**:
1. `supabase/schema.sql`
2. `supabase/migration_v2.sql`
3. `supabase/migration_v3.sql`

In Supabase **Authentication → Users**, add an admin user (email + password).

```bash
npm run dev
```

| URL | Purpose |
|---|---|
| `/` | Arabic-first landing (toggle to EN top-right) |
| `/track?code=NAS-XXXXX` | Customer order tracking + payment |
| `/payment/simulate` | Dev-only fake checkout (active when Paymob keys missing) |
| `/payment/success` | Post-payment confirmation |
| `/dashboard` | Admin (login required, hidden from public UI) |
| `/api/payments/paymob/webhook` | Paymob server callback |

---

## 🔑 Environment variables

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Site URL — used in payment callbacks and email links
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Resend — email notifications. If empty, emails are no-op'd to console.
RESEND_API_KEY=
RESEND_FROM_EMAIL=NASIJ <noreply@yourdomain.com>

# Paymob — Egyptian payment gateway. If empty, "Pay Now" routes to /payment/simulate.
PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_IFRAME_ID=
PAYMOB_HMAC_SECRET=
```

---

## 🔄 Order workflow

```
Customer designs rug + submits
        ↓ status: pending_review
Admin reviews → sets price + notes (optionally emails customer)
        ↓ status: pricing_added
Admin clicks WhatsApp (auto-fills Arabic price message) OR customer sees price on /track
        ↓ status: waiting_customer_confirmation
Customer clicks "Pay Now" on /track → Paymob (or simulate)
        ↓ status: paid
Admin manually moves: in_production → delivered → completed
```

The customer can paste their `NAS-XXXXX` code on `/track` at any time to see:
- Current status with description
- Vertical 7-step timeline with timestamps
- Final price + Pay Now button
- Admin notes
- Their original design

---

## 💳 Enabling real Paymob payments

The Paymob integration is **scaffolded with the real code commented in**. To activate:

1. Get your Paymob credentials from https://accept.paymob.com (merchant approval required).
2. Add them to `.env.local`.
3. Open `src/lib/payments/paymob.ts` — find the comment block marked `REAL IMPLEMENTATION` and uncomment it. The 3-step Paymob flow (auth → register order → payment key → iframe redirect) is already written.
4. Implement HMAC verification in `verifyWebhook()` using `PAYMOB_HMAC_SECRET`. See https://developers.paymob.com/egypt/accept-standard-redirect/hmac-calculation
5. Configure your webhook URL in Paymob dashboard to: `https://yourdomain.com/api/payments/paymob/webhook`

Until enabled, "Pay Now" gracefully falls back to `/payment/simulate` so the full flow can be tested.

---

## 📧 Enabling real email

The notification system uses an **adapter pattern** — your code calls `notify.priceReady(order)`, never Resend directly.

To enable real sending:
1. Sign up at https://resend.com, verify a sending domain.
2. Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to `.env.local`.

Email templates live in `src/lib/notifications/templates.ts` (Arabic-first HTML, branded). Three are wired:
- `orderSubmitted` — when customer places order
- `priceReady` — when admin sets price (manually triggered from dashboard checkbox)
- `paymentSuccess` — when payment completes (auto)

To swap providers (e.g. SendGrid, Postmark): create a new adapter in `src/lib/notifications/index.ts` implementing `EmailAdapter`. No call sites need to change.

---

## 📁 Structure

```
src/
├── app/
│   ├── layout.tsx                   # LocaleProvider + Cairo/NotoKufi/Fraunces fonts
│   ├── page.tsx                     # Landing + sticky mobile CTA
│   ├── globals.css                  # RTL, Arabic fonts, soft shadows, weave bg
│   ├── track/page.tsx               # Order lookup with timeline + Pay Now
│   ├── payment/
│   │   ├── simulate/page.tsx        # Dev-only checkout (server action)
│   │   └── success/page.tsx         # Post-payment confirmation
│   ├── api/payments/paymob/webhook/route.ts
│   └── dashboard/                   # Admin (hidden from UI, middleware-protected)
├── components/
│   ├── Logo.tsx                     # Real logo via next/image
│   ├── Nav.tsx                      # i18n + lang toggle + track link
│   ├── Hero/About/Gallery/CustomBuilder/OrderForm/WhyNasij/Footer
│   ├── OrderSuccessModal.tsx        # NAS code reveal after submit
│   ├── OrderTimeline.tsx            # 7-step vertical timeline
│   └── RopeDivider.tsx
├── lib/
│   ├── i18n/
│   │   ├── dictionaries.ts          # Honest brand copy (no Cairo/2019/200+)
│   │   └── provider.tsx             # useLocale() + dir toggle + persistence
│   ├── notifications/
│   │   ├── index.ts                 # Adapter pattern + Resend impl
│   │   └── templates.ts             # Branded RTL HTML templates
│   ├── payments/
│   │   └── paymob.ts                # Provider class (real code commented in)
│   ├── actions/
│   │   └── payments.ts              # Server actions: initiate, simulate, notify
│   ├── order-utils.ts               # Statuses, WhatsApp builder, phone normalize
│   └── supabase/
│       ├── client.ts                # Browser client
│       ├── server.ts                # Server-component client
│       └── admin.ts                 # Service-role client (server-only)
└── middleware.ts                    # Protects /dashboard
```

---

## 🎨 Brand
Primary `#2F5D4A` · Secondary `#EAD9B6` · Accent `#D8B37A` · Cream `#FAF5EA`
Display: Fraunces (EN) / Noto Kufi Arabic (AR) · Body: Outfit (EN) / Cairo (AR)
Socials: [Instagram](https://www.instagram.com/nasij_eg/) · [TikTok](https://www.tiktok.com/@nasij_eg)

---

## ✅ Build verified
`npm run build` passes clean. All 12 routes compile including dynamic API routes and server actions.
