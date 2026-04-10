import type { Metadata } from "next";
import { Poppins, Outfit, Montserrat, Geist, Manrope, Playfair_Display, Bungee_Spice, Playwrite_US_Trad_Guides, Monoton } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Fosa96 Fundraising",
    template: "%s | Fosa96",
  },
  description:
    "Support Fijai Senior High School — donate to fundraising campaigns and help build the future.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Fosa96 Fundraising",
    description:
      "Support Fijai Senior High School — donate to fundraising campaigns and help build the future.",
    images: [{ url: "/logo.png", width: 512, height: 512 }],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
      lang="en"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-full font-geist flex flex-col ">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}