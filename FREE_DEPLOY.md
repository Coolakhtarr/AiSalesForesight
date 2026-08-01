# Deploying AiSalesForesight for $0 — Cloudflare Pages instead of Vercel

`DEPLOY.md` was written around Vercel. Vercel's free **Hobby** tier explicitly
prohibits commercial use in its Terms of Service — the day you turn on real
subscriptions, you're technically required to be on the $20/month Pro plan.
This guide swaps the frontend host for **Cloudflare Pages**, whose free tier
explicitly *does* allow commercial use (unlimited bandwidth, no credit card).
Everything else in `DEPLOY.md` (Supabase, Render, Stripe, Razorpay, PostHog)
stays the same — only the frontend hosting step changes.

## What's genuinely $0 in this stack
| Piece | Free option | The catch |
|---|---|---|
| Frontend hosting | Cloudflare Pages | Needs the Next.js edge adapter (below) — a few features (long-running Node APIs) aren't available on the edge runtime, but nothing this app uses hits that. |
| Database/Auth/Storage | Supabase free tier | Free projects pause after ~1 week of no activity — a cron ping or just using it daily avoids this. |
| ML service (FastAPI) | Render free Web Service | Spins down when idle; first request after inactivity takes ~30-50s to wake up. Fine for testing, worth upgrading ($7/mo) once real users show up. |
| Payments | Stripe / Razorpay | No upfront cost either way — they only take a % per transaction, so this is $0 until you actually earn money. |
| Product analytics | PostHog free tier | Generous free event allowance for an early-stage product. |
| AI chat (Claude API) | **Not free** | Pay-per-token, but genuinely cheap at low volume (a few dollars for hundreds of chat messages). This is the one real running cost — budget ~$5–10 to start, or leave the chat feature off until you want to fund it. |
| Scheduled jobs (nightly/weekly analytics) | **GitHub Actions** | 2,000 free minutes/month on a private repo (unlimited on public) — each job run takes seconds, so this is free at any realistic early-stage volume. See below; this replaces the Render Cron approach from `DEPLOY.md`, since Render's cron pricing is changing (see note below). |
| Email notifications (weekly digest) | **Resend free tier** | Real free monthly allowance — check resend.com/pricing for the current number, it's periodically adjusted. |
| WhatsApp reorder alerts | **Not free — budget for this or skip it initially** | Meta retired the old free monthly conversation allotment in 2025. The alerts this app sends are business-initiated (not a customer reply), so Meta bills per message from the first one, plus whatever your BSP (Twilio etc.) adds on top. Keep this off until you're ready to fund it — email is the $0 notification channel. |
| Domain name | **Not free** | See below — there's no reliable free option left in 2026. |

**A note on Render specifically:** as of today, Render appears to be
mid-transition on its pricing model, and cron jobs look like they're moving
toward paid, not free (per-minute billing tied to a paid instance type).
Rather than depend on that, this guide uses **GitHub Actions** for all
scheduling instead — genuinely free regardless of what Render does next,
and it's already wired into this scaffold (see below). Render is still used
for the *always-on* FastAPI web service itself (the 750 free hours/month
covers one instance running continuously almost the whole month).

## Scheduling jobs for free — GitHub Actions instead of Render Cron
Two workflow files are already in `.github/workflows/`:
- **`scheduled-jobs.yml`** — runs inventory-risk scoring + forecasting
  daily, the full analytics suite (trends, promos, elasticity, bundles,
  festival-watch, etc.) weekly, and the email digest weekly. Each step just
  `curl`s an internal FastAPI endpoint.
- **`keep-supabase-awake.yml`** — pings Supabase every 4 days so the free
  project never auto-pauses from inactivity.

To activate them:
1. On the FastAPI service (Render), set an env var `INTERNAL_JOBS_SECRET`
   to any long random string — this protects the scheduler-only endpoints
   in `app/routers/internal.py` from being called by anyone else.
