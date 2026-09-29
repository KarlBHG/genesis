"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ExternalLink } from "@/components/external-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { RELATIONSHIP_LIST } from "@/lib/edge-contract";
import { labelize } from "@/lib/format";
import { icelandicLang } from "@/lib/lang";
import {
  quotedNameCaption,
  type QuotedNameFormInput,
  type QuotedNameQueueItem,
  type QuotedNameStatement,
} from "@/lib/quoted-name-contract";

type QuotedNameResponse =
  | {
      ok: true;
      queued: boolean;
      created?: boolean;
      id?: string;
      file?: string;
      persistAllowed?: boolean;
      statement: QuotedNameStatement;
    }
  | { ok: false; errors: string[] };

const EMPTY_FORM: QuotedNameFormInput = {
  printedName: "",
  source: "",
  quotation: "",
  asOf: "",
  suggestedType: "",
};

export function QuotedNameLedgerTable({
  items,
}: {
  items: readonly QuotedNameQueueItem[];
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {items.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>No unmatched names on file</EmptyTitle>
            <EmptyDescription>
              When a cited sentence names a party that has no catalog slug and
              no office id, it is stored here. It is not a player. It is not
              drawn as a dashed edge.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableCaption>{quotedNameCaption(items.length)}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Printed name</TableHead>
              <TableHead>Quoted on</TableHead>
              <TableHead>Suggested type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell
                  className="whitespace-normal font-medium"
                  lang={icelandicLang(item.statement.printedName) ?? "is"}
                >
                  {item.statement.printedName}
                  <span className="mt-1 block text-xs text-muted-foreground">
                    as of {item.statement.asOf}
                  </span>
                </TableCell>
                <TableCell className="max-w-md whitespace-normal">
                  <p
                    className="text-sm leading-6 text-muted-foreground"
                    lang={icelandicLang(item.statement.quotation) ?? undefined}
                  >
                    {item.statement.quotation}
                  </p>
                  <ExternalLink
                    className="mt-1 block break-all text-xs underline underline-offset-4"
                    href={item.statement.source}
                  >
                    {item.statement.source}
                  </ExternalLink>
                </TableCell>
                <TableCell>
                  {item.statement.suggestedType ? (
                    labelize(item.statement.suggestedType)
                  ) : (
                    <span className="text-muted-foreground">Not picked</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className="font-normal" variant="ghost">
                    Unmatched
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export function QuotedNameForm({
  persistAllowed,
  initialItems,
}: {
  persistAllowed: boolean;
  initialItems: QuotedNameQueueItem[];
}) {
  const [form, setForm] = useState<QuotedNameFormInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<Extract<
    QuotedNameResponse,
    { ok: true }
  > | null>(null);
  const [pending, setPending] = useState<"check" | "queue" | null>(null);
  const [items, setItems] = useState<QuotedNameQueueItem[]>(initialItems);
  const liveRef = useRef<HTMLDivElement>(null);

  function patch(next: Partial<QuotedNameFormInput>) {
    setForm((current) => ({ ...current, ...next }));
    setErrors([]);
    setResult(null);
  }

  async function submit(persist: boolean) {
    setPending(persist ? "queue" : "check");
    setErrors([]);
    setResult(null);
    try {
      const response = await fetch("/api/intake/quoted-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, persist }),
      });
      const body = (await response.json()) as QuotedNameResponse;
      if (!body.ok) {
        setErrors(body.errors);
        return;
      }
      setResult(body);
      if (body.queued && body.id) {
        setItems((current) => {
          if (current.some((item) => item.id === body.id)) return current;
          return [
            ...current,
            {
              id: body.id!,
              proposedAt: new Date().toISOString(),
              statement: body.statement,
            },
          ];
        });
      }
    } catch {
      setErrors(["The check could not run. The page was not fetched."]);
    } finally {
      setPending(null);
    }
  }

  useEffect(() => {
    if (errors.length === 0) return;
    liveRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [errors]);

  return (
    <div
      className="flex min-w-0 scroll-mt-24 flex-col gap-8"
      id="quoted-names"
    >
      <header className="flex max-w-reading flex-col gap-2">
        <h2 className="font-serif text-xl font-medium">Quoted-name ledger</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          When a cited sentence names a party that has no catalog slug and no
          office id, store the printed name here. Do not create a player. Do
          not draw a dashed edge. A later human files the catalog page from the
          same quotation, then pastes the{" "}
          <Link className="underline underline-offset-4" href="/intake">
            six-field row
          </Link>
          . Unmatched stays unmatched.
        </p>
      </header>

      <form
        className="intake-folio flex min-w-0 flex-col gap-8"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(false);
        }}
      >
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Placeholder statement</FieldLegend>
            <FieldDescription>
              Paste the name as the page prints it, the official URL, the
              sentence, and the as-of the page prints. This form does not fetch
              the URL, does not scrape, and does not ask a model to invent a
              slug or a type.
            </FieldDescription>
            <Field>
              <FieldLabel htmlFor="quoted-name">Printed name</FieldLabel>
              <Input
                id="quoted-name"
                onValueChange={(printedName) => patch({ printedName })}
                placeholder="The name as the page prints it"
                required
                value={form.printedName}
              />
              <FieldDescription>
                Not a catalog slug. If the name already uniquely matches a
                record, paste a sourced line instead.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="quoted-as-of">As of</FieldLabel>
              <Input
                id="quoted-as-of"
                onValueChange={(asOf) => patch({ asOf })}
                placeholder="2026-08-28, 2024, consolidated statute, undated on the CV"
                required
                value={form.asOf}
              />
              <FieldDescription>
                What the page prints about when — never the day you read it.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="quoted-source">Official URL</FieldLabel>
              <Input
                id="quoted-source"
                onValueChange={(source) => patch({ source })}
                placeholder="https://"
                required
                type="url"
                value={form.source}
              />
              <FieldDescription>
                One http(s) address. The form will not open or scrape it.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="quoted-quotation">
                Verbatim quotation
              </FieldLabel>
              <Textarea
                id="quoted-quotation"
                lang={icelandicLang(form.quotation)}
                onChange={(event) => patch({ quotation: event.target.value })}
                required
                rows={6}
                value={form.quotation}
              />
              <FieldDescription>
                The words on the page, including the printed name, in the
                language the page uses.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="quoted-type">
                Suggested type (optional, human-picked)
              </FieldLabel>
              <Select
                id="quoted-type"
                onChange={(event) =>
                  patch({ suggestedType: event.target.value })
                }
                value={form.suggestedType}
              >
                <option value="">None — type stays human</option>
                {RELATIONSHIP_LIST.map((type) => (
                  <option key={type} value={type}>
                    {labelize(type)}
                  </option>
                ))}
              </Select>
              <FieldDescription>
                Allowlisted verbs only. A model must not pick this. The type is
                a hint for a later paste, not an edge.
              </FieldDescription>
            </Field>
          </FieldSet>
        </FieldGroup>

        <div className="intake-actions flex flex-wrap gap-2">
          <Button disabled={pending != null} type="submit">
            {pending === "check" ? "Checking…" : "Check this quoted name"}
          </Button>
          <Button
            disabled={pending != null || !persistAllowed}
            onClick={() => void submit(true)}
            type="button"
            variant="outline"
          >
            {pending === "queue"
              ? "Queuing…"
              : "Queue unmatched name"}
          </Button>
        </div>
        {!persistAllowed ? (
          <p className="text-sm text-muted-foreground">
            Queuing writes{" "}
            <code className="text-sm">data/quoted-names.json</code> on a
            local/dev tree. It is disabled here. It never writes a player or{" "}
            <code className="text-sm">data/edges.json</code>.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Queue writes{" "}
            <code className="text-sm">data/quoted-names.json</code>. It does
            not create a catalog page and does not append to{" "}
            <code className="text-sm">data/edges.json</code>. Unmatched stays
            unmatched.
          </p>
        )}

        <div
          aria-live="polite"
          className="flex min-w-0 flex-col gap-3"
          ref={liveRef}
        >
          {errors.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border/70 p-4">
              <p className="text-sm font-medium">
                The contract refuses this placeholder.
              </p>
              <FieldError errors={errors.map((message) => ({ message }))} />
            </div>
          ) : null}
          {result?.ok && !result.queued ? (
            <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border/70 p-4">
              <p className="text-sm font-medium">
                The contract accepts this placeholder.
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                It is not a player. It is not an edge. Queue it as unmatched,
                or copy the JSON below. File a catalog page from the same
                quotation before pasting a six-field row.
              </p>
              <pre className="max-h-80 overflow-auto text-xs leading-5">
                {JSON.stringify(result.statement, null, 2)}
              </pre>
            </div>
          ) : null}
          {result?.ok && result.queued ? (
            <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border/70 p-4">
              <p className="text-sm font-medium">
                {result.created === false
                  ? "Already in the unmatched ledger"
                  : "Queued as unmatched"}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                {result.id}. Written to {result.file}. No player was created.
                The published edge file was not changed.
              </p>
              <pre className="max-h-80 overflow-auto text-xs leading-5">
                {JSON.stringify(result.statement, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      </form>

      <QuotedNameLedgerTable items={items} />
    </div>
  );
}
