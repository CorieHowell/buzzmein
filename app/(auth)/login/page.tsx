"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Wrong email or password. Try again."
        : error.message);
      setLoading(false);
      return;
    }

    router.push("/home");
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName.trim() || email.split("@")[0] },
      },
    });

    if (error) {
      setError(
        error.message.includes("already registered")
          ? "An account with this email already exists. Sign in instead."
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push("/home");
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      {/* Brand */}
      <div className="text-center">
        <div className="mb-3 text-4xl">🔔</div>
        <h1 className="text-3xl font-bold text-ink">Buzz Me In</h1>
        <p className="mt-2 text-muted-foreground">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-full bg-muted p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className={`flex-1 rounded-full py-2 transition-colors ${
            mode === "signin"
              ? "bg-white text-ink shadow-sm"
              : "text-muted-foreground hover:text-ink"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`flex-1 rounded-full py-2 transition-colors ${
            mode === "signup"
              ? "bg-white text-ink shadow-sm"
              : "text-muted-foreground hover:text-ink"
          }`}
        >
          Sign up
        </button>
      </div>

      {/* Form */}
      {mode === "signin" ? (
        <form onSubmit={handleSignIn} className="flex flex-col gap-3">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
            className="h-12 rounded-xl px-4 text-base"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="h-12 rounded-xl px-4 text-base"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} size="lg" className="mt-1 w-full">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-ink transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSignUp} className="flex flex-col gap-3">
          <Input
            type="text"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            autoFocus
            autoComplete="name"
            className="h-12 rounded-xl px-4 text-base"
          />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-12 rounded-xl px-4 text-base"
          />
          <Input
            type="password"
            placeholder="Password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="h-12 rounded-xl px-4 text-base"
          />
          <Input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="h-12 rounded-xl px-4 text-base"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} size="lg" className="mt-1 w-full">
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
      )}

      <p className="text-center text-xs text-muted-foreground">
        By signing up you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
}
