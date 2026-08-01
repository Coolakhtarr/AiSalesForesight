# Deploying AiSalesForesight — from scaffold to a live, findable website

This is the exact order to go from this codebase to a real URL that strangers
can search for, sign up on, and pay you through. Follow it top to bottom.

---

## 0. Before you start
- A GitHub account (push this codebase there — Vercel and Render both deploy
  from a GitHub repo).
- A Namecheap domain already purchased (you mentioned this is done).
- Accounts: Supabase, Vercel, Render (or Fly.io), Stripe, PostHog, Anthropic
  (for the chat assistant), Inngest.

Push the scaffold to GitHub first:
```bash
cd aisalesforesight
git init
git add .
git commit -m "Initial scaffold"
git branch -M main
git remote add origin https://github.com/<you>/aisalesforesight.git
git push -u origin main
```

---

## 1. Supabase (do this first — everything else depends on it)
1. Create a project at supabase.com → note the **Project URL**, **anon key**,
   **service role key** (Settings → API), and **JWT secret** (Settings → API
   → JWT Settings).
2. SQL Editor → paste and run `supabase/migrations/0001_init.sql`.
3. Storage → create a bucket named `raw-uploads`. Set it to **private** (not
   public) — files are only ever accessed via signed uploads/downloads.
4. Storage → Policies → add a policy on `raw-uploads` allowing authenticated
   users to `INSERT`/`SELECT` objects where the path starts with their
   `org_id` (mirrors the RLS pattern already in the SQL file).
5. Auth → Providers → Email is on by default. Decide now whether you want
   **email confirmation required** (Auth → Settings) — for a fast free-trial
   funnel, many SaaS products turn this off initially and turn it on once
   spam becomes a problem.
6. Auth → URL Configuration → set **Site URL** to your future production
   domain (e.g. `https://aisalesforesight.com`) once you know it, and add
   `http://localhost:3000` as an additional redirect URL for local dev.

---

## 2. FastAPI ML service (deploy this before the frontend, so you have its URL)
Render is the simplest option for a small always-on Python service.

1. Render.com → New → Web Service → connect your GitHub repo →
   root directory `fastapi-service`.
2. Build command: `pip install -r requirements.txt`
   Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Environment variables (Render → Environment):
   ```
   SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   SUPABASE_JWT_SECRET=...
   ANTHROPIC_API_KEY=...
   ```
4. Deploy. Once live, note the URL, e.g. `https://aisalesforesight-ml.onrender.com`.
5. Test it: `curl https://aisalesforesight-ml.onrender.com/health` should
   return `{"status":"ok"}`.
6. **Lock down CORS** before going live: in `app/main.py`, change
   `allow_origins=["*"]` to your actual frontend domain(s), e.g.
   `["https://aisalesforesight.com", "https://www.aisalesforesight.com"]`.

Note: Render's free tier spins down when idle, adding ~30s cold-start delay
to the first request after inactivity. Fine for early testing; upgrade to a
paid instance ($7/mo tier) before real users show up so uploads/chat don't
time out.

---

## 3. Payments — Stripe (international) and Razorpay (India/UPI)
This app uses two gateways, routed by currency, not one gateway for
everything — see `README.md` → "Multi-currency & multi-gateway billing" for
why. Set both up now; the checkout routes already expect both.

### 3a. Stripe — USD (default worldwide), AED, SAR
1. Dashboard → Products → create **Basic** and **Pro** products.
2. For each product, add **three separate recurring monthly prices** — one
   each in USD, AED, SAR (Stripe lets one product have many prices in
   different currencies). Copy all six **Price IDs** (`price_...`).
3. Developers → API keys → copy the **secret key** (`sk_test_...` while
   testing, `sk_live_...` once live).
4. Developers → Webhooks → Add endpoint → `https://<your-vercel-domain>/api/stripe/webhook`
   → subscribe to `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted` → copy the **signing secret** (`whsec_...`).
5. Map all six Price IDs + the secret key + webhook secret into the
   `STRIPE_PRICE_BASIC_USD` / `_AED` / `_SAR` and `STRIPE_PRICE_PRO_*` /
   `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` env vars (see `.env.example`
   in `nextjs-app/`).
6. Test with card `4242 4242 4242 4242` in test mode before flipping live.

### 3b. Razorpay — INR, UPI/cards/netbanking for Indian customers
1. Create a Razorpay account at razorpay.com — you'll need a registered
   Indian business entity (proprietorship is fine) and basic KYC documents;
   approval typically takes 1–3 business days.
