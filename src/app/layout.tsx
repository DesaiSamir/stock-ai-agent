import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { AppShell } from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Stock AI Agent",
  description: "AI-powered stock market analysis and trading platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning className="root-layout">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
