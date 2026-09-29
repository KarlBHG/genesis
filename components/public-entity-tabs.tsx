"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { scheduleScrollHashPastMasthead } from "@/lib/scroll-past-masthead";

function tabFromHash(
  hash: string,
): "inventory" | "checklist" | "quoted-names" | "ownership" | "parent-ministry" {
  const id = hash.replace(/^#/, "");
  if (id === "quoted-names") return "quoted-names";
  if (id === "checklist" || id === "open-checklists") return "checklist";
  if (id === "ownership") return "ownership";
  if (id === "parent-ministry" || id === "parent") return "parent-ministry";
  return "inventory";
}

export function PublicEntityTabs({
  inventory,
  checklist,
  quotedNames,
  ownership,
  parentMinistry,
}: {
  inventory: ReactNode;
  checklist: ReactNode;
  quotedNames: ReactNode;
  ownership: ReactNode;
  parentMinistry: ReactNode;
}) {
  const [tab, setTab] = useState<
    | "inventory"
    | "checklist"
    | "quoted-names"
    | "ownership"
    | "parent-ministry"
  >("inventory");
  const [live, setLive] = useState(false);

  useEffect(() => {
    const apply = () => setTab(tabFromHash(window.location.hash));
    apply();
    setLive(true);
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  useEffect(() => scheduleScrollHashPastMasthead(), [tab]);

  return (
    <Tabs
      className="gap-8"
      data-tabs-live={live ? "" : undefined}
      onValueChange={(value) => setTab(value as typeof tab)}
      value={tab}
    >
      <TabsList
        aria-label="Public entity ledgers"
        className="folio-tabs h-auto w-full justify-start"
        variant="line"
      >
        <TabsTrigger value="inventory">In-scope inventory</TabsTrigger>
        <TabsTrigger value="ownership">Ownership statements</TabsTrigger>
        <TabsTrigger value="parent-ministry">Parent ministry</TabsTrigger>
        <TabsTrigger value="checklist">Govdirectory checklist</TabsTrigger>
        <TabsTrigger value="quoted-names">Quoted names</TabsTrigger>
      </TabsList>
      <TabsContent className="flex flex-col gap-8 outline-none" value="inventory">
        {inventory}
      </TabsContent>
      <TabsContent className="flex flex-col gap-4 outline-none" value="ownership">
        <div className="flex min-w-0 flex-col gap-4" id="ownership">
          {ownership}
        </div>
      </TabsContent>
      <TabsContent
        className="flex flex-col gap-4 outline-none"
        value="parent-ministry"
      >
        <div className="flex min-w-0 flex-col gap-4" id="parent-ministry">
          {parentMinistry}
        </div>
      </TabsContent>
      <TabsContent className="flex flex-col gap-4 outline-none" value="checklist">
        {checklist}
      </TabsContent>
      <TabsContent className="flex flex-col gap-4 outline-none" value="quoted-names">
        <div className="flex min-w-0 flex-col gap-4" id="quoted-names">
          {quotedNames}
        </div>
      </TabsContent>
    </Tabs>
  );
}
