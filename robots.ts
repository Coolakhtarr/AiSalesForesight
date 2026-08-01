import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard", "/products", "/insights", "/chat", "/settings", "/onboarding"] },
    ],
    sitemap: "https://aisalesforesight.com/sitemap.xml",
  };
}
