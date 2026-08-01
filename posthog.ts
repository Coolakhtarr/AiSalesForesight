import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window === "undefined") return;
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    capture_pageview: true,
  });
}

export function track(event: string, properties?: Record<string, unknown>) {
  posthog.capture(event, properties);
}

// Example events to fire throughout the app:
//   track("upload_data_started")
//   track("upload_completed", { rows: 1200 })
//   track("chat_message_sent")
//   track("checkout_started", { plan: "pro" })