2. Dashboard → Subscriptions → Plans → create a **Basic** plan and a **Pro**
   plan, each with a monthly INR amount and billing interval → copy both
   **Plan IDs** (`plan_...`).
3. Settings → API Keys → generate a **Key ID** and **Key Secret**
   (`rzp_test_...` while testing, `rzp_live_...` once approved for live).
4. Settings → Webhooks → Add webhook → URL:
   `https://<your-vercel-domain>/api/razorpay/webhook` → select
   `subscription.activated`, `subscription.cancelled`, `subscription.completed`
   → set a webhook secret and copy it.
5. Map into env vars: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
   `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_BASIC`, `RAZORPAY_PLAN_PRO`.
6. UPI needs no separate integration — Razorpay's checkout widget shows UPI
   as a payment option automatically once the account is approved for live
   payments; test mode uses Razorpay's test UPI simulator.
7. Add `razorpay` to `nextjs-app/package.json` (`npm install razorpay`) —
   it's used server-side in `app/api/razorpay/checkout` and the webhook route.

### 3c. GST / invoicing note for India
If you're registered for GST, Razorpay's invoicing can auto-apply it on
receipts. If you're not registered yet and monthly revenue is still small,
you can operate without GST registration up to the current threshold — this
is a real compliance question worth a 15-minute call with a CA once you have
paying customers, not something to guess at.

---

## 4. Next.js frontend on Vercel
1. In `nextjs-app/`, scaffold the actual Next.js project if you haven't:
   ```bash
   npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
   npm install @supabase/ssr @supabase/supabase-js posthog-js stripe recharts lucide-react
   ```
   Then copy in the provided `app/`, `components/`, `lib/`, `middleware.ts`,
   and `tailwind.config.ts` files from this scaffold (overwrite the
   generated defaults).
2. Push to GitHub, then Vercel → New Project → import the repo → set root
   directory to `nextjs-app` if it's a subfolder of a monorepo.
3. Environment variables (Vercel → Settings → Environment Variables) — see
   `nextjs-app/.env.example` for the full, current list (Supabase, ML
   service URL, PostHog, Stripe with per-currency Price IDs, and Razorpay).
4. Deploy. Vercel gives you a `*.vercel.app` URL immediately — test the full
   signup → onboarding → dashboard flow there before touching DNS.
5. Go back to Stripe and Razorpay (step 3) and update both webhook URLs to
   your real Vercel URL if you set them up before deploying.

---

## 5. Connect your Namecheap domain
1. Vercel → Project → Settings → Domains → add `aisalesforesight.com` (and
   `www.aisalesforesight.com`).
2. Vercel shows you exact DNS records to add (usually an `A` record for the
   apex domain pointing to `76.76.21.21`, and a `CNAME` for `www` pointing to
   `cname.vercel-dns.com` — Vercel's UI gives you the current values).
3. Namecheap → Domain List → Manage → Advanced DNS → add those records
   exactly as Vercel shows them. Remove any conflicting default Namecheap
   "parking page" records.
4. DNS propagation takes anywhere from a few minutes to ~24 hours. Vercel's
   Domains tab shows a green checkmark once it's verified and HTTPS is
   issued automatically.
5. Update `NEXT_PUBLIC_APP_URL`, Supabase Auth Site URL, and both the
   Stripe and Razorpay webhook URLs to the final `https://aisalesforesight.com`
   once DNS is live.

---

## 6. Inngest (scheduled jobs)
1. Create an Inngest account, get an **Event Key**.
2. The simplest MVP approach: skip building actual Inngest functions
   initially, and use **Render's own Cron Jobs** feature (Render → New →
   Cron Job) to `curl` your FastAPI job endpoints on a schedule:
   ```
   # nightly, 2am UTC
   curl -X POST https://aisalesforesight-ml.onrender.com/jobs/trends/run \
     -H "Authorization: Bearer <a service-level token per org>"
   ```
   Because these endpoints currently expect a per-user JWT, the cleanest
   path is to add one internal endpoint that loops over all orgs using the
   service-role key directly (bypassing the per-request JWT check) — flag
   this as a near-term follow-up once you have more than a couple of orgs.
3. Once you have real usage, move to actual Inngest functions for retries,
   observability, and fan-out across orgs — the FastAPI endpoints are
   already shaped to be called that way (one org at a time).

---

## 7. Making the site actually findable via search
This app already ships with `app/robots.ts` and `app/sitemap.ts` and rich
`metadata` in `app/layout.tsx` (title, description, Open Graph, Twitter
card). To turn that into real Google visibility:

1. **Google Search Console** (search.google.com/search-console) → add your
   domain → verify ownership (Vercel supports DNS verification directly, or
   use the HTML meta tag method by adding it to `app/layout.tsx`).