2. In your GitHub repo → Settings → Secrets and variables → Actions, add:
   - `ML_SERVICE_URL` — your Render service URL
   - `INTERNAL_JOBS_SECRET` — the same value as step 1
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY` — for the keep-alive ping
3. That's it — GitHub runs both workflows on their schedules automatically.
   You can also trigger either manually from the repo's Actions tab
   (`workflow_dispatch`) to test them before waiting for the schedule.

## The domain — the honest answer
There's no trustworthy free-domain option anymore (the old "free .tk/.ml"
services largely shut down). Two real choices:
1. **Start with the free subdomain Cloudflare gives you** —
   `aisalesforesight.pages.dev` — costs nothing, works immediately, fine for
   testing and even your first few LinkedIn outreach messages.
2. **Buy the cheapest real domain once you're ready to look professional** —
   Namecheap regularly runs first-year promos on `.shop`/`.store`/`.xyz`
   TLDs for $1–3, or a `.com` typically runs $10–15/year. This is a one-time
   small cost, not a recurring hosting fee — worth it once you're sending
   the site to strangers, since a `.pages.dev` URL reads as unfinished to a
   skeptical buyer.

## Deploying the frontend on Cloudflare Pages
**Code changes already made in this scaffold** so it runs correctly on
Cloudflare's edge runtime, not just Vercel's Node runtime:
- Every API route under `app/api/stripe/*` and `app/api/razorpay/*` has
  `export const runtime = "edge"`.
- Stripe routes use `Stripe.createFetchHttpClient()` and
  `constructEventAsync` instead of the default Node-based client — required
  because the default Stripe client uses Node's `http`/`crypto` modules
  directly, which don't exist on edge runtimes.
- The Razorpay checkout route calls Razorpay's REST API directly via
  `fetch()` instead of the `razorpay` npm package, and the webhook route
  verifies signatures with Web Crypto (`crypto.subtle`) instead of Node's
  `crypto` module — both npm packages depend on Node internals that are
  unreliable on edge runtimes even with a compatibility flag enabled.

None of this changes behavior — it's the same Stripe/Razorpay integrations,
just built on APIs that exist in every JS runtime instead of Node-only ones.

1. Install the Next.js edge adapter:
   ```bash
   cd nextjs-app
   npm install --save-dev @cloudflare/next-on-pages
   ```
2. `wrangler.toml` is already added to this scaffold — it points Cloudflare
   at the correct build output directory.
3. Push the repo to GitHub (same as the original guide).
4. Cloudflare dashboard → Workers & Pages → Create → Pages → connect your
   GitHub repo.
5. Build settings:
   ```
   Build command: npx @cloudflare/next-on-pages
   Build output directory: .vercel/output/static
   Root directory: nextjs-app   (if it's a subfolder)
   ```
6. Add the same environment variables listed in `nextjs-app/.env.example`
   under Pages → Settings → Environment Variables.
7. Deploy. You get a free `*.pages.dev` URL immediately — test the full
   signup → onboarding → dashboard flow there.
8. **Custom domain** (once you've bought one, or if you already own the
   Namecheap domain from the original plan): Pages → Custom Domains → add
   it → Cloudflare shows you the exact DNS records → add them at Namecheap
   → Advanced DNS (same pattern as the original Vercel guide, different
   record values).

## Everything else — unchanged
Follow `DEPLOY.md` sections 1 (Supabase), 2 (FastAPI/Render), 3
(Stripe/Razorpay), 6 (Inngest/cron), 7 (SEO), 8 (PostHog), and 9 (pre-launch
checklist) exactly as written — none of that depends on which frontend host
you use. Only section 4 (Vercel) and the domain-connection parts of section
5 are replaced by this file.

## If you decide Vercel is still worth it later
Nothing here rules Vercel out — some teams do stay on Hobby quietly at tiny
scale and upgrade once revenue justifies $20/month, since Vercel's Next.js
integration is the most polished available. Just make that a deliberate
choice once you're generating revenue, not a default you didn't know about.
