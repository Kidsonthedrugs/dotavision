import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers";
import { AppProvider } from "@/store";
import { Sidebar, MobileNav, Topbar } from "@/components/layout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DotaVision - Elite Dota 2 Analytics",
  description: "Track your Dota 2 performance with advanced analytics. Win more games with data-driven insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>
        <QueryProvider>
          <AppProvider>
            <div className="min-h-screen bg-[var(--background)]">
              <Sidebar />
              <Topbar />
              <main className="pt-16 md:pl-[280px] pb-20 md:pb-0">
                <div className="container mx-auto p-6">
                  {children}
                </div>
              </main>
              <MobileNav />
            </div>
          </AppProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
