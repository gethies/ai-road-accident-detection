import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { EmergencyContacts } from "@/components/EmergencyContacts";
import { PWARegister } from "@/components/PWARegister";
import { SidebarNav } from "@/components/SidebarNav";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "AccidentWatch — AI Road Safety for India",
  description:
    "AI-powered road accident detection and emergency response platform tailored for Indian road conditions.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0D1117",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-night-road font-body text-mist-white antialiased`}
      >
        <div className="flex min-h-screen">
          <SidebarNav />
          <div className="flex flex-1 flex-col lg:pl-64">
            <main className="flex-1">{children}</main>
            <EmergencyContacts />
          </div>
        </div>
        <PWARegister />
      </body>
    </html>
  );
}
