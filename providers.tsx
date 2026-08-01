"use client";

import { useEffect } from "react";
import { initPostHog } from "@/lib/posthog";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <>{children}</>;
}
