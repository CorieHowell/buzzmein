import LoginForm from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: string }>;
}) {
  const { next, mode } = await searchParams;

  // Validate redirect target — only allow same-origin paths
  const safeNext = next?.startsWith("/") ? next : undefined;

  // Allow deep-linking straight into signup or signin (skips the splash screen)
  const initialMode =
    mode === "signup" ? "signup" : mode === "signin" ? "signin" : undefined;

  return <LoginForm next={safeNext} initialMode={initialMode} />;
}
