"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "splash" | "signin" | "signup";

interface LoginFormProps {
  /** Where to send the user after a successful sign-in or sign-up. */
  next?: string;
  /** Skip the splash screen and open directly in this mode. */
  initialMode?: "signin" | "signup";
}

export default function LoginForm({ next, initialMode }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode ?? "splash");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const destination = next ?? "/home";

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Wrong email or password. Try again."
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push(destination);
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

    router.push(destination);
  }

  function goTo(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  }

  // ── Splash ──────────────────────────────────────────────────────────────────
  if (mode === "splash") {
    return (
      // Outer wrapper uses haze so any sub-pixel gap between illustration and
      // button panel bleeds haze (matching) instead of the darker slate.
      <div className="flex min-h-svh flex-col bg-purple-haze">
        {/* Upper section — slate background behind logo + spacer */}
        <div className="flex flex-1 flex-col bg-purple-slate">
          {/* Logo — centered, 50px padding on top / left / right */}
          <div className="px-[50px] pt-[50px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/BuzzLogo.svg"
              alt="Buzz Me In"
              className="w-full"
              draggable={false}
            />
          </div>
          {/* Spacer — pushes illustration toward the bottom */}
          <div className="flex-1" />
        </div>

        {/* Illustration — full width, sits flush between slate above and haze below */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/BuzzFriends1.svg"
          alt=""
          aria-hidden="true"
          className="block w-full select-none"
          draggable={false}
        />

        {/* Button panel — 24px below illustration, 16px side padding */}
        <div
          className="flex flex-col gap-3 px-4 pt-6"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 2.5rem)" }}
        >
          <button
            onClick={() => goTo("signup")}
            className="h-14 w-full rounded-[20px] bg-purple-rich text-base font-semibold text-white transition-opacity active:opacity-80"
          >
            Create Account
          </button>
          <button
            onClick={() => goTo("signin")}
            className="h-14 w-full rounded-[20px] border border-purple-rich text-base font-semibold text-purple-rich transition-opacity active:opacity-80"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // ── Sign In / Sign Up ────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-svh flex-col bg-white px-6 pt-14 pb-10">
      {/* Back button */}
      <button
        onClick={() => goTo("splash")}
        className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink transition-colors"
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        Back
      </button>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-ink">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">
        {mode === "signin"
          ? "Sign in to your Buzz Me In account."
          : "Join a group and start buzzing."}
      </p>

      {/* Forms */}
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

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By signing up you agree to our{" "}
        <span className="text-ink">terms of service</span> and{" "}
        <span className="text-ink">privacy policy</span>.
      </p>
    </div>
  );
}
