import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

// Primary heading font (landing page, sections)
const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

// Body & UI font
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Playfair Display — for navbar logo + specific branding moments
const playfair = Playfair_Display({
  weight: ["400", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nana Bites | Cemilan Enak, Bikin Hari Makin Pink",
  description: "Usaha jajanan kekinian yang modern dan manis.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${cormorant.variable} ${dmSans.variable} ${playfair.variable} antialiased min-h-screen flex flex-col`}
      >
        <style>{`
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            backface-visibility: hidden;
          }
        `}</style>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
