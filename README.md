# AiSalesForesight — Starter Scaffold

This is Phase 1 (core scaffold) of the AiSalesForesight architecture, plus
stubs for Phases 2–4. See `DESIGN.md` for the full product/architecture plan,
`DEPLOY.md` for the full paid-stack deployment guide, and `FREE_DEPLOY.md`
if you want to launch at $0 upfront cost (Cloudflare Pages instead of
Vercel — Vercel's free tier prohibits commercial use, Cloudflare's doesn't).

## Structure
```
supabase/migrations/0001_init.sql   -- full Postgres schema + RLS policies
supabase/migrations/0002_advanced_features.sql -- suppliers, purchase orders, notifications log
supabase/seeds/india_festival_calendar.sql      -- Diwali/Holi/etc. seed data
fastapi-service/                    -- Python ML/analytics microservice
  app/main.py                       -- FastAPI app + routers
  app/core/auth.py                  -- Supabase JWT verification -> org_id
  app/core/config.py                -- env config + service-role Supabase client
  app/services/data_prep.py         -- CSV/XLSX cleaning + feature engineering
  app/routers/ingest.py             -- /ingest/start: raw file -> clean tables
  app/routers/forecast.py           -- /forecast/run: baseline forecasting
  app/routers/insights.py           -- /insights/risk/run: reorder/overstock logic
  app/routers/chat.py               -- /chat/: context-grounded AI assistant
  app/routers/jobs.py               -- trend/promo/elasticity/rebalance stubs
nextjs-app/
  tailwind.config.ts                -- design tokens (ink/panel/signal colors, fonts)
  app/globals.css                   -- focus states, scrollbars, reduced-motion
  app/layout.tsx                    -- root layout, loads Inter Tight/Inter/IBM Plex Mono
  lib/supabaseClient.ts             -- browser Supabase client
  lib/supabaseServer.ts             -- server-component Supabase client (RLS-scoped)
  lib/posthog.ts                    -- PostHog init + track()
  app/api/stripe/checkout/route.ts  -- Stripe Checkout session creation
  app/api/stripe/webhook/route.ts   -- Stripe webhook -> subscriptions table
  app/dashboard/page.tsx            -- KPIs, forecast chart, Action Center
  app/products/page.tsx             -- filterable/sortable products table
  app/insights/page.tsx             -- trends, promo impact, price sensitivity, hidden gems
  app/settings/billing/page.tsx     -- org info, plan cards, manage-billing portal link
  app/onboarding/page.tsx           -- 3-step wizard (sales upload -> inventory -> store info)
  app/login/page.tsx, app/signup/page.tsx -- Supabase email+password auth
  app/page.tsx                      -- public landing page (hero, how it works, features, pricing, FAQ)
  middleware.ts                     -- redirects unauthenticated users away from app routes
  components/layout/                -- AppShell, Sidebar, Topbar
  components/ui/                    -- KpiCard, RiskBadge
  components/charts/                -- HorizonLine (signature sparkline), ForecastChart (recharts)
  components/dashboard/ActionCenter.tsx
  components/products/ProductsTable.tsx
  app/purchase-orders/page.tsx      -- draft PO list, generated from the reorder list
  components/insights/              -- InsightCard, ElasticityScatter, WhatIfSimulator
  components/purchase-orders/       -- GeneratePOButton, PurchaseOrderCard
  components/billing/               -- PlanCard, BillingActions (multi-currency), CurrencySelector, ManageBillingButton
  lib/pricing.ts                     -- per-currency prices + gateway routing
  components/auth/AuthCard.tsx
  components/marketing/             -- Hero, HeroBackground, HowItWorks, Features, Industries, AIEasingWork, DashboardPreview, PricingPreview, FAQ, Footer, MarketingNav
  components/ChatWidget.tsx         -- chat UI wired to FastAPI /chat
  components/onboarding/UploadStep.tsx -- file upload -> ingest trigger
```

### Advanced features (Tier 1 monetization set)
- **Auto-drafted purchase orders** (`fastapi-service/app/routers/purchase_orders.py`,
  `app/purchase-orders/page.tsx`) — turns every "Reorder now" product into a
  grouped-by-supplier draft PO with quantity, cost, and reasoning. This is
  the strongest lever for converting a trial user into a paying one.
- **WhatsApp reorder alerts + weekly email digest**
  (`fastapi-service/app/routers/notifications.py`) — structured to plug in
  Twilio (WhatsApp) and Resend (email) credentials; both are safe no-ops if
  those env vars aren't set.
- **Festival-aware forecasting** (`jobs.py` → `/jobs/festival-watch/run`,
  seeded via `supabase/seeds/india_festival_calendar.sql`) — checks each
  product's sales around Diwali/Holi/etc. last year and flags a reorder
  reminder if there was a genuine historical spike.
- **Bundle / cross-sell detection** (`jobs.py` → `/jobs/bundles/run`) — basic
  market-basket analysis over `order_id`.
- **Cannibalization detection** (`jobs.py` → `/jobs/cannibalization/run`).
- **What-if price simulator** (`components/insights/WhatIfSimulator.tsx`) —
  slider using the stored elasticity coefficient to project a price change's
  effect on units and revenue.
- **Suppliers & per-product lead times** — `suppliers` table plus
  `products.supplier_id` / `products.lead_time_days`.

To wire notifications up for real: set `TWILIO_ACCOUNT_SID`,
`TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` and/or `RESEND_API_KEY`,
`RESEND_FROM_EMAIL` in the FastAPI service's environment.

### Multi-currency & multi-gateway billing
As of 2026, Stripe doesn't support UPI or domestic INR settlement well for
most merchants (India onboarding is invite-only, cross-border-cards-only),
while Razorpay is the standard, purpose-built option for UPI/INR. So this
app uses **two gateways routed by currency**, not one gateway for everything:

- **Razorpay** — Indian customers, INR, UPI/cards/netbanking
  (`app/api/razorpay/checkout`, `app/api/razorpay/webhook`).
- **Stripe** — everyone else — USD (default worldwide), AED (UAE), SAR
  (Saudi Arabia) — one Stripe Price ID per currency per plan
  (`app/api/stripe/checkout`, `app/api/stripe/webhook`).

`lib/pricing.ts` holds per-currency prices (set independently, not a raw FX
conversion — standard SaaS practice) and maps a detected country to a
default currency. `components/billing/CurrencySelector.tsx` lets the buyer
override that default on both the public pricing section and the in-app
billing page. See `.env.example` for all required keys on both providers.

Add `razorpay` to `package.json` dependencies (`npm install razorpay`) —
it's used server-side in the checkout/webhook routes.

**Edge-runtime note:** the Stripe and Razorpay routes use fetch-based HTTP
clients and Web Crypto (not Node's `crypto`/`axios`) specifically so they
work unmodified on Cloudflare Pages' edge runtime — see `FREE_DEPLOY.md`.
No `razorpay` npm package is needed; the checkout route calls Razorpay's
REST API directly via `fetch`.

### Design system
Dark base (`ink`/`panel`/`line`) with a 4-color **status** palette (`signal.teal`
healthy, `signal.amber` at-risk, `signal.coral` reorder-now, `signal.violet`
overstock) used consistently for badges, KPI accents, and chart colors —
see `tailwind.config.ts`. Headings use Inter Tight, body uses Inter, and every
number (KPIs, table figures) uses IBM Plex Mono. The recurring signature
element is `HorizonLine` — a sparkline where historical data is a solid
stroke and forecasted data continues as a dashed stroke in the same color;
the landing page hero echoes this at scale with an ambient animated field
of the same lines (`HeroBackground`, respects `prefers-reduced-motion`).

### Auth flow
`middleware.ts` protects `/dashboard`, `/products`, `/insights`, `/chat`,
`/settings`, `/onboarding` — unauthenticated visitors are redirected to
`/login` with a `redirectTo` param. `/signup` creates a Supabase auth user
and sends them to `/onboarding`, which creates their `organizations` +
`memberships` rows on first use.

Install additional deps for these pages: `recharts`, `lucide-react`,
`@supabase/ssr`, `@supabase/supabase-js`, `stripe`. Google fonts are pulled
via `next/font/google` (no manual font files needed).

## Setup order
1. **Supabase**: create a project, run `supabase/migrations/0001_init.sql`
   in the SQL editor, create a public Storage bucket named `raw-uploads`.
2. **FastAPI service**: `cd fastapi-service && pip install -r requirements.txt`,
   copy `.env.example` to `.env` and fill in your Supabase keys + Anthropic key,
   then `uvicorn app.main:app --reload`. Deploy to Render/Fly for production.
3. **Next.js app**: scaffold with `npx create-next-app@latest` inside
   `nextjs-app/` (App Router + Tailwind), then drop in the provided
   `lib/` and `components/` files, install `@supabase/ssr`, `@supabase/supabase-js`,
   `posthog-js`, `stripe`. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `NEXT_PUBLIC_ML_SERVICE_URL`, `NEXT_PUBLIC_POSTHOG_KEY`, Stripe keys/price IDs.
4. **Stripe**: create Basic/Pro products+prices, point a webhook at
   `/api/stripe/webhook` for `checkout.session.completed` and
   `customer.subscription.*` events.
5. **Inngest**: wire cron functions to call `/jobs/*` and `/forecast/run`
   on your chosen schedule (nightly/weekly/monthly per DESIGN.md section 3).
6. **Domain**: point your Namecheap domain's DNS to Vercel per Vercel's
   custom-domain instructions, then add it in the Vercel project settings.

## Next steps (Phase 2+)
- Build the dashboard/products pages reading from `inventory_insights`,
  `forecasts`, `analytics_insights` via the Supabase client (RLS-scoped).
- Replace the baseline forecaster in `forecast.py` with a trained LightGBM
  model once you have enough historical weeks per product.
- Implement the `jobs.py` TODOs (promo impact, elasticity, rebalance,
  hidden gems) using the algorithms described in `DESIGN.md` section 3.
