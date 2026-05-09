import { type Metadata, type Viewport } from "next";
import { Inter } from "next/font/google";
import { ReactQueryProvider } from "./client/providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

// Optimized font loading with next/font
const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Prevent FOIT (Flash of Invisible Text)
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Yayasan Rahmaniyah Al-Islamy",
  description: "Sistem Informasi Sekolah",
};

// Viewport must be a separate export in Next.js 14+
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
    <html lang="id" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <Toaster />
        <ReactQueryProvider>
          <Navbar />
          {children}
          <Footer />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
