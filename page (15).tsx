import MarketingNav from "@/components/marketing/MarketingNav";
import Footer from "@/components/marketing/Footer";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <MarketingNav />
      <div className="max-w-2xl mx-auto px-6 py-16 prose prose-invert prose-sm">
        <h1 className="font-display text-2xl font-semibold mb-2">Privacy Policy</h1>
        <p className="text-xs text-muted mb-8">Last updated: [DATE] — replace before launch</p>

        <p className="text-sm text-muted leading-relaxed mb-4">
          <strong>This is a starter draft, not a finished legal document.</strong> Have a lawyer
          (or a service like Termly/Rocket Lawyer) review and finalize this before accepting real
          payments or real customer data — this section exists so the page isn't blank, not as
          legal advice.
        </p>

        <h2 className="font-display text-base font-semibold mt-8 mb-2">What we collect</h2>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Account information (name, email), the sales and inventory data you upload, and usage
          analytics (pages viewed, features used) via PostHog.
        </p>

        <h2 className="font-display text-base font-semibold mt-8 mb-2">How we use it</h2>
        <p className="text-sm text-muted leading-relaxed mb-4">
          To provide forecasts and insights on your own data, to process subscription payments via
          Stripe or Razorpay, and to improve the product. We do not sell your data.
        </p>

        <h2 className="font-display text-base font-semibold mt-8 mb-2">Data isolation</h2>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Every organization's data is isolated at the database level using row-level security —
          no other customer's account can query or view your data.
        </p>

        <h2 className="font-display text-base font-semibold mt-8 mb-2">Third parties</h2>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Supabase (database/storage), Stripe and Razorpay (payments), Anthropic (AI chat
          responses), PostHog (analytics), Twilio (WhatsApp alerts, if enabled), Resend (email, if
          enabled).
        </p>

        <h2 className="font-display text-base font-semibold mt-8 mb-2">Contact</h2>
        <p className="text-sm text-muted leading-relaxed">
          Questions about this policy: <a href="mailto:hello@aisalesforesight.com" className="text-signal-teal">hello@aisalesforesight.com</a>
        </p>
      </div>
      <Footer />
    </>
  );
}
