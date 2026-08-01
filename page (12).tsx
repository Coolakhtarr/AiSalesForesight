"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import AuthCard from "@/components/auth/AuthCard";
import { track } from "@/lib/posthog";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    track("login_succeeded");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard
      title="Log in"
      subtitle="Welcome back — pick up where your dashboard left off."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-signal-teal hover:underline">
            Start a free trial
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-muted block mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 ring-signal-teal"
            placeholder="you@yourstore.com"
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 ring-signal-teal"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="text-sm text-signal-coral bg-signal-coral/10 border border-signal-coral/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-signal-teal text-ink text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthCard>
  );
}
