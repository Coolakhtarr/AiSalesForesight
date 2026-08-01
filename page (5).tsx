import MarketingNav from "@/components/marketing/MarketingNav";
import Hero from "@/components/marketing/Hero";
import HowItWorks from "@/components/marketing/HowItWorks";
import Features from "@/components/marketing/Features";
import Industries from "@/components/marketing/Industries";
import AIEasingWork from "@/components/marketing/AIEasingWork";
import DashboardPreview from "@/components/marketing/DashboardPreview";
import PricingPreview from "@/components/marketing/PricingPreview";
import FAQ from "@/components/marketing/FAQ";
import Footer from "@/components/marketing/Footer";

export default function LandingPage() {
  return (
    <>
      <MarketingNav />
      <Hero />
      <HowItWorks />
      <Features />
      <Industries />
      <AIEasingWork />
      <DashboardPreview />
      <PricingPreview />
      <FAQ />
      <Footer />
    </>
  );
}
