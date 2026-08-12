import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import "@/styles/globals.css";

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start",
});

export const metadata: Metadata = {
  title: "StoicType",
  description: "A modern premium typing platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={pressStart.variable}>
      <body className="bg-background font-sans text-primary antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
