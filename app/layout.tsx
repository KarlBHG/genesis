import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";

import { Atmosphere } from "@/components/atmosphere";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

const serif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: {
    default: "AlltÍkerfi",
    template: "%s · AlltÍkerfi",
  },
  description:
    "Map how Iceland is wired: treaties, institutions, events, and a sourced public-record layer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
      lang="en"
    >
      <body className="flex min-h-full flex-col">
        <Atmosphere />
        <div className="relative z-10 flex min-h-full flex-col">
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
