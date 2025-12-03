import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DivSecure Community",
  description: "Secure community management platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DivSecure",
  },
};

export const viewport = {
  themeColor: "#000000",
};

import { Toaster } from 'sonner'
import { AutoLogout } from '@/components/auto-logout'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Session check moved to client-side AutoLogout component to allow static rendering

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
        <AutoLogout />
      </body>
    </html>
  );
}
