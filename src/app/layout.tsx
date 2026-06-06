import type { Metadata } from "next";
import { Space_Mono, Work_Sans } from "next/font/google";
import "@mysten/dapp-kit/dist/index.css";
import { Providers } from "@/components/Providers";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blob-pass.vercel.app";
const ogImageUrl = new URL("/opengraph-image", siteUrl).toString();

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
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
  icons: {
    icon: "/favicon.jpg",
    shortcut: "/favicon.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${workSans.variable} ${spaceMono.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
