"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { labelize } from "@/lib/format";
import { searchEntries } from "@/lib/search";
import type { SearchDoc } from "@/lib/types";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;
    if (docs) {
      inputRef.current?.focus();
      return;
    }
    let cancelled = false;
    fetch("/api/search")
      .then((response) => response.json() as Promise<SearchDoc[]>)
      .then((loaded) => {
        if (!cancelled) {
          setDocs(loaded);
          inputRef.current?.focus();
        }
      })
      .catch(() => {
        if (!cancelled) setDocs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, docs]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open ]);

  const results = useMemo(
    () => (docs ? searchEntries(docs, query).slice(0, 10) : []),
    [docs, query],
  );

  return (
    <>
      <Button
        aria-keyshortcuts="meta+k control+k"
        className="gap-2"
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
      >
        <SearchIcon />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border px-1 text-xs text-muted-foreground md:inline">
          ⌘K
        </kbd>
      </Button>
      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
          role="dialog"
          aria-label="Search the records"
        >
          <button
            aria-label="Close search"
            className="absolute inset-0 cursor-default bg-black/40"
            onClick={close}
            tabIndex={-1}
            type="button"
          />
          <div className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border bg-background shadow-lg">
            <div className="border-b p-3">
              <Input
                aria-label="Search the records"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try EEA, Landsvirkjun, sells power, regulates"
                ref={inputRef}
                value={query}
              />
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto p-2">
              {docs == null ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Loading the index…
                </li>
              ) : !query.trim() ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  {docs.length} records. Start typing to search titles,
                  summaries, and typed connections.
                </li>
              ) : results.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No matches for “{query.trim()}”.
                </li>
              ) : (
                results.map((doc) => (
                  <li key={doc.slug}>
                    <Link
                      className="flex flex-col gap-0.5 rounded-lg px-3 py-2 hover:bg-muted"
                      href={doc.href}
                      onClick={close}
                    >
                      <span className="flex items-baseline gap-2">
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {doc.title}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {labelize(doc.kind)}
                        </span>
                      </span>
                      <span className="line-clamp-1 text-sm text-muted-foreground">
                        {doc.summary}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
