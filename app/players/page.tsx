import type { Metadata } from "next";

import { EntryIndex } from "@/components/entry-index";
import { getPlayers, hrefFor } from "@/lib/content";
import { labelize } from "@/lib/format";

export const metadata: Metadata = {
  title: "Players",
  description: "Organizations and public office-holders in the Iceland system map.",
};

export default function PlayersPage() {
  const items = getPlayers()
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title, "en"))
    .map((player) => ({
      title: player.title,
      href: hrefFor(player),
      summary: player.summary,
      meta: `${labelize(player.playerType)} · ${player.role}`,
    }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Players</h1>
        <p className="text-muted-foreground">
          Organizations, and people only where a public page names them in office. Each person has an as-of date taken from that page.
        </p>
      </header>
      <EntryIndex items={items} />
    </main>
  );
}
