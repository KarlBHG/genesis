"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function tabFromHash(
  hash: string,
): "inventory" | "checklist" | "quoted-names" | "ownership" {
  const id = hash.replace(/^#/, "");
  if (id === "quoted-names") return "quoted-names";
  if (id === "checklist" || id === "open-checklists") return "checklist";
  if (id === "ownership") return "ownership";
  return "inventory";
}

export function PublicEntityTabs({
  inventory,
  checklist,
  quotedNames,
  ownership,
}: {
  inventory: ReactNode;
  checklist: ReactNode;
  quotedNames: ReactNode;
  ownership: ReactNode;
}) {
  const [tab, setTab] = useState<
    "inventory" | "checklist" | "quoted-names" | "ownership"
  >("inventory");

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
    <Tabs
      className="gap-8"
      onValueChange={(value) => setTab(value as typeof tab)}
      value={tab}
    >
      <TabsList
        aria-label="Public entity ledgers"
        className="h-auto w-full flex-nowrap justify-start overflow-x-auto"
        variant="line"
      >
        <TabsTrigger value="inventory">In-scope inventory</TabsTrigger>
        <TabsTrigger value="ownership">Ownership statements</TabsTrigger>
        <TabsTrigger value="checklist">Govdirectory checklist</TabsTrigger>
        <TabsTrigger value="quoted-names">Quoted names</TabsTrigger>
      </TabsList>
      <TabsContent className="flex flex-col gap-8 outline-none" value="inventory">
        {inventory}
      </TabsContent>
      <TabsContent
        className="flex scroll-mt-24 flex-col gap-4 outline-none"
        id="ownership"
        value="ownership"
      >
        {ownership}
      </TabsContent>
      <TabsContent className="flex flex-col gap-4 outline-none" value="checklist">
        {checklist}
      </TabsContent>
      <TabsContent
        className="flex scroll-mt-24 flex-col gap-4 outline-none"
        id="quoted-names"
        value="quoted-names"
      >
        {quotedNames}
      </TabsContent>
    </Tabs>
  );
}
