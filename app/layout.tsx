import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import { WishboxProvider } from "@/store/wishbox-store";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Wishbox", template: "%s · Wishbox" },
  description: "Wishbox — listas de desejos e presentes",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <WishboxProvider>
          <ToastProvider>{children}</ToastProvider>
        </WishboxProvider>
      </body>
    </html>
  );
}
