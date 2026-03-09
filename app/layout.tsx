import type { Metadata, Viewport } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Separate viewport export — required by Next.js 14 for viewport-fit
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",   // extends viewport under notch + home indicator
  themeColor: "#495085",  // status bar tint on supported browsers
};

export const metadata: Metadata = {
  title: "Buzz Me In",
  description: "Get your crew together.",
  // Icons
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  // iOS "Add to Home Screen" standalone mode
  appleWebApp: {
    capable: true,
    title: "Buzz Me In",
    statusBarStyle: "default", // white status bar matches our white header
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
