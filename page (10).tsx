"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import AuthCard from "@/components/auth/AuthCard";
import { track } from "@/lib/posthog";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    track("signup_completed");

    // If email confirmation is required, Supabase returns a user with no session yet.
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
    } else {
      setCheckEmail(true);
    }
  }

  if (checkEmail) {
    return (
      <AuthCard
        title="Check your inbox"
        subtitle="We sent a confirmation link — click it to activate your account, then log in."
        footer={
          <Link href="/login" className="text-signal-teal hover:underline">
            Back to log in
          </Link>
        }
      >
        <div className="text-sm text-muted">
          Didn&apos;t get it? Check spam, or try signing up again in a minute.
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Start your free trial"
      subtitle="No card required. 14 days of full access to see what your data shows."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-signal-teal hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-muted block mb-1.5">Work email</label>
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 ring-signal-teal"
            placeholder="At least 8 characters"
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
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}