2. Submit your sitemap: `https://aisalesforesight.com/sitemap.xml`.
3. Request indexing for the homepage URL directly — this can get you into
   Google's index within a day or two instead of waiting for organic
   crawling.
4. **Bing Webmaster Tools** — same process, smaller but free extra reach,
   and Bing results also feed some AI answer engines.
5. Write 2–3 short blog-style pages targeting long-tail search terms your
   buyers actually type — e.g. "how to reduce overstock in a small retail
   store", "reorder point formula for small business". These convert far
   better than the homepage for cold organic traffic. Add them under
   `app/blog/...` and list them in `sitemap.ts`.
6. Make sure `metadataBase` in `app/layout.tsx` matches your real domain
   exactly (already set to a placeholder — update it once DNS is live).
7. Get a handful of real backlinks early: a Product Hunt launch, a
   relevant subreddit (r/ecommerce, r/smallbusiness — read each community's
   self-promotion rules first), and your own LinkedIn posts all count.

None of this requires paid ads to start showing up in search — it just
takes a few days to weeks after indexing for rankings to stabilize.

---

## 8. PostHog
1. Create a project at posthog.com (or self-host later) → copy the
   **Project API Key**.
2. Add `NEXT_PUBLIC_POSTHOG_KEY` to Vercel env vars (already listed above).
3. Call `initPostHog()` once in a top-level client component
   (`app/providers.tsx`, wrapped around `{children}` in `app/layout.tsx`) so
   it initializes on every page load.
4. The `track()` calls are already wired into signup, onboarding upload,
   chat, and checkout — check PostHog's **Activity** tab after a test
   signup to confirm events are arriving.
5. Once live, set up a simple funnel in PostHog: `signup_completed` →
   `upload_completed` → `onboarding_completed` → `checkout_started`. This
   tells you exactly where free-trial users are dropping off, which matters
   more than any other early metric.

---

## 9. Pre-launch checklist
- [ ] Full signup → onboarding → upload → dashboard flow works on the real
      domain, not just localhost.
- [ ] Stripe test-mode checkout completes and `subscriptions` table updates
      correctly, then re-verify in live mode with a real card.
- [ ] FastAPI CORS restricted to your real domain (not `*`).
- [ ] RLS actually blocks cross-org access — test by creating two accounts
      and confirming neither can see the other's `products`/`sales` rows.
- [ ] Privacy Policy and Terms pages exist (even simple ones) — link them
      in the footer; Stripe and most ad platforms require these before
      you can run ads or process payments at scale.
- [ ] robots.txt correctly blocks `/dashboard`, `/products`, etc. from being
      indexed (already configured) so private app pages don't show up in
      search results.
- [ ] Google Search Console verified and sitemap submitted.
- [ ] PostHog events confirmed arriving.

---

## 10. When you're ready for LinkedIn outreach and ads (later)
A few things worth having in place before that push, not now:
- A **/demo** or **/free-trial** landing variant with UTM-friendly URLs
  (e.g. `?utm_source=linkedin&utm_campaign=founder_outreach`) so PostHog can
  tell you which channel actually converts.
- Screenshots or a 30-second screen recording of the dashboard for the
  LinkedIn post itself — posts with visuals outperform text-only ones
  substantially.
- A short case-study-style post converts far better than a generic "check
  out my SaaS" post — but only send one once you have a *real* number from
  a real account. Don't lead with a fabricated statistic; it's the fastest
  way to lose credibility with exactly the skeptical buyer you're trying to
  win over.

### A 10-minute demo script for when someone says yes
1. **Ask for their export first** (or use a sample if they're hesitant) —
   "Send me a CSV of your last 3 months of sales, any format is fine, I'll
   clean it up." This removes the biggest friction point (a blank product
   with no data looks unimpressive).
2. **Upload it live on a call, or async and follow up** — walk through
   Dashboard → point at the Action Center first, not the charts. The
   Action Center is the "so what" — it's what makes this different from a
   generic BI dashboard.
3. **Open one flagged product** — read its `revenue_at_risk` number out
   loud. Concrete numbers land harder than "AI-powered forecasting."
4. **Show the chat assistant last** — ask it something specific to their
   data live ("why did sales drop in [month]"), so they see it's grounded
   in their own numbers, not a canned demo response.
5. **Close with the free trial link**, not a hard sell — "This is free for
   14 days, no card. If it's useful, the Basic plan is [price]/month."

I drafted three LinkedIn message variants for you above — pick based on
whether you're leading with the problem, a real result, or a low-pressure
ask.
