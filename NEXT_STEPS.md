# AiSalesForesight — Final Status & Next Steps

This file exists so you (or Claude Code) can pick this project up cold and
know exactly what's real, what's a stub, and what to do next. Read this
before `README.md`, `DESIGN.md`, or `DEPLOY.md` — those go deeper on each
topic this summarizes.

---

## ✅ What's fully built and working

**Data pipeline**
- CSV/Excel ingest → cleaning → `products`/`sales`/`inventory_snapshots` tables
- Baseline (moving-average) demand forecasting
- Reorder-point / safety-stock inventory risk scoring
- 7 analytics jobs with real logic: trend detection, cannibalization,
  promotion impact, price elasticity, stock rebalancing, hidden gems,
  festival-demand watch (India-specific)
- Bundle/cross-sell (market-basket) detection

**Monetization features**
- Auto-drafted purchase orders, grouped by supplier, with PDF export and
  email-to-supplier (Resend) — fully wired end to end
- WhatsApp reorder alerts + weekly email digest (Twilio/Resend, safe no-op
  without credentials configured)
- Suppliers management page + per-product supplier assignment
- What-if price simulator using stored elasticity data

**Billing**
- Dual-gateway multi-currency billing: Razorpay (INR/UPI/cards/netbanking)
  for India, Stripe (USD/AED/SAR) for everywhere else
- Currency selector on both the public pricing page and in-app billing page
- Webhooks for both providers updating the `subscriptions` table

**Full app surface**
- Public landing page: hero, how-it-works, features, industries (honest
  per-industry fit), AI-easing-work section, dashboard preview, pricing, FAQ
- Auth: signup/login, middleware route protection, onboarding wizard
- Dashboard, Products (with supplier assignment), Purchase Orders, Insights,
  Chat (now with real multi-turn conversation memory), Settings (Billing /
  Notifications / Suppliers tabs)
- Privacy Policy and Terms pages (starter drafts — flagged for legal review)
- SEO: robots.ts, sitemap.ts, full Open Graph/Twitter metadata
- PostHog wired via `app/providers.tsx` (this was missing until now — fixed)

**AI chat assistant**
- Context-grounded (not fine-tuned — see the explanation earlier in this
  conversation for why that's the right call)
- Now has real multi-turn memory within a session — this was the one actual
  gap in the "upgrade the AI" ask, and it's fixed in `chat.py`

---

## ⚠️ What's a deliberate stub, and why

- **Inngest** — cron scheduling is documented as a Render-cron-job pattern
  in `DEPLOY.md` rather than full Inngest functions, because real Inngest
  wiring isn't worth the setup time before you have real orgs generating
  jobs to run. Swap in when usage justifies it.
- **Privacy/Terms pages** — real starter content, explicitly marked as
  needing a lawyer's review before you take real payments. Don't skip this.
- **Blog pages for SEO** — mentioned in `DEPLOY.md` as a recommended next
  step, not built, since the content itself needs to come from you (real
  domain expertise reads better than generated filler for this kind of
  long-tail SEO content).

## ❌ What's genuinely not started (your call on priority)

- Live Shopify/WooCommerce connectors (Tier 1 idea from earlier — biggest
  remaining lever for retention, since it removes the manual re-upload step)
- Accounting software sync (Tally/Zoho Books) for automatic `unit_cost` data
- Supplier scorecards (tracking actual vs promised lead time)
- Multi-user roles UI (the `memberships.role` column exists in the schema;
  there's no invite-a-teammate UI yet)
- Embedded financing / competitor price tracking (Tier 3 ideas — correctly
  low priority until you have paying customers)

---

## Exact next commands (in order)

```bash
# 1. Get it running locally
cd aisalesforesight/nextjs-app
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
npm install @supabase/ssr @supabase/supabase-js posthog-js stripe razorpay recharts lucide-react
cp .env.example .env.local   # fill in real values

cd ../fastapi-service
pip install -r requirements.txt --break-system-packages
cp .env.example .env         # fill in real values
uvicorn app.main:app --reload

# 2. Run the Supabase migrations, in order
#    0001_init.sql -> 0002_advanced_features.sql -> seeds/india_festival_calendar.sql

# 3. Sign up through your own onboarding flow with fake data,
#    confirm the full loop: upload -> dashboard -> products -> purchase orders -> chat

# 4. Follow DEPLOY.md sections 1-9 to go live on your real domain
```

---

## LinkedIn outreach — ready to use

Three message variants (specific/credible, result-led, short/low-pressure)
were drafted in-chat and are ready to copy. **One honest flag on the
"result-led" variant**: it references a specific number (₹40,000 in dead
stock found) — only use that framing once you've actually run the tool on
real or sample data and gotten a real number. Don't send a fabricated
result; use the "specific & credible" or "short & low-pressure" variant
until you have one.

Demo script for the actual call/screen-share, once someone says yes:
1. Show the upload step — "this is the only setup, a CSV you already have."
2. Jump straight to Products page filtered to "Reorder Now" — this is the
   moment that lands, because it's specific to *their* data, not a canned
   demo.
3. Show the auto-generated Purchase Order — "this is a draft, ready to
   send, in one click."
4. End on the AI chat — ask it something in front of them, live, so they
   see it's grounded in their own numbers, not a script.
