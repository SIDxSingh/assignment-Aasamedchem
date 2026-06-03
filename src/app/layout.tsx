import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AasaMedChem Inventory & Order Management System",
  description: "Enterprise-grade Inventory and Order Management with real-time stock levels, live unit conversions, and secure role-based authorization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
