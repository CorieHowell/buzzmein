export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Each auth page owns its own layout/background.
  // The login page is full-screen purple; forgot/reset pages are white-centered.
  return <>{children}</>;
}
