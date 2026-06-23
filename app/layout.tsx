import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import WelcomeModal from "@/components/WelcomeModal";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "USS Sojourner",
  description: "PBEM companion for the USS Sojourner sim",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Sojourner" },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="h-full bg-slate-950 text-slate-100 font-sans">
        <div className="flex flex-col min-h-full max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto">
          <WelcomeModal />
          <main className="flex-1 pb-20">{children}</main>
          <Nav />
        </div>
      </body>
    </html>
  );
}
