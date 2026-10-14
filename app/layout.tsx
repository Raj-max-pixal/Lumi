import type { Metadata } from "next";
import "./globals.css";
import LumiShell from "@/components/LumiShell";

export const metadata: Metadata = {
  title: "Lumi",
  description: "A student developer community for projects, learning reels, hackathons, and teams.",
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
