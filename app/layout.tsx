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
  // Open Graph and Twitter image URLs have to be absolute. Set
  // NEXT_PUBLIC_SITE_URL wherever this is deployed; locally the dev origin
  // keeps the generated cards resolvable.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:38471",
  ),
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
      className={`${sans.variable} ${serif.variable} min-h-full antialiased`}
      lang="en"
    >
      <body className="flex min-h-full flex-col">
        <a className="skip-to-records" href="#records">
          Skip to records
        </a>
        <Atmosphere />
        <div className="relative z-10 flex min-h-full flex-col">
          <SiteHeader />
          <div className="paper-sheet flex-1" id="records" tabIndex={-1}>
            {children}
          </div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
