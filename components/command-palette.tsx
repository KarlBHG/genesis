"use client";

import { useRouter, usePathname } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { labelize } from "@/lib/format";
import { searchEntries } from "@/lib/search";
import type { SearchDoc } from "@/lib/types";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const isPaletteKey =
        event.code === "KeyK" || event.key === "k" || event.key === "K";
      if (event.key === "Escape" && open) {
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      }
      if (isPaletteKey && (event.metaKey || event.ctrlKey)) {
        const target = event.target;
        if (
          target instanceof HTMLElement &&
          !open &&
          (target.isContentEditable ||
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT")
        ) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        setOpen((current) => !current);
        return;
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, close]);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;
    if (docs) return;
    let cancelled = false;
    fetch("/api/search")
      .then((response) => response.json() as Promise<SearchDoc[]>)
      .then((loaded) => {
        if (!cancelled) setDocs(loaded);
      })
      .catch(() => {
        if (!cancelled) setDocs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, docs]);

  const results = useMemo(
    () => (docs ? searchEntries(docs, query).slice(0, 10) : []),
    [docs, query],
  );

  return (
    <>
      <Button
        aria-keyshortcuts="meta+k control+k"
        aria-label="Search the records"
        className="gap-2"
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
      >
        <SearchIcon data-icon="inline-start" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border px-1 text-xs text-muted-foreground md:inline">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog
        className="command-folio"
        description="Titles, summaries, and typed connections. Icelandic accents fold, so Sedlabanki finds Seðlabanki."
        onOpenChange={(next) => {
          if (next) setOpen(true);
          else close();
        }}
        open={open}
        title="Search the records"
      >
        <Command label="Search the records" shouldFilter={false}>
          <CommandInput
            aria-label="Search the records"
            onValueChange={setQuery}
            placeholder="Try EEA, Landsvirkjun, sells power, regulates"
            value={query}
          />
          <CommandList>
            {docs == null ? (
              <CommandEmpty>Loading the index…</CommandEmpty>
            ) : !query.trim() ? (
              <CommandEmpty>
                {docs.length} records. Start typing to search titles, summaries,
                and typed connections.
              </CommandEmpty>
            ) : results.length === 0 ? (
              <CommandEmpty>No matches for “{query.trim()}”.</CommandEmpty>
            ) : (
              <CommandGroup heading="Records">
                {results.map((doc) => (
                  <CommandItem
                    key={doc.slug}
                    onSelect={() => {
                      router.push(doc.href);
                      close();
                    }}
                    value={doc.slug}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-medium">{doc.title}</span>
                      <span className="line-clamp-1 text-xs text-muted-foreground">
                        {doc.summary}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {labelize(doc.kind)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
