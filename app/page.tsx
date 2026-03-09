import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-deep px-6">
      <div className="space-y-3 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white">
          Buzz Me In
        </h1>
        <p className="text-xl text-soft">Get your crew together.</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/login"
          className="flex h-12 items-center justify-center rounded-full bg-glow px-8 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
        >
          Start a group
        </Link>
        <Link
          href="/login"
          className="flex h-12 items-center justify-center rounded-full border border-mid px-8 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
