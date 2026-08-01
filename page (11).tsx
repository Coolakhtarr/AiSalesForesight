import MarketingNav from "@/components/marketing/MarketingNav";
import Footer from "@/components/marketing/Footer";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <MarketingNav />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-display text-2xl font-semibold mb-2">Terms of Service</h1>
        <p className="text-xs text-muted mb-8">Last updated: [DATE] — replace before launch</p>

        <p className="text-sm text-muted leading-relaxed mb-4">
          <strong>This is a starter draft, not a finished legal document.</strong> Have a lawyer
          review and finalize this before accepting real payments — this exists so the page isn't
          blank, not as legal advice.
        </p>

        <h2 className="font-display text-base font-semibold mt-8 mb-2">The service</h2>
        <p className="text-sm text-muted leading-relaxed mb-4">
          AiSalesForesight provides sales forecasting, inventory risk analysis, and AI-generated
          business insights based on data you upload or connect. Forecasts and recommendations are
          estimates, not guarantees — you're responsible for your own purchasing and pricing
          decisions.
        </p>

        <h2 className="font-display text-base font-semibold mt-8 mb-2">Subscriptions & billing</h2>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Paid plans renew automatically each billing cycle via Stripe or Razorpay until cancelled.
          You can cancel anytime from Settings → Billing; access continues until the end of the
          current billing period.
        </p>

        <h2 className="font-display text-base font-semibold mt-8 mb-2">Your data</h2>
        <p className="text-sm text-muted leading-relaxed mb-4">
          You retain ownership of the data you upload. We use it only to provide the service to
          you, as described in our <a href="/privacy" className="text-signal-teal">Privacy Policy</a>.
        </p>

        <h2 className="font-display text-base font-semibold mt-8 mb-2">Limitation of liability</h2>
        <p className="text-sm text-muted leading-relaxed mb-4">
          AiSalesForesight is provided "as is." We are not liable for business decisions made based
          on forecasts, insights, or chat responses — these are decision-support tools, not
          guarantees of outcome.
        </p>

        <h2 className="font-display text-base font-semibold mt-8 mb-2">Contact</h2>
        <p className="text-sm text-muted leading-relaxed">
          Questions: <a href="mailto:hello@aisalesforesight.com" className="text-signal-teal">hello@aisalesforesight.com</a>
        </p>
      </div>
      <Footer />
    </>
  );
}
