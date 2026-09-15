import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: {
    default: "গাড়িখাতা — গাড়ির ব্যবসা, একটি অ্যাপে",
    template: "%s · গাড়িখাতা",
  },
  description:
    "বাংলাদেশের গাড়ি ভাড়া, ফ্লিট ও ট্রান্সপোর্ট ব্যবসার জন্য সহজ SaaS — ট্রিপ, আয়-খরচ, তেল, সার্ভিস, কাগজপত্র ও রিমাইন্ডার এক জায়গায়।",
  applicationName: "গাড়িখাতা",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "গাড়িখাতা",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a7a5e" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1f19" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
