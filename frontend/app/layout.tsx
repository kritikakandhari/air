import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Providers from "@/context/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";

export const metadata: Metadata = {
  title: "Airbnb | Holiday rentals, cabins, beach houses & more",
  description: "Airbnb clone: browse stays, book trips and host your own place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen flex flex-col">
        <Providers>
          <Suspense fallback={<div className="h-20 border-b border-[#ebebeb]" />}><Header /></Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
          <AuthModal />
        </Providers>
      </body>
    </html>
  );
}
