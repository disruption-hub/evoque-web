import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HeaderProvider } from "@/contexts/HeaderContext";
import VideoAutoplayConsent from "@/components/shared/VideoAutoplayConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E-Voque - Beyond interpretation",
  description: "E-Voque - Business process and marketing services outsourcing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <head>
        {/* Speed up video loading via preconnect/dns-prefetch to media API */}
        <link rel="preconnect" href="/api/media/download" />
        <link rel="dns-prefetch" href="/api/media/download" />
        {/* Preconnect to external image/CDN hosts used by fallbacks and UI assets */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden w-full`}
      >
        <HeaderProvider>
          {children}
          <VideoAutoplayConsent />
        </HeaderProvider>
      </body>
    </html>
  );
}
