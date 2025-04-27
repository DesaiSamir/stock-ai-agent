import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from '../components/AppShell';

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
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
      <body style={{ margin: 0, padding: 0, height: '100vh', overflow: 'hidden' }}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
