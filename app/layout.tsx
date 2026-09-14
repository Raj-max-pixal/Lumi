import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import LumiShell from "@/components/LumiShell";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans"
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Lumi",
  description: "A social entertainment app blending creators, chat, stories, threads, and AI.",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${sora.variable}`}>
        <LumiShell>{children}</LumiShell>
      </body>
    </html>
  );
}
