import type { Metadata } from "next";
import { Poppins, Outfit, Montserrat, Geist, Manrope, Playfair_Display, Bungee_Spice, Playwrite_US_Trad_Guides, Monoton } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: "400",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: "400",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: "400",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: "400",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: "400",
});

const bungeeSpice = Bungee_Spice({
  variable: "--font-bungee-spice",
  subsets: ["latin"],
  weight: "400",
});

const playwrite = Playwrite_US_Trad_Guides({
  variable: "--font-playwrite-us-trad-guides",
  weight: "400",
});

const monoton = Monoton({
  variable: "--font-monoton",
  subsets: ["latin"],
  weight: "400",
});

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
      className={`${poppins.variable} ${outfit.variable} ${montserrat.variable} ${geist.variable} ${manrope.variable} ${playfair.variable} ${bungeeSpice.variable} ${playwrite.variable} ${monoton.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}