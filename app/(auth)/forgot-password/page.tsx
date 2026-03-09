"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-glow-pale text-3xl">
          📬
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-ink">Check your email</h1>
          <p className="text-muted-foreground">
            We sent a reset link to{" "}
            <span className="font-semibold text-ink">{email}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Click the link to set a new password.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-ink transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <div className="text-center">
        <div className="mb-3 text-4xl">🔐</div>
        <h1 className="text-2xl font-bold text-ink">Reset password</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          className="h-12 rounded-xl px-4 text-base"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading} size="lg" className="w-full">
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-ink transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
