import type { Metadata } from "next";
import "./globals.css";
import LumiShell from "@/components/LumiShell";

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
      <body>
        <LumiShell>{children}</LumiShell>
      </body>
    </html>
  );
}
