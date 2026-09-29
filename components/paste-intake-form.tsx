"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  KIND_GROUP_ORDER,
  MONEY_BASES,
  MONEY_UNITS,
  RELATIONSHIP_LIST,
  formToRawEdge,
  isCareerEdge,
  type IntakeFormInput,
} from "@/lib/edge-contract";
import { labelize } from "@/lib/format";
import { icelandicLang } from "@/lib/lang";
import type { Kind, Relationship } from "@/lib/types";

export type IntakeEndpointOption = {
  id: string;
  title: string;
  kind: Kind | "office";
  playerType?: "organization" | "person";
};

export type PolicyAreaOption = {
  slug: string;
  title: string;
};

type IntakeResponse =
  | { ok: true; queued: boolean; created?: boolean; id?: string; file?: string; row: Record<string, unknown>; persistAllowed?: boolean }
  | { ok: false; errors: string[] };

const EMPTY_FORM: IntakeFormInput = {
  from: "",
  to: "",
  type: "",
  asOf: "",
  source: "",
  quotation: "",
  start: "",
  end: "",
  channel: "",
  amountValue: "",
  amountUnit: "",
  amountBasis: "",
  amountQuotation: "",
  year: "",
  program: "",
  programNullReason: "",
  programSource: "",
  programQuotation: "",
};

function optionById(
  options: IntakeEndpointOption[],
  id: string,
): IntakeEndpointOption | undefined {
  return options.find((option) => option.id === id);
}

function EndpointSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: IntakeEndpointOption[];
  onChange: (next: string) => void;
}) {
  const grouped = KIND_GROUP_ORDER.map((group) => ({
    ...group,
    items: options
      .filter((option) => option.kind === group.kind)
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title, "en")),
  })).filter((group) => group.items.length > 0);

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        id={id}
        onChange={(event) => onChange(event.target.value)}
        required
        value={value}
      >
        <option value="">Choose an existing record</option>
        {grouped.map((group) => (
          <optgroup key={group.kind} label={group.label}>
            {group.items.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title} ({option.id})
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
    </Field>
  );
}

export function PasteIntakeForm({
  endpoints,
  persistAllowed,
  policyAreas,
  initial,
}: {
  endpoints: IntakeEndpointOption[];
  persistAllowed: boolean;
  policyAreas: PolicyAreaOption[];
  initial?: Partial<IntakeFormInput>;
}) {
  const [form, setForm] = useState<IntakeFormInput>({
    ...EMPTY_FORM,
    ...initial,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<Extract<IntakeResponse, { ok: true }> | null>(
    null,
  );
  const [pending, setPending] = useState<"check" | "queue" | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  const fromOption = optionById(endpoints, form.from);
  const career = isCareerEdge(
    form.type as Relationship,
    fromOption?.playerType,
  );
  const pays = form.type === "pays";

  function patch(next: Partial<IntakeFormInput>) {
    setForm((current) => ({ ...current, ...next }));
    setErrors([]);
    setResult(null);
  }

  async function submit(persist: boolean) {
    setPending(persist ? "queue" : "check");
    setErrors([]);
    setResult(null);
    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, persist }),
      });
      const body = (await response.json()) as IntakeResponse;
      if (!body.ok) {
        setErrors(body.errors);
        return;
      }
      setResult(body);
    } catch {
      setErrors(["The check could not run. The page was not fetched."]);
    } finally {
      setPending(null);
    }
  }

  const preview = useMemo(() => formToRawEdge(form), [form]);

  useEffect(() => {
    if (errors.length === 0) return;
    liveRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [errors]);

  return (
    <form
      className="intake-folio flex min-w-0 flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(false);
      }}
    >
      <FieldGroup>
        <FieldSet>
          <FieldLegend>The six required fields</FieldLegend>
          <FieldDescription>
            Paste a sentence from a page you have open. This form does not fetch
            the URL, does not scrape, and does not ask a model to invent a join.
            A pays row still needs you to confirm a program or store a null
            reason — nothing here invents a málaflok.
          </FieldDescription>
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <EndpointSelect
              id="intake-from"
              label="From"
              onChange={(from) => patch({ from })}
              options={endpoints}
              value={form.from}
            />
            <EndpointSelect
              id="intake-to"
              label="To"
              onChange={(to) => patch({ to })}
              options={endpoints}
              value={form.to}
            />
          </div>
          <Field>
            <FieldLabel htmlFor="intake-type">Relationship</FieldLabel>
            <Select
              id="intake-type"
              onChange={(event) => patch({ type: event.target.value })}
              required
              value={form.type}
            >
              <option value="">Allowlisted type only</option>
              {RELATIONSHIP_LIST.map((type) => (
                <option key={type} value={type}>
                  {labelize(type)}
                </option>
              ))}
            </Select>
            <FieldDescription>
              There is no generic “linked to”. A type is not minted to fit one
              page.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="intake-as-of">As of</FieldLabel>
            <Input
              id="intake-as-of"
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
            <FieldLabel htmlFor="intake-source">Official URL</FieldLabel>
            <Input
              id="intake-source"
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
            <FieldLabel htmlFor="intake-quotation">Verbatim quotation</FieldLabel>
            <Textarea
              id="intake-quotation"
              lang={icelandicLang(form.quotation)}
              onChange={(event) => patch({ quotation: event.target.value })}
              required
              rows={6}
              value={form.quotation}
            />
            <FieldDescription>
              The words on the page, in the language the page uses.
            </FieldDescription>
          </Field>
        </FieldSet>

        {career ? (
          <FieldSet>
            <FieldLegend>Career dates</FieldLegend>
            <FieldDescription>
              A holds-office, sits-on-board, or personal invests-in line needs a
              start, an end, and a channel. Use “not printed” when the page
              does not print one.
            </FieldDescription>
            <div className="grid min-w-0 gap-4 lg:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="intake-start">Start</FieldLabel>
                <Input
                  id="intake-start"
                  onValueChange={(start) => patch({ start })}
                  value={form.start}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="intake-end">End</FieldLabel>
                <Input
                  id="intake-end"
                  onValueChange={(end) => patch({ end })}
                  value={form.end}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="intake-channel">Channel</FieldLabel>
                <Select
                  id="intake-channel"
                  onChange={(event) => patch({ channel: event.target.value })}
                  value={form.channel}
                >
                  <option value="">Choose</option>
                  <option value="political">political</option>
                  <option value="business">business</option>
                </Select>
              </Field>
            </div>
          </FieldSet>
        ) : null}

        {pays ? (
          <FieldSet>
            <FieldLegend>Invoice program join</FieldLegend>
            <FieldDescription>
              A pays row needs a year and either a policy-area slug the cited
              page supports, or an explicit null with the reason the join was
              not made. Nothing here guesses from a vendor’s line of business.
            </FieldDescription>
            <Field>
              <FieldLabel htmlFor="intake-year">Year</FieldLabel>
              <Input
                id="intake-year"
                onValueChange={(year) => patch({ year })}
                placeholder="2026"
                value={form.year}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="intake-program">Program</FieldLabel>
              <Select
                id="intake-program"
                onChange={(event) => patch({ program: event.target.value })}
                value={form.program}
              >
                <option value="">Choose</option>
                <option value="__none__">Not joined — store a reason</option>
                {policyAreas.map((area) => (
                  <option key={area.slug} value={area.slug}>
                    {area.title}
                  </option>
                ))}
              </Select>
            </Field>
            {form.program === "__none__" ? (
              <Field>
                <FieldLabel htmlFor="intake-program-reason">
                  Why the join was not made
                </FieldLabel>
                <Textarea
                  id="intake-program-reason"
                  onChange={(event) =>
                    patch({ programNullReason: event.target.value })
                  }
                  rows={3}
                  value={form.programNullReason}
                />
              </Field>
            ) : null}
            {form.program && form.program !== "__none__" ? (
              <>
                <Field>
                  <FieldLabel htmlFor="intake-program-source">
                    Program source URL
                  </FieldLabel>
                  <Input
                    id="intake-program-source"
                    onValueChange={(programSource) => patch({ programSource })}
                    type="url"
                    value={form.programSource}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="intake-program-quotation">
                    Program quotation
                  </FieldLabel>
                  <Textarea
                    id="intake-program-quotation"
                    lang={icelandicLang(form.programQuotation ?? "")}
                    onChange={(event) =>
                      patch({ programQuotation: event.target.value })
                    }
                    rows={4}
                    value={form.programQuotation}
                  />
                </Field>
              </>
            ) : null}
          </FieldSet>
        ) : null}

        <FieldSet>
          <FieldLegend>Amount, if the sentence prints one</FieldLegend>
          <FieldDescription>
            Leave this blank unless a figure is in the quotation. The stored
            number must appear inside that citation. Two amounts are never
            added together.
          </FieldDescription>
          <div className="grid min-w-0 gap-4 lg:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="intake-amount-value">Value</FieldLabel>
              <Input
                id="intake-amount-value"
                inputMode="decimal"
                onValueChange={(amountValue) => patch({ amountValue })}
                placeholder="192293.9"
                value={form.amountValue}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="intake-amount-unit">Unit</FieldLabel>
              <Select
                id="intake-amount-unit"
                onChange={(event) => patch({ amountUnit: event.target.value })}
                value={form.amountUnit}
              >
                <option value="">None</option>
                {[...MONEY_UNITS].sort().map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="intake-amount-basis">Basis</FieldLabel>
              <Select
                id="intake-amount-basis"
                onChange={(event) => patch({ amountBasis: event.target.value })}
                value={form.amountBasis}
              >
                <option value="">None</option>
                {[...MONEY_BASES].map((basis) => (
                  <option key={basis} value={basis}>
                    {basis}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="intake-amount-quotation">
              Amount quotation (must be a substring of the edge quotation)
            </FieldLabel>
            <Textarea
              id="intake-amount-quotation"
              lang={icelandicLang(form.amountQuotation ?? "")}
              onChange={(event) =>
                patch({ amountQuotation: event.target.value })
              }
              rows={3}
              value={form.amountQuotation}
            />
          </Field>
        </FieldSet>
      </FieldGroup>

      <div className="intake-actions flex flex-wrap gap-2">
        <Button disabled={pending != null} type="submit">
          {pending === "check" ? "Checking…" : "Check against the contract"}
        </Button>
        <Button
          disabled={pending != null || !persistAllowed}
          onClick={() => void submit(true)}
          type="button"
          variant="outline"
        >
          {pending === "queue" ? "Queuing…" : "Queue for review"}
        </Button>
      </div>
      {!persistAllowed ? (
        <p className="text-sm text-muted-foreground">
          Queuing writes <code className="text-sm">data/intake-queue.json</code>{" "}
          on a local/dev tree. It is disabled here.{" "}
          <code className="text-sm">data/edges.json</code> is never written by
          this form.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Queue writes <code className="text-sm">data/intake-queue.json</code>.
          It does not append to <code className="text-sm">data/edges.json</code>.
          Promote a row by hand after the contract tests would pass.
        </p>
      )}

      <div
        aria-live="polite"
        className="flex min-w-0 flex-col gap-3"
        ref={liveRef}
      >
        {errors.length > 0 ? (
          <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border/70 p-4">
            <p className="text-sm font-medium">The contract refuses this row.</p>
            <FieldError errors={errors.map((message) => ({ message }))} />
            {errors.some((error) => error.includes("does not exist")) ? (
              <p className="text-sm leading-6 text-muted-foreground">
                A missing endpoint is not a stub player. File the printed name
                on the{" "}
                <a className="underline underline-offset-4" href="#quoted-names">
                  quoted-name ledger
                </a>
                . Unmatched stays unmatched.
              </p>
            ) : null}
          </div>
        ) : null}
        {result?.ok && !result.queued ? (
          <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border/70 p-4">
            <p className="text-sm font-medium">The contract accepts this row.</p>
            <p className="text-sm leading-6 text-muted-foreground">
              It has not been written to{" "}
              <code className="text-sm">data/edges.json</code>. Queue it for
              review, or copy the JSON below.
            </p>
            <pre className="max-h-80 overflow-auto text-xs leading-5">
              {JSON.stringify(result.row, null, 2)}
            </pre>
          </div>
        ) : null}
        {result?.ok && result.queued ? (
          <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border/70 p-4">
            <p className="text-sm font-medium">
              {result.created === false
                ? "Already in the review queue"
                : "Queued for review"}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {result.id}. Written to {result.file}. The published edge file was
              not changed.
            </p>
            <pre className="max-h-80 overflow-auto text-xs leading-5">
              {JSON.stringify(result.row, null, 2)}
            </pre>
          </div>
        ) : null}
        {errors.length === 0 && result == null ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>Nothing queued yet</EmptyTitle>
              <EmptyDescription>
                Check a pasted sentence before it can sit in the review file.
                Preview of the object as filled:{" "}
                <code className="text-sm">
                  {typeof preview.type === "string" && preview.type
                    ? preview.type
                    : "no type"}
                </code>
                .
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
      </div>
    </form>
  );
}
