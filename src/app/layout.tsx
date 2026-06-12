import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Syncora — Listen Together, Feel Together",
  description:
    "Syncora is a premium real-time music listening platform. Create rooms, invite friends, listen in perfect sync, and talk through built-in voice chat.",
  keywords: [
    "Listen music together",
    "Sync music online",
    "Music room app",
    "Listen songs with friends",
    "Real-time music platform",
    "Social music",
    "Voice chat",
  ],
  openGraph: {
    title: "Syncora — Listen Together, Feel Together",
    description:
      "Real-time social music listening with voice chat. Create a room, invite friends, and vibe together.",
    type: "website",
    siteName: "Syncora",
  },
  twitter: {
    card: "summary_large_image",
    title: "Syncora — Listen Together, Feel Together",
    description: "Real-time social music listening with voice chat.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col noise-overlay">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
