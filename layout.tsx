import type { Metadata } from "next";
import { Inter, Inter_Tight, IBM_Plex_Mono } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", weight: ["500", "600", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-plex-mono", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://aisalesforesight.com"),
  title: {
    default: "AiSalesForesight — AI Sales & Inventory Forecasting for Retailers",
    template: "%s | AiSalesForesight",
  },
  description:
    "Upload your past sales data and get AI-powered demand forecasts, reorder alerts, overstock warnings, and a chat assistant that explains what to do next. Built for small and mid-size retailers and e-commerce sellers.",
  keywords: [
    "inventory forecasting software",
    "demand forecasting for small business",
    "AI inventory management",
    "reorder point calculator",
    "retail sales forecasting",
    "stockout prevention",
  ],
  openGraph: {
    title: "AiSalesForesight — Your AI copilot for sales & inventory decisions",
    description:
      "Stop reacting after stockouts and dead stock happen. Get AI forecasts, risk alerts, and a chat assistant grounded in your own sales data.",
    url: "https://aisalesforesight.com",
    siteName: "AiSalesForesight",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AiSalesForesight — Your AI copilot for sales & inventory decisions",
    description: "Upload your sales data. Get forecasts, reorder alerts, and AI-explained recommendations.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${interTight.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="bg-ink text-foreground font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
