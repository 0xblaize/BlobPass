import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Geist } from "next/font/google";
import "@mysten/dapp-kit/dist/index.css";
import { Providers } from "@/components/Providers";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blob-pass.vercel.app";
const ogImageUrl = new URL("/opengraph-image", siteUrl).toString();

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono-jbm",
  display: "swap",
});

const geistDisplay = Geist({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display-geist",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BlobPass",
    template: "%s | BlobPass",
  },
  description:
    "A marketplace for files stored on Walrus, sold through Sui access passes.",
  applicationName: "BlobPass",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "BlobPass",
    description:
      "Sell digital files stored on Walrus and unlock them with native Sui access passes.",
    url: siteUrl,
    siteName: "BlobPass",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "BlobPass marketplace preview image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BlobPass",
    description: "Sell digital files stored on Walrus with native Sui access passes.",
    images: [ogImageUrl],
  },
  // Icons are auto-wired by Next.js from src/app/icon.tsx (favicon)
  // and src/app/apple-icon.tsx (apple touch icon) — both code-generated
  // to match the site's brutalist design system. No manual config needed.
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${geistDisplay.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
