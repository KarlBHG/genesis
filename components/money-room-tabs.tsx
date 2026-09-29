"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function tabFromHash(hash: string): "authorisations" | "invoices" | "contracts" {
  const id = hash.replace(/^#/, "");
  if (
    id === "invoices" ||
    id === "invoice-coverage" ||
    id === "printed-headings"
  ) {
    return "invoices";
  }
  if (id === "contracts") return "contracts";
  return "authorisations";
}

export function MoneyRoomTabs({
  authorisations,
  invoices,
  contracts,
}: {
  authorisations: ReactNode;
  invoices: ReactNode;
  contracts: ReactNode;
}) {
  const [tab, setTab] = useState<"authorisations" | "invoices" | "contracts">(
    "authorisations",
  );

  useEffect(() => {
    const apply = () => setTab(tabFromHash(window.location.hash));
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  useEffect(() => {
    const id = window.location.hash.replace(/^#/, "");
    if (!id) return;
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [tab]);

  return (
    <Tabs className="gap-8" onValueChange={(value) => setTab(value as typeof tab)} value={tab}>
      <TabsList
        aria-label="Budget rooms"
        className="h-auto w-full flex-wrap justify-start"
        variant="line"
      >
        <TabsTrigger value="authorisations">Authorisations</TabsTrigger>
        <TabsTrigger value="invoices">Invoice coverage</TabsTrigger>
        <TabsTrigger value="contracts">Contracts & other</TabsTrigger>
      </TabsList>
      <TabsContent className="flex flex-col gap-8 outline-none" value="authorisations">
        {authorisations}
      </TabsContent>
      <TabsContent className="flex flex-col gap-8 outline-none" value="invoices">
        {invoices}
      </TabsContent>
      <TabsContent className="flex flex-col gap-8 outline-none" value="contracts">
        {contracts}
      </TabsContent>
    </Tabs>
  );
}
