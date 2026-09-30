"use client";

import { useMemo, useState } from "react";

import {
  PasteIntakeForm,
  type IntakeEndpointOption,
  type PolicyAreaOption,
} from "@/components/paste-intake-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { icelandicLang } from "@/lib/lang";
import {
  intakeFormFromOpnirItem,
  type OpnirReviewItem,
} from "@/lib/opnir-feed";

type FeedResponse = {
  ok: boolean;
  items?: OpnirReviewItem[];
  errors?: string[];
  added?: number;
  file?: string;
};

const SAMPLE_CSV = `kaupandi,dagsetning,seljandi,reikningsnumer,upphaed
Landspítali,2026-08-25,Íslandsbanki hf.,3546720,245`;

export function OpnirReviewFeed({
  endpoints,
  persistAllowed,
  policyAreas,
  queuedItems,
}: {
  endpoints: IntakeEndpointOption[];
  persistAllowed: boolean;
  policyAreas: PolicyAreaOption[];
  queuedItems: OpnirReviewItem[];
}) {
  const [paste, setPaste] = useState("");
  const [items, setItems] = useState<OpnirReviewItem[]>(queuedItems);
  const [selectedId, setSelectedId] = useState<string | null>(
    queuedItems[0]?.id ?? null,
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  async function run(action: string, extra?: Record<string, unknown>) {
    setPending(action);
    setErrors([]);
    setNotice(null);
    try {
      const response = await fetch("/api/intake/opnir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text: paste, ...extra }),
      });
      const body = (await response.json()) as FeedResponse;
      if (!body.ok) {
        setErrors(body.errors ?? ["The official rows could not be read."]);
        return;
      }
      if (action === "queue") {
        setItems(body.items ?? items);
        setNotice(
          `Saved ${body.added ?? 0} row(s) to ${body.file ?? "data/opnir-review-queue.json"}. data/edges.json was not written.`,
        );
        return;
      }
      const next = body.items ?? [];
      setItems(next);
      setSelectedId(next[0]?.id ?? null);
      if (body.errors && body.errors.length > 0) setErrors(body.errors);
      setNotice(
        next.length === 1
          ? "1 official row is ready for a human program decision."
          : `${next.length} official rows are ready for a human program decision. Amounts are not added together.`,
      );
    } catch {
      setErrors(["The feed could not run. The live ledger was not fetched."]);
    } finally {
      setPending(null);
    }
  }

  const initial = selected ? intakeFormFromOpnirItem(selected) : null;

  return (
    <div className="flex min-w-0 flex-col gap-10">
      <section className="flex min-w-0 flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="opnir-paste">Official CSV or JSON</FieldLabel>
          <Textarea
            id="opnir-paste"
            lang={icelandicLang(paste)}
            onChange={(event) => setPaste(event.target.value)}
            placeholder={SAMPLE_CSV}
            rows={8}
            value={paste}
          />
          <FieldDescription>
            Paste an export you already have, or ledger lines shaped{" "}
            <code className="text-sm">
              kaupandi; YYYY-MM-DD; seljandi; reikningsnúmer; upphæð
            </code>
            . This page does not open opnirreikningar.is. A printed málaflokkur
            column is shown as text; it is not mapped to a policy area.
          </FieldDescription>
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={pending != null}
            onClick={() => void run("parse")}
            type="button"
          >
            {pending === "parse" ? "Reading…" : "Read paste"}
          </Button>
          <Button
            disabled={pending != null}
            onClick={() => void run("load-fixture")}
            type="button"
            variant="outline"
          >
            {pending === "load-fixture" ? "Loading…" : "Load fixture"}
          </Button>
          <Button
            disabled={pending != null}
            onClick={() => void run("load-stored-pays")}
            type="button"
            variant="outline"
          >
            {pending === "load-stored-pays"
              ? "Loading…"
              : "Load stored Opnir pays"}
          </Button>
          <Button
            disabled={pending != null || !persistAllowed || items.length === 0}
            onClick={() => void run("queue", { items })}
            type="button"
            variant="outline"
          >
            {pending === "queue" ? "Saving…" : "Save to review queue"}
          </Button>
        </div>
        {!persistAllowed ? (
          <p className="text-sm text-muted-foreground">
            Saving the review list writes{" "}
            <code className="text-sm">data/opnir-review-queue.json</code> on a
            local/dev tree. It is disabled here.{" "}
            <code className="text-sm">data/edges.json</code> is never written.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Save writes{" "}
            <code className="text-sm">data/opnir-review-queue.json</code>. A
            confirmed row can then be queued to{" "}
            <code className="text-sm">data/intake-queue.json</code>. Neither
            file is the published catalog.
          </p>
        )}
        <div aria-live="polite" className="flex min-w-0 flex-col gap-2">
          {errors.length > 0 ? (
            <FieldError errors={errors.map((message) => ({ message }))} />
          ) : null}
          {notice ? <p className="text-sm">{notice}</p> : null}
        </div>
      </section>

      {items.length === 0 ? (
        <p className="folio-note text-sm leading-6 text-muted-foreground">
          No official rows in review. Read a paste, load the bundled fixture, or
          load already-stored Opnir pays. Program joins stay empty until you
          confirm them.
        </p>
      ) : (
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <ol className="opnir-index">
            {items.map((item, index) => {
              const active = item.id === selectedId;
              return (
                <li key={item.id}>
                  <button
                    aria-current={active ? "true" : undefined}
                    onClick={() => setSelectedId(item.id)}
                    type="button"
                  >
                    <p className="font-medium">
                      {String(index + 1).padStart(2, "0")} · {item.official.buyer}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {item.official.vendor} · {item.official.date} ·{" "}
                      {item.official.amountText} ISK
                    </p>
                    <p className="folio-index-meta mt-1">Needs program decision</p>
                  </button>
                </li>
              );
            })}
          </ol>
          {selected && initial ? (
            <div className="flex min-w-0 flex-col gap-6">
              <article className="folio-note flex min-w-0 flex-col gap-2">
                <h2 className="text-base font-medium">Official row</h2>
                <p
                  className="text-sm leading-6"
                  lang={icelandicLang(selected.official.quotation)}
                >
                  {selected.official.quotation}
                </p>
                <p className="text-sm text-muted-foreground">
                  Suggested endpoints:{" "}
                  {selected.suggestedFrom ?? "pick from"} →{" "}
                  {selected.suggestedTo ?? "pick to"}. Identity matching only —
                  not a málaflok.
                </p>
                <p className="text-sm text-muted-foreground">
                  {selected.official.malaflokkur
                    ? `The paste printed this málaflokkur: ${selected.official.malaflokkur}. It is not mapped to a program.`
                    : "This row does not print a málaflokkur heading."}
                </p>
                {selected.official.discardedProgram ? (
                  <p className="text-sm text-muted-foreground">
                    A program field was in the source and was discarded. Confirm
                    a join or a null reason yourself.
                  </p>
                ) : null}
              </article>
              <PasteIntakeForm
                endpoints={endpoints}
                initial={initial}
                key={selected.id}
                persistAllowed={persistAllowed}
                policyAreas={policyAreas}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
