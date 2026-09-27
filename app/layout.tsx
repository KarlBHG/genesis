import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";

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
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <footer className="border-t">
          <p className="mx-auto w-full max-w-5xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
            AlltÍkerfi is a reading map of Icelandic treaties, institutions, events, sectors, money flows, and public office-holders. Sources sit on each entry.
          </p>
        </footer>
      </body>
    </html>
  );
}
