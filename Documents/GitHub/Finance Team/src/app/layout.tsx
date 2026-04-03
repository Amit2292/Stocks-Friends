import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TickerBar from "@/components/TickerBar";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Alpha Friends",
  description: "The inner circle of alpha — private trading insights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[#0e0e10] text-[#e5e1e4]`}>
          {/* Ticker bar — full width, above everything */}
          <TickerBar />
          <div className="flex" style={{ minHeight: "calc(100vh - 2rem)" }}>
            <Sidebar />
            <main className="flex-1 md:ml-64 px-6 md:px-10 py-8 max-w-[1400px] w-full mx-auto">
              {children}
            </main>
          </div>
          <Toaster />
      </body>
    </html>
  );
}
