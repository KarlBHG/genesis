import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/standing",
  "/map",
  "/money",
  "/anomalies",
  "/methodology",
  "/intake",
  "/intake/opnir",
  "/connections",
  "/public-entities",
  "/obligations",
  "/treaties",
  "/institutions",
  "/players",
  "/events",
  "/business",
  "/offices",
];

for (const route of ROUTES) {
  test(`a11y smoke ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("main")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });
}

test("paste intake checks a sourced line without writing edges.json", async ({
  page,
}) => {
  await page.goto("/intake");
  await expect(
    page.getByRole("heading", { name: "Paste a sourced line" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "Paste a line",
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Footer" }).getByRole("link", {
      name: "Paste a line",
    }),
  ).toBeVisible();

  await page.locator("#intake-from").selectOption("financial-supervisory-authority");
  await page.locator("#intake-to").selectOption("lsr");
  await page.locator("#intake-type").selectOption("regulates");
  await page.locator("#intake-as-of").fill("consolidated statute");
  await page.locator("#intake-source").fill(
    "https://www.althingi.is/lagas/nuna/1997129.html",
  );
  await page.locator("#intake-quotation").fill(
    "Article 44 of the consolidated Act No. 129/1997 says Fjármálaeftirlitið supervises that pension funds operate in line with the act.",
  );

  await page.locator("#intake-amount-value").fill("999");
  await page.locator("#intake-amount-unit").selectOption("ISK");
  await page.locator("#intake-amount-basis").selectOption("statement");
  await page.locator("#intake-amount-quotation").fill(
    "Fjármálaeftirlitið supervises that pension funds operate in line with the act.",
  );
  await page.getByRole("button", { name: "Check against the contract" }).click();
  await expect(page.locator("[data-slot=field-error]")).toContainText(
    "value 999 is not printed in its quotation",
  );

  await page.locator("#intake-amount-value").fill("");
  await page.locator("#intake-amount-unit").selectOption("");
  await page.locator("#intake-amount-basis").selectOption("");
  await page.locator("#intake-amount-quotation").fill("");
  await page.getByRole("button", { name: "Check against the contract" }).click();
  await expect(
    page.getByText("The contract accepts this row."),
  ).toBeVisible();
  await expect(page.getByText("Queued for review")).toHaveCount(0);
});

test("paste intake refuses an illegal pair-type", async ({ page }) => {
  await page.goto("/intake");
  await page.locator("#intake-from").selectOption("kristrun-frostadottir");
  await page.locator("#intake-to").selectOption("landsbankinn");
  await page.locator("#intake-type").selectOption("regulates");
  await page.locator("#intake-as-of").fill("2026");
  await page.locator("#intake-source").fill("https://www.althingi.is/");
  await page.locator("#intake-quotation").fill(
    "A person does not regulate a bank on this graph.",
  );
  await page.getByRole("button", { name: "Check against the contract" }).click();
  await expect(page.locator("[data-slot=field-error]")).toContainText(
    "regulates cannot run from person to organization",
  );
  await expect(page.getByText("The contract accepts this row.")).toHaveCount(0);
});

test("quoted-name ledger stores unmatched names, not stub players", async ({
  page,
}) => {
  await page.goto("/intake");
  const ledger = page.locator("#quoted-names");
  await expect(
    ledger.getByRole("heading", { name: "Quoted-name ledger" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "Quoted names",
    }),
  ).toHaveCount(0);
  await expect(ledger.getByText("No unmatched names on file")).toBeVisible();
  await expect(
    ledger.getByText("It is not a player. It is not drawn as a dashed edge."),
  ).toBeVisible();

  await page.locator("#quoted-name").fill("Síminn");
  await page.locator("#quoted-as-of").fill("2026");
  await page.locator("#quoted-source").fill("https://www.siminn.is/");
  await page.locator("#quoted-quotation").fill(
    "Síminn is printed as the vendor on the buyer ledger.",
  );
  await page.getByRole("button", { name: "Check this quoted name" }).click();
  await expect(
    page.getByText("The contract refuses this placeholder."),
  ).toBeVisible();
  await expect(page.locator("#quoted-names [data-slot=field-error]")).toContainText(
    "uniquely matches",
  );

  await page.locator("#quoted-name").fill("Nowhere ehf.");
  await page.locator("#quoted-as-of").fill("2026-01-30");
  await page.locator("#quoted-source").fill("https://opnirreikningar.is/");
  await page.locator("#quoted-quotation").fill(
    "Nowhere ehf. is printed as a vendor on an official invoice row that names no catalog slug.",
  );
  await page.locator("#quoted-type").selectOption("pays");
  await page.getByRole("button", { name: "Check this quoted name" }).click();
  await expect(
    page.getByText("The contract accepts this placeholder."),
  ).toBeVisible();
  await expect(page.getByText("It is not an edge.")).toBeVisible();
  await expect(page.getByText("Queued as unmatched")).toHaveCount(0);

  await page.goto("/public-entities#quoted-names");
  await expect(page.getByRole("tab", { name: "Quoted names" })).toBeVisible();
  await expect(page.getByText("No unmatched names on file")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "Quoted names",
    }),
  ).toHaveCount(0);
});

test("ownership statements are dated and holes sit on public entities", async ({
  page,
}) => {
  await page.goto("/public-entities#ownership");
  await expect(
    page.getByRole("tab", { name: "Ownership statements" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ownership statements" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "Ownership statements",
    }),
  ).toHaveCount(0);
  await expect(page.getByText("no sourced owns")).toHaveCount(5);
  const ownership = page.locator("#ownership");
  await expect(ownership.getByRole("link", { name: "Íslandsbanki" })).toBeVisible();
  await expect(
    ownership.getByRole("link", { name: "Lífeyrissjóður starfsmanna ríkisins (LSR)" }),
  ).toBeVisible();
  const caption = ownership.locator("[data-slot=table-caption]");
  await expect(caption).toContainText("Counts are rows, not share totals.");
  await expect(caption).toContainText("5 have none");

  const landsvirkjun = ownership.locator("tr", {
    has: page.getByRole("link", { name: "Landsvirkjun", exact: true }),
  });
  await landsvirkjun.getByRole("link", { name: "Ríkissjóður Íslands" }).click();
  await expect(
    page.getByRole("heading", { name: "Ownership statement" }),
  ).toBeVisible();
  await expect(page.getByText("Interested party", { exact: true })).toBeVisible();
  await expect(page.getByText("Subject", { exact: true })).toBeVisible();
  await expect(page.locator("h1")).toHaveText(/Ownership\s+statement/);
  await expect(page.locator("h1")).not.toHaveText(/owns /i);

  await page.goto("/players/islandsbanki");
  await expect(page.getByText("no sourced owns", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ownership checklist" })).toHaveAttribute(
    "href",
    "/public-entities#ownership",
  );

  await page.goto("/players/landsvirkjun");
  await expect(page.getByText("sourced statement")).toBeVisible();
});

test("office pages keep the post and list time-bounded membership", async ({
  page,
}) => {
  await page.goto("/offices");
  await expect(page.getByRole("heading", { name: "Offices" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "Offices",
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Footer" }).getByRole("link", {
      name: "Offices",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Holder field vs typed membership" }),
  ).toBeVisible();
  await expect(
    page.locator("#holder-mismatch").getByText(
      "holder field vs typed membership: mismatch",
    ),
  ).toHaveCount(6);
  await expect(page.locator("#posts").getByText("vacant", { exact: true })).toHaveCount(
    6,
  );
  await expect(
    page.locator("#holder-mismatch").getByRole("link", {
      name: "Director of Health",
    }),
  ).toBeVisible();

  await page.goto("/offices/prime-minister");
  await expect(page.getByRole("heading", { name: "Prime Minister" })).toBeVisible();
  await expect(page.getByText("Post", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("current membership", { exact: true })).toBeVisible();
  await expect(page.getByText("vacant", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Membership" })).toBeVisible();
  const membership = page.locator("#membership");
  await expect(membership.getByRole("link", { name: "Kristrún Frostadóttir" })).toBeVisible();
  await expect(membership.getByText("21 December 2024")).toHaveCount(2);
  await expect(membership.getByText("not printed")).toBeVisible();
  await expect(membership.getByRole("link", { name: "permalink" })).toHaveAttribute(
    "href",
    /\/connections\//,
  );
  await expect(page.getByText("Holder", { exact: true })).toHaveCount(0);

  await page.goto("/offices/director-of-health");
  await expect(page.getByRole("heading", { name: "Director of Health" })).toBeVisible();
  await expect(page.getByText("vacant").first()).toBeVisible();
  await expect(page.getByText("Vacant. Not filled from the holder field.")).toBeVisible();
  await expect(
    page.getByText("holder field vs typed membership: mismatch"),
  ).toBeVisible();
  const directorMembership = page.locator("#membership");
  await expect(directorMembership.getByRole("link", { name: "Alma D. Möller" })).toBeVisible();
  await expect(directorMembership.getByText("ended", { exact: true })).toBeVisible();
  await expect(directorMembership.getByText("current", { exact: true })).toHaveCount(0);

  await page.goto("/offices/ceo-of-landsvirkjun");
  const ceoMembership = page.locator("#membership");
  await expect(ceoMembership.getByRole("link", { name: "Hörður Arnarson" })).toBeVisible();
  await expect(ceoMembership.getByText("not printed")).toHaveCount(2);
  await expect(ceoMembership).not.toContainText("21 April 2026");
  const board = page.locator("#board-seats");
  await expect(board.getByRole("heading", { name: "Board seats" })).toBeVisible();
  await expect(board.getByRole("link", { name: "Brynja Baldursdóttir" })).toBeVisible();

  await page.goto("/offices/minister-of-social-affairs-and-housing");
  const social = page.locator("#membership");
  await expect(social.getByText("current", { exact: true })).toBeVisible();
  await expect(social.getByText("ended", { exact: true })).toBeVisible();
  await expect(social.getByRole("link", { name: "Ragnar Þór Ingólfsson" })).toBeVisible();
  await expect(social.getByRole("link", { name: "Inga Sæland" })).toBeVisible();
});

test("connections tenure filter labels empty ends and does not invent current", async ({
  page,
}) => {
  await page.goto("/connections");
  const tenure = page.getByRole("region", {
    name: "Filter current or ended connections",
  });
  await expect(tenure).toBeVisible();
  await expect(tenure).toContainText("no end date stored");
  await expect(tenure).toContainText("never labelled “current.”");
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "Tenure",
    }),
  ).toHaveCount(0);
  await expect(page.locator("#careers").getByText("current", { exact: true })).toHaveCount(
    0,
  );

  await tenure.getByRole("button", { name: /current membership/i }).click();
  await expect(page).toHaveURL(/tenure=current/);
  const careers = page.locator("#careers");
  await expect(careers).toBeVisible();
  await expect(
    careers.getByRole("link", { name: "Kristrún Frostadóttir" }).first(),
  ).toBeVisible();
  await expect(careers.getByRole("link", { name: "Prime Minister" }).first()).toBeVisible();
  await expect(careers.getByText("current membership").first()).toBeVisible();
  await expect(careers.getByText("no end date stored").first()).toBeVisible();
  await expect(careers.getByText("ended", { exact: true })).toHaveCount(0);
  await expect(careers.getByRole("link", { name: "Director of Health" })).toHaveCount(0);
  await expect(page.locator("#spending")).toHaveCount(0);

  await careers.getByRole("link", { name: "Open this connection" }).first().click();
  await expect(page).toHaveURL(/\/connections\//);
  await expect(page.getByText("current membership").first()).toBeVisible();
  const endField = page.locator(".folio-gutter > div").filter({
    has: page.getByText("End", { exact: true }),
  });
  await expect(endField.getByText("no end date stored")).toBeVisible();
  await expect(endField.getByText("current", { exact: true })).toHaveCount(0);

  await page
    .getByRole("region", { name: "Filter current or ended connections" })
    .getByRole("button", { name: /^ended/i })
    .click();
  await expect(page).toHaveURL(/tenure=ended/);
  const endedCareers = page.locator("#careers");
  await expect(endedCareers.locator("li").getByText("ended", { exact: true }).first()).toBeVisible();
  await expect(
    endedCareers.getByRole("link", { name: "Director of Health" }).first(),
  ).toBeVisible();
  await expect(
    endedCareers.getByRole("link", { name: "Alma D. Möller" }).first(),
  ).toBeVisible();
  await expect(
    endedCareers.getByRole("link", { name: "Prime Minister" }),
  ).toHaveCount(0);
  await expect(endedCareers.locator("li").getByText("current membership")).toHaveCount(0);
});

test("unprinted career ends are listed, not filled", async ({ page }) => {
  await page.goto("/connections#unprinted-ends");
  const checklist = page.locator("#unprinted-ends");
  await expect(
    checklist.getByRole("heading", { name: "No end date stored" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "No end date stored",
    }),
  ).toHaveCount(0);
  await expect(
    checklist.getByText("no end date stored", { exact: true }),
  ).toHaveCount(23);
  await expect(checklist.getByText("current", { exact: true })).toHaveCount(0);
  const caption = checklist.locator("[data-slot=table-caption]");
  await expect(caption).toContainText("23 career lines");
  await expect(caption).toContainText("3 disclosed holdings");
  await expect(caption).toContainText("20 board seats");
  await expect(caption).toContainText("Counts are rows, not totals");
  await expect(caption).toContainText("Listed, not filled");
  await expect(
    checklist.getByRole("link", { name: "Brynja Baldursdóttir" }),
  ).toBeVisible();
  await expect(
    checklist.getByRole("link", { name: "Landsvirkjun" }),
  ).toBeVisible();
  await expect(
    checklist.getByRole("link", { name: "Daði Már Kristófersson" }).first(),
  ).toBeVisible();
  await expect(
    checklist.getByRole("link", { name: "Staðarhóll ráðgjöf slf." }),
  ).toBeVisible();
  await expect(
    checklist.locator("code").filter({ hasText: "invests-in" }),
  ).toHaveCount(3);
  await expect(
    checklist.locator("code").filter({ hasText: "sits-on-board" }),
  ).toHaveCount(20);

  await checklist.getByRole("link", { name: "Open this connection" }).first().click();
  await expect(page).toHaveURL(/\/connections\//);
  await expect(page.getByText("Open the checklist")).toBeVisible();
  const endField = page.locator(".folio-gutter > div").filter({
    has: page.getByText("End", { exact: true }),
  });
  await expect(endField.getByText("no end date stored")).toBeVisible();
  await expect(endField.getByText("current", { exact: true })).toHaveCount(0);
});


test("parent-ministry checklist labels empty parents and stays off the nav", async ({
  page,
}) => {
  await page.goto("/public-entities#parent-ministry");
  await expect(page.getByRole("tab", { name: "Parent ministry" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Parent ministry" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "Parent ministry",
    }),
  ).toHaveCount(0);
  await expect(page.getByText("empty parent", { exact: true })).toHaveCount(6);
  await expect(
    page.locator("#parent-ministry").getByRole("link", {
      name: "Samkeppniseftirlitið (Competition Authority)",
    }),
  ).toBeVisible();
  const caption = page.locator("#parent-ministry [data-slot=table-caption]");
  await expect(caption).toContainText("Counts are rows, not totals.");
  await expect(caption).toContainText("6 have an empty parent");

  await page.goto("/institutions/samband-islenskra-sveitarfelaga");
  await expect(page.getByText("empty parent", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Parent-ministry checklist" }),
  ).toHaveAttribute("href", "/public-entities#parent-ministry");

  await page.goto("/institutions/personuvernd");
  await expect(page.getByText("sourced parent")).toBeVisible();
});

test("Opnir review feed needs a human program decision and does not sum amounts", async ({
  page,
}) => {
  await page.goto("/intake/opnir");
  await expect(
    page.getByRole("heading", { name: "Review official Opnir rows" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "Review Opnir rows",
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Footer" }).getByRole("link", {
      name: "Review Opnir rows",
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Load fixture" }).click();
  await expect(
    page.getByText("3 official rows are ready for a human program decision"),
  ).toBeVisible();
  await expect(
    page.getByText("This row does not print a málaflokkur heading."),
  ).toBeVisible();
  await expect(page.locator("#intake-program")).toHaveValue("");
  await expect(page.locator("#intake-from")).toHaveValue("landspitali");
  await expect(page.locator("#intake-to")).toHaveValue("islandsbanki");

  await page.getByRole("button", { name: "Check against the contract" }).click();
  await expect(page.getByText("The contract refuses this row.")).toBeVisible();
  await expect(page.locator("[data-slot=field-error]")).toContainText("program");

  await page.locator("#intake-program").selectOption("__none__");
  await page.locator("#intake-program-reason").fill(
    "The Landspítali buyer ledger on Opnir reikningar prints this invoice row without a málaflok heading on the returned page.",
  );
  await page.getByRole("button", { name: "Check against the contract" }).click();
  await expect(page.getByText("The contract accepts this row.")).toBeVisible();
  await expect(page.getByText("Queued for review")).toHaveCount(0);
});

test("invoice coverage ledger counts rows, not krónur, and keeps Hæstiréttur on Courts", async ({
  page,
}) => {
  await page.goto("/money");
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "Invoice coverage",
    }),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "Invoice coverage" }).click();
  await expect(
    page.getByRole("heading", { name: "Invoice coverage" }),
  ).toBeVisible();
  const coverage = page.locator("#invoice-coverage");
  const caption = coverage.locator("[data-slot=table-caption]");
  await expect(caption).toContainText("100 invoice rows");
  await expect(caption).toContainText("36 joined to a program");
  await expect(caption).toContainText("64 with an explicit null reason");
  await expect(caption).toContainText("0 unreviewed");
  await expect(caption).toContainText("Counts are rows, not krónur.");
  await expect(coverage.getByText(/\bISK\b/)).toHaveCount(0);

  const headings = page.locator("#printed-headings");
  await expect(
    headings.getByRole("heading", { name: "Printed heading = endpoint" }),
  ).toBeVisible();
  await expect(headings.getByText("Hæstiréttur", { exact: true })).toBeVisible();
  await expect(headings.getByRole("link", { name: "Courts" })).toBeVisible();
  await expect(
    headings.getByRole("link", { name: "Hæstiréttur Íslands" }),
  ).toBeVisible();
  await expect(headings.getByText("Invoices were not moved here.")).toBeVisible();
  await expect(headings.getByText("None on file")).toBeVisible();
  await expect(
    headings.locator("[data-slot=empty-description]"),
  ).toContainText("Unmatched vendor strings stay unmatched");
});

test("resident standing walks sourced hops or prints no sourced line", async ({
  page,
}) => {
  await page.goto("/standing");
  await expect(
    page.getByRole("heading", { name: "See their standing" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "Standing",
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Footer" }).getByRole("link", {
      name: "Standing",
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "As a taxpayer" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "As a depositor in a state-owned bank" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "As a voter after 30 Nov 2024" }),
  ).toBeVisible();

  const taxpayer = page.locator("#taxpayer");
  await expect(taxpayer.getByRole("link", { name: "permalink" }).first()).toBeVisible();
  await expect(taxpayer.getByText("Counts are rows, not krónur.")).toBeVisible();
  await expect(taxpayer.getByText(/\bISK\b/)).toHaveCount(0);

  const voter = page.locator("#voter");
  await expect(voter.getByText("no sourced line")).toBeVisible();
  await expect(voter.getByText("this municipality elects a member of Alþingi")).toBeVisible();
  await page.locator("#standing-municipality").selectOption("reykjavikurborg");
  await expect(voter.getByText("no sourced line")).toBeVisible();
  await expect(voter.getByText("Reykjavíkurborg elects a member of Alþingi")).toBeVisible();
  await expect(
    voter.getByRole("link", { name: "permalink" }),
  ).toHaveCount(1);

  await page.locator("#standing-program").selectOption(
    "policy-area-05-skatta-eigna-og-fjarmalaumsysla",
  );
  await expect(
    page.locator("#taxpayer").getByText("no sourced line"),
  ).toBeVisible();
  await expect(
    page.locator("#taxpayer").getByText("an invoice joined to this policy area"),
  ).toBeVisible();

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Three questions" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "As a taxpayer" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "Standing",
    }),
  ).toHaveCount(0);

  await page.goto("/system");
  await expect(
    page.getByRole("heading", { name: "Resident standing" }),
  ).toBeVisible();
  await expect(
    page.locator("main").getByRole("link", { name: "Standing" }),
  ).toHaveAttribute("href", "/standing");

  await page.goto("/methodology#standing");
  await expect(
    page.locator("#standing").getByRole("heading", { name: "Resident standing" }),
  ).toBeVisible();
  await expect(
    page.locator("#standing").getByRole("link", { name: "See their standing" }),
  ).toHaveAttribute("href", "/standing");
});

test("command palette opens with Ctrl+K", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("dialog", { name: "Search the records" })).toHaveCount(0);
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Search the records" })).toBeVisible();
  await expect(page.locator('input[aria-label="Search the records"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Search the records" })).toHaveCount(0);
});

test("print plate is a citable folio", async ({ page }, testInfo) => {
  await page.goto("/institutions/sedlabanki");
  const connectionHref = await page
    .getByRole("link", { name: "Open this connection" })
    .first()
    .getAttribute("href");
  expect(connectionHref).toMatch(/^\/connections\//);

  await page.emulateMedia({ media: "print" });

  await expect(page.locator("[data-print-running-head]")).toHaveText(
    "Institution · sedlabanki · undated",
  );
  await expect(page.locator("[data-print-folio]")).toHaveText("03");
  await expect(page.locator("[data-print-colophon]")).toContainText(
    "Rows are not added together",
  );
  await expect(page.locator("[data-print-colophon]")).toContainText("/methodology");
  await expect(page.locator("[data-print-colophon]")).not.toContainText(/retrieved/i);
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
  await expect(page.locator(".home-constellation")).toHaveCount(0);
  await expect(
    page.getByText("the capital ratio and CET1 ratio are well above the requirements made by the Financial Supervisory Authority of the Central Bank of Iceland and Icelandic law."),
  ).toBeVisible();

  await page.goto(connectionHref!);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("[data-print-folio]")).toHaveText("09");
  await expect(page.locator("[data-print-running-head]")).toHaveText(
    /^Connection · .+ · /,
  );
  await expect(page.locator("[data-print-colophon]")).toContainText(
    "Rows are not added together",
  );
  await expect(page.locator("blockquote.hang-quote").first()).toBeVisible();
  await expect(page.locator("[data-citation-plate]")).toBeVisible();
  await expect(
    page.locator("[data-slot=card] [data-citation-plate]"),
  ).toHaveCount(0);

  await page.goto("/map?focus=althingi");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("[data-print-running-head]")).toHaveText(
    "Map · althingi · undated",
  );
  await expect(page.locator("[data-print-folio]")).toHaveText("02");
  await expect(page.getByRole("region", { name: "Plate caption" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Alþingi" })).toBeVisible();
  await expect(page.getByText("Not on this plate").first()).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
  const canvas = await page.locator(".geo-room").evaluate((el) => {
    return getComputedStyle(el).backgroundColor;
  });
  expect(canvas).not.toBe("rgb(255, 255, 255)");

  await page.goto("/anomalies#contradictions");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("[data-print-running-head]")).toHaveText(
    "Evidence · anomalies · undated",
  );
  await expect(page.locator("[data-print-folio]")).toHaveText("10");
  const printed = page.locator("[data-variorum]").first();
  await expect(printed.locator("blockquote.hang-quote")).toHaveCount(2);
  await expect(printed).toContainText("Unresolved");
  if (testInfo.project.name === "desktop") {
    const printVerso = await printed
      .locator("[data-variorum-leaf=verso]")
      .boundingBox();
    const printRecto = await printed
      .locator("[data-variorum-leaf=recto]")
      .boundingBox();
    expect(printVerso).toBeTruthy();
    expect(printRecto).toBeTruthy();
    expect(printRecto!.x).toBeGreaterThan(printVerso!.x + printVerso!.width - 8);
  }
});

test("citation gutter cites the proving sentence, not a card", async ({
  page,
}, testInfo) => {
  await page.goto("/institutions/sedlabanki");
  await page.locator(".entry-edge-group").first().evaluate((el) => {
    (el as HTMLDetailsElement).open = true;
  });
  const claim = page.locator(".citation-claim").first();
  const gutter = claim.locator("[data-citation-gutter]");
  await expect(gutter).toBeVisible();
  await expect(gutter.locator("blockquote.hang-quote")).toBeVisible();
  await expect(page.locator("[data-slot=card] [data-citation-gutter]")).toHaveCount(
    0,
  );
  await expect(
    page.locator("[data-reading-suggestions] [data-citation-gutter]"),
  ).toHaveCount(0);

  if (testInfo.project.name === "desktop") {
    const bodyBox = await claim.locator(".citation-claim-body").boundingBox();
    const gutterBox = await gutter.boundingBox();
    expect(bodyBox).toBeTruthy();
    expect(gutterBox).toBeTruthy();
    expect(gutterBox!.x).toBeGreaterThan(bodyBox!.x + bodyBox!.width - 8);
    expect(Math.abs(gutterBox!.y - bodyBox!.y)).toBeLessThan(48);
  }

  await page.goto("/anomalies#audits");
  await expect(page.locator("#audits [data-citation-gutter]").first()).toBeVisible();

  await page.goto("/anomalies#contradictions");
  const pair = page.locator("#contradictions [data-variorum]").first();
  await expect(pair.locator("[data-citation-gutter]")).toHaveCount(2);
  await expect(pair.locator("blockquote.hang-quote")).toHaveCount(2);
  await expect(pair.locator("[data-variorum-leaf=verso]")).toBeVisible();
  await expect(pair.locator("[data-variorum-leaf=recto]")).toBeVisible();
  await expect(pair).toContainText("Unresolved");
  await expect(pair).toContainText("Nothing here picks a winner");
  await expect(pair).not.toHaveClass(/rounded-2xl/);
  await expect(
    page.locator("#contradictions [data-slot=card] [data-citation-gutter]"),
  ).toHaveCount(0);

  if (testInfo.project.name === "desktop") {
    const verso = await pair.locator("[data-variorum-leaf=verso]").boundingBox();
    const recto = await pair.locator("[data-variorum-leaf=recto]").boundingBox();
    expect(verso).toBeTruthy();
    expect(recto).toBeTruthy();
    expect(recto!.x).toBeGreaterThan(verso!.x + verso!.width - 8);
    expect(Math.abs(verso!.y - recto!.y)).toBeLessThan(48);
    expect(Math.abs(verso!.width - recto!.width)).toBeLessThan(40);
  }

  await page.goto("/players/landsbankinn");
  const onRecord = page.locator("[data-variorum]");
  await expect(onRecord).toHaveCount(1);
  await expect(onRecord.locator("blockquote.hang-quote")).toHaveCount(2);
  await expect(onRecord).toContainText("around 800");
  await expect(onRecord).toContainText("approximately 819");

  await page.goto("/anomalies?asOf=2025#contradictions");
  const filtered = page.locator("#contradiction-landsbankinn-shareholder-count");
  await expect(filtered.locator("blockquote.hang-quote")).toHaveCount(2);
  await expect(filtered).toContainText("around 800");
  await expect(filtered).toContainText("approximately 819");
  await expect(filtered.locator("[data-variorum-leaf=verso]")).not.toHaveClass(
    /opacity|line-through/,
  );

  await page.goto("/money");
  const intro = page.locator("#government-programs .citation-claim").first();
  await expect(intro.locator("[data-citation-gutter]")).toBeVisible();
  await expect(intro.locator("blockquote.hang-quote")).toBeVisible();
  await expect(
    page.locator("#government-programs .glass-panel [data-citation-gutter]"),
  ).toHaveCount(0);
  await expect(
    page.locator("#government-programs [data-slot=card] [data-citation-gutter]"),
  ).toHaveCount(0);

  if (testInfo.project.name === "desktop") {
    const introBody = await intro.locator(".citation-claim-body").boundingBox();
    const introGutter = await intro
      .locator("[data-citation-gutter]")
      .boundingBox();
    expect(introBody).toBeTruthy();
    expect(introGutter).toBeTruthy();
    expect(introGutter!.x).toBeGreaterThan(introBody!.x + introBody!.width - 8);
  }

  await page.goto("/money/policy-area-02-domstolar");
  const invoices = page.locator("[data-program-invoices]");
  await expect(invoices.locator("[data-citation-gutter]").first()).toBeVisible();
  await expect(invoices.locator("[data-slot=card]")).toHaveCount(0);
  await expect(page.locator("[data-slot=card] [data-citation-gutter]")).toHaveCount(
    0,
  );
});

test("night plate caption reads as a legend, not a GIS inspector", async ({
  page,
}) => {
  await page.goto("/map?focus=althingi");
  await expect(page).toHaveURL(/focus=althingi/);
  const caption = page.getByRole("region", { name: "Plate caption" });
  await expect(caption).toBeVisible();
  await expect(caption.getByText("State", { exact: true })).toBeVisible();
  await expect(caption.getByRole("heading", { name: "Alþingi" })).toBeVisible();
  await expect(caption.getByText("Reykjavík", { exact: true })).toBeVisible();
  await expect(caption).toContainText("Alþingi is Iceland's parliament.");
  await expect(caption.getByRole("link", { name: "Open the entry" })).toBeVisible();
  const legend = caption.getByRole("list", { name: "Legend" });
  await expect(legend.getByRole("listitem").first()).toBeVisible();
  await expect(legend.getByRole("link", { name: "permalink" }).first()).toBeVisible();
  await expect(legend.getByRole("link", { name: "permalink" }).first()).toHaveAttribute(
    "href",
    /\/connections\//,
  );
  await expect(caption.getByRole("heading", { name: "Career" })).toHaveCount(0);

  await page.goto("/map?place=reykjavik&focus=althingi");
  await expect(page).toHaveURL(/place=reykjavik/);
  await expect(page).toHaveURL(/focus=althingi/);
  await expect(
    page.getByRole("region", { name: "Plate caption" }).getByText("Reykjavík", {
      exact: true,
    }),
  ).toBeVisible();

  await page.goto("/map?focus=frimurarareglan");
  const pinOnly = page.getByRole("region", { name: "Plate caption" });
  await expect(pinOnly.getByText("On the drawing, no typed line")).toBeVisible();
  await expect(pinOnly.getByRole("heading", { name: "Frímúrarareglan á Íslandi" })).toBeVisible();
  await expect(pinOnly.getByRole("list", { name: "Legend" })).toHaveCount(0);
  await expect(pinOnly.getByRole("link", { name: "permalink" })).toHaveCount(0);

  await page.goto("/map?views=trade");
  await expect(page.getByText("Off-map endpoints")).toBeVisible();
  await expect(page.getByText("listed here instead of pinned in Reykjavík")).toBeVisible();
});

test.describe("pocket folio", () => {
  test("thumb index is the mobile door and stays ten plates", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");
    await page.goto("/");
    await expect(page.locator(".home-constellation")).toBeHidden();
    await expect(
      page.getByRole("navigation", { name: "Atlas thumb index" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Open menu" }).click();
    const index = page.getByRole("navigation", { name: "Atlas thumb index" });
    await expect(index).toBeVisible();
    await expect(index.getByRole("link")).toHaveCount(10);
    await expect(index.getByRole("link", { name: /System/ })).toContainText("01");
    await expect(index.getByRole("link", { name: /Evidence/ })).toContainText("10");
    await expect(
      page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
        name: "Offices",
      }),
    ).toHaveCount(0);
  });

  test("map caption docks as a bottom sheet over the island", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");
    await page.goto("/map?focus=althingi");
    const caption = page.getByRole("region", { name: "Plate caption" });
    await expect(caption).toBeVisible();
    await expect(page.getByRole("group", { name: "This plate" })).toBeVisible();
    await expect(page.locator(".geo-chips")).toBeHidden();
    await expect(page.locator(".geo-rail")).toBeHidden();
    await expect(caption.getByRole("heading", { name: "Alþingi" })).toBeVisible();
    await expect(caption.getByText("Alþingi is Iceland's parliament.")).toBeVisible();
    const peek = await caption.boundingBox();
    expect(peek).toBeTruthy();
    expect(peek!.height).toBeLessThan(240);
    const stage = await page.locator(".geo-stage").boundingBox();
    expect(stage).toBeTruthy();
    expect(peek!.y).toBeGreaterThan(stage!.y);

    await caption.getByRole("button", { name: "Pull to read quotations" }).click();
    const open = await caption.boundingBox();
    expect(open!.height).toBeGreaterThan(peek!.height);
    const legend = caption.getByRole("list", { name: "Legend" });
    await expect(legend.getByRole("link", { name: "permalink" }).first()).toBeVisible();
  });

  test("peek still stamps pin-only records", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");
    await page.goto("/map?focus=frimurarareglan");
    const caption = page.getByRole("region", { name: "Plate caption" });
    await expect(caption.getByText("On the drawing, no typed line").first()).toBeVisible();
    await expect(
      caption.getByRole("heading", { name: "Frímúrarareglan á Íslandi" }),
    ).toBeVisible();
    await expect(caption.getByRole("list", { name: "Legend" })).toHaveCount(0);
    const peek = await caption.boundingBox();
    expect(peek!.height).toBeLessThan(240);
  });

  test("reading pages stack the fact strip as a gutter", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");
    await page.goto("/institutions/sedlabanki");
    const facts = page.locator(".entry-fact-strip > div");
    await expect(facts).toHaveCount(4);
    const first = await facts.nth(0).boundingBox();
    const second = await facts.nth(1).boundingBox();
    expect(first).toBeTruthy();
    expect(second).toBeTruthy();
    expect(second!.y).toBeGreaterThan(first!.y + first!.height / 2);
  });

  test("home folio-rail, obligation index, and office record stack", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");
    await page.goto("/");
    const rail = page.locator(".folio-cell");
    await expect(rail).toHaveCount(4);
    const railFirst = await rail.nth(0).boundingBox();
    const railSecond = await rail.nth(1).boundingBox();
    expect(railSecond!.y).toBeGreaterThan(railFirst!.y + railFirst!.height / 2);

    await page.goto("/obligations");
    const themes = page.locator("header").getByRole("listitem").getByRole("link");
    await expect(themes).toHaveCount(9);
    const themeFirst = await themes.nth(0).boundingBox();
    const themeSecond = await themes.nth(1).boundingBox();
    expect(themeSecond!.y).toBeGreaterThan(themeFirst!.y + themeFirst!.height / 2);

    await page.goto("/offices/prime-minister");
    await expect(page.getByRole("heading", { name: "Prime Minister" })).toBeVisible();
    const record = page.locator("main .folio-gutter > div");
    await expect(record).toHaveCount(2);
    await expect(record.nth(0)).toBeVisible();
    await expect(record.nth(1)).toBeVisible();
    const org = await record.nth(0).boundingBox();
    const membership = await record.nth(1).boundingBox();
    expect(membership!.y).toBeGreaterThan(org!.y + org!.height / 2);
  });

  test("budget treemap yields to magnitude and invoices stack as a ledger", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");
    await page.goto("/money");
    await expect(page.locator(".policy-treemap")).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "2026 authorisations by policy area" }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Invoice coverage" }).click();
    const coverage = page.locator("#invoice-coverage");
    await expect(coverage).toBeVisible();
    const vendor = coverage.locator(".pocket-ledger-row td[data-label='Vendor']").first();
    const asOf = coverage.locator(".pocket-ledger-row td[data-label='As of']").first();
    await expect(vendor).toBeVisible();
    const vendorBox = await vendor.boundingBox();
    const asOfBox = await asOf.boundingBox();
    expect(asOfBox!.y).toBeGreaterThan(vendorBox!.y + vendorBox!.height / 2);
    expect(vendorBox!.width).toBeGreaterThan(280);
  });

  test("evidence as-of chips become a year index", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");
    await page.goto("/anomalies");
    const chips = page.locator(".as-of-rail .as-of-chip");
    await expect(chips.first()).toBeVisible();
    const first = await chips.nth(0).boundingBox();
    const second = await chips.nth(1).boundingBox();
    expect(second!.y).toBeGreaterThan(first!.y + first!.height / 2);
  });

  test("evidence type pills become a pocket index", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");
    await page.goto("/anomalies");
    const types = page.locator(".type-rail .type-chip");
    await expect(types).toHaveCount(5);
    const first = await types.nth(0).boundingBox();
    const second = await types.nth(1).boundingBox();
    expect(second!.y).toBeGreaterThan(first!.y + first!.height / 2);
    expect(first!.width).toBeGreaterThan(280);
  });

  test("home portals stay one plate before lg", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");
    await page.setViewportSize({ width: 800, height: 844 });
    await page.goto("/");
    const portals = page.locator(".home-portals a");
    await expect(portals).toHaveCount(6);
    const first = await portals.nth(0).boundingBox();
    const second = await portals.nth(1).boundingBox();
    expect(second!.y).toBeGreaterThan(first!.y + first!.height / 2);
    expect(first!.width).toBeGreaterThan(500);
  });

  test("office, connections, and public-entity tables stack as pocket rows", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");
    await page.goto("/offices");
    const post = page.locator("#posts .pocket-ledger-row td[data-label='Post']").first();
    const org = page.locator("#posts .pocket-ledger-row td[data-label='Organization']").first();
    await expect(post).toBeVisible();
    const postBox = await post.boundingBox();
    const orgBox = await org.boundingBox();
    expect(orgBox!.y).toBeGreaterThan(postBox!.y + postBox!.height / 2);
    expect(postBox!.width).toBeGreaterThan(280);

    await page.goto("/connections#not-on-the-drawing");
    const record = page
      .locator("#not-on-the-drawing .pocket-ledger-row td[data-label='Record']")
      .first();
    const kind = page
      .locator("#not-on-the-drawing .pocket-ledger-row td[data-label='Kind']")
      .first();
    await expect(record).toBeVisible();
    const recordBox = await record.boundingBox();
    const kindBox = await kind.boundingBox();
    expect(kindBox!.y).toBeGreaterThan(recordBox!.y + recordBox!.height / 2);
    expect(recordBox!.width).toBeGreaterThan(280);

    await page.goto("/public-entities");
    const inventory = page
      .locator("[data-slot=table] .pocket-ledger-row td[data-label='Entity']")
      .first();
    const catalog = page
      .locator("[data-slot=table] .pocket-ledger-row td[data-label='Catalog']")
      .first();
    await expect(inventory).toBeVisible();
    const inventoryBox = await inventory.boundingBox();
    const catalogBox = await catalog.boundingBox();
    expect(catalogBox!.y).toBeGreaterThan(inventoryBox!.y + inventoryBox!.height / 2);
    expect(inventoryBox!.width).toBeGreaterThan(280);

    await page.goto("/public-entities#ownership");
    const entity = page
      .locator("#ownership .pocket-ledger-row td[data-label='Entity']")
      .first();
    const status = page
      .locator("#ownership .pocket-ledger-row td[data-label='Status']")
      .first();
    await expect(entity).toBeVisible();
    const entityBox = await entity.boundingBox();
    const statusBox = await status.boundingBox();
    expect(statusBox!.y).toBeGreaterThan(entityBox!.y + entityBox!.height / 2);
    expect(entityBox!.width).toBeGreaterThan(280);
  });

  test("quoted-name, membership, variorum, and public-entity tabs stack before lg", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");

    await page.goto("/offices/prime-minister");
    const person = page
      .locator("#membership .pocket-ledger-row td[data-label='Person']")
      .first();
    const start = page
      .locator("#membership .pocket-ledger-row td[data-label='Start']")
      .first();
    await expect(person).toBeVisible();
    const personBox = await person.boundingBox();
    const startBox = await start.boundingBox();
    expect(startBox!.y).toBeGreaterThan(personBox!.y + personBox!.height / 2);
    expect(personBox!.width).toBeGreaterThan(280);

    await page.goto("/offices/ceo-of-landsvirkjun");
    const boardPerson = page
      .locator("#board-seats .pocket-ledger-row td[data-label='Person']")
      .first();
    const boardAsOf = page
      .locator("#board-seats .pocket-ledger-row td[data-label='As of']")
      .first();
    await expect(boardPerson).toBeVisible();
    const boardPersonBox = await boardPerson.boundingBox();
    const boardAsOfBox = await boardAsOf.boundingBox();
    expect(boardAsOfBox!.y).toBeGreaterThan(
      boardPersonBox!.y + boardPersonBox!.height / 2,
    );

    await page.goto("/anomalies#contradictions");
    const spread = page.locator(".variorum-spread").first();
    await expect(spread).toBeVisible();
    const sides = spread.locator("[data-citation-gutter]");
    await expect(sides).toHaveCount(2);
    const firstSide = await sides.nth(0).boundingBox();
    const secondSide = await sides.nth(1).boundingBox();
    expect(secondSide!.y).toBeGreaterThan(firstSide!.y + firstSide!.height / 2);
    expect(firstSide!.width).toBeGreaterThan(280);

    await page.setViewportSize({ width: 800, height: 844 });
    await page.goto("/anomalies#contradictions");
    const tabletSpread = page.locator(".variorum-spread").first();
    const tabletSides = tabletSpread.locator("[data-citation-gutter]");
    const tabletFirst = await tabletSides.nth(0).boundingBox();
    const tabletSecond = await tabletSides.nth(1).boundingBox();
    expect(tabletSecond!.y).toBeGreaterThan(tabletFirst!.y + tabletFirst!.height / 2);
    expect(tabletFirst!.width).toBeGreaterThan(500);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/public-entities");
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(5);
    const firstTab = await tabs.nth(0).boundingBox();
    const secondTab = await tabs.nth(1).boundingBox();
    expect(secondTab!.y).toBeGreaterThan(firstTab!.y + firstTab!.height / 2);
    expect(firstTab!.width).toBeGreaterThan(280);
    await expect(page.locator(".folio-tabs")).toHaveCSS("overflow-x", "visible");

    await page.getByRole("tab", { name: "Quoted names" }).click();
    await expect(page.getByText("No unmatched names on file")).toBeVisible();
    await expect(page.locator("#quoted-names .pocket-ledger")).toHaveCount(0);
  });

  test("budget tabs, landing chains, browsers, and standing picks stack before lg", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");

    await page.goto("/money");
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(3);
    const firstTab = await tabs.nth(0).boundingBox();
    const secondTab = await tabs.nth(1).boundingBox();
    expect(secondTab!.y).toBeGreaterThan(firstTab!.y + firstTab!.height / 2);
    expect(firstTab!.width).toBeGreaterThan(280);
    await expect(page.locator(".folio-tabs")).toHaveCSS("overflow-x", "visible");

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /chains to start from/ }),
    ).toBeVisible();
    const chains = page.locator(".landing-chains article");
    await expect(chains).toHaveCount(6);
    await chains.nth(0).scrollIntoViewIfNeeded();
    await expect(chains.nth(0)).toBeVisible();
    await expect(chains.nth(1)).toBeVisible();
    const chainFirst = await chains.nth(0).boundingBox();
    const chainSecond = await chains.nth(1).boundingBox();
    expect(chainFirst).toBeTruthy();
    expect(chainSecond).toBeTruthy();
    expect(chainSecond!.y).toBeGreaterThan(chainFirst!.y + chainFirst!.height / 2);
    expect(chainFirst!.width).toBeGreaterThan(280);

    await page.setViewportSize({ width: 800, height: 844 });
    await page.goto("/");
    const tabletChains = page.locator(".landing-chains article");
    await expect(tabletChains).toHaveCount(6);
    await tabletChains.nth(0).scrollIntoViewIfNeeded();
    await expect(tabletChains.nth(0)).toBeVisible();
    await expect(tabletChains.nth(1)).toBeVisible();
    const tabletFirst = await tabletChains.nth(0).boundingBox();
    const tabletSecond = await tabletChains.nth(1).boundingBox();
    expect(tabletFirst).toBeTruthy();
    expect(tabletSecond).toBeTruthy();
    expect(tabletSecond!.y).toBeGreaterThan(tabletFirst!.y + tabletFirst!.height / 2);
    expect(tabletFirst!.width).toBeGreaterThan(500);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/institutions");
    const institutionCards = page.locator("main [data-slot=card]");
    await expect(institutionCards.first()).toBeVisible();
    const instFirst = await institutionCards.nth(0).boundingBox();
    const instSecond = await institutionCards.nth(1).boundingBox();
    expect(instSecond!.y).toBeGreaterThan(instFirst!.y + instFirst!.height / 2);
    expect(instFirst!.width).toBeGreaterThan(280);

    await page.goto("/treaties");
    const treatyCards = page.locator("main [data-slot=card]");
    await expect(treatyCards.first()).toBeVisible();
    const treatyFirst = await treatyCards.nth(0).boundingBox();
    const treatySecond = await treatyCards.nth(1).boundingBox();
    expect(treatySecond!.y).toBeGreaterThan(treatyFirst!.y + treatyFirst!.height / 2);

    await page.goto("/players");
    const playerCards = page.locator("main ul li");
    await expect(playerCards.first()).toBeVisible();
    const playerFirst = await playerCards.nth(0).boundingBox();
    const playerSecond = await playerCards.nth(1).boundingBox();
    expect(playerSecond!.y).toBeGreaterThan(playerFirst!.y + playerFirst!.height / 2);

    await page.goto("/standing");
    const municipality = page.locator("#standing-municipality");
    const program = page.locator("#standing-program");
    await expect(municipality).toBeVisible();
    const municipalityBox = await municipality.boundingBox();
    const programBox = await program.boundingBox();
    expect(programBox!.y).toBeGreaterThan(municipalityBox!.y + municipalityBox!.height / 2);
    expect(municipalityBox!.width).toBeGreaterThan(280);
  });

  test("fiscal phases, overview nav, methodology grids, and printed headings stack before lg", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");

    await page.goto("/money");
    const phases = page.locator(".fiscal-phases [data-slot=card]");
    await expect(phases).toHaveCount(3);
    const phaseFirst = await phases.nth(0).boundingBox();
    const phaseSecond = await phases.nth(1).boundingBox();
    expect(phaseSecond!.y).toBeGreaterThan(phaseFirst!.y + phaseFirst!.height / 2);
    expect(phaseFirst!.width).toBeGreaterThan(280);

    await page.setViewportSize({ width: 800, height: 844 });
    await page.goto("/money");
    const tabletPhases = page.locator(".fiscal-phases [data-slot=card]");
    const tabletPhaseFirst = await tabletPhases.nth(0).boundingBox();
    const tabletPhaseSecond = await tabletPhases.nth(1).boundingBox();
    expect(tabletPhaseSecond!.y).toBeGreaterThan(
      tabletPhaseFirst!.y + tabletPhaseFirst!.height / 2,
    );
    expect(tabletPhaseFirst!.width).toBeGreaterThan(500);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/overview");
    const sections = page.locator(".overview-sections a");
    await expect(sections).toHaveCount(7);
    const sectionFirst = await sections.nth(0).boundingBox();
    const sectionSecond = await sections.nth(1).boundingBox();
    expect(sectionSecond!.y).toBeGreaterThan(sectionFirst!.y + sectionFirst!.height / 2);
    expect(sectionFirst!.width).toBeGreaterThan(280);

    await page.setViewportSize({ width: 800, height: 844 });
    await page.goto("/overview");
    const tabletSections = page.locator(".overview-sections a");
    const tabletSectionFirst = await tabletSections.nth(0).boundingBox();
    const tabletSectionSecond = await tabletSections.nth(1).boundingBox();
    expect(tabletSectionSecond!.y).toBeGreaterThan(
      tabletSectionFirst!.y + tabletSectionFirst!.height / 2,
    );
    expect(tabletSectionFirst!.width).toBeGreaterThan(500);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/methodology");
    const toc = page.locator(".methodology-toc a");
    await expect(toc.first()).toBeVisible();
    const tocFirst = await toc.nth(0).boundingBox();
    const tocSecond = await toc.nth(1).boundingBox();
    expect(tocSecond!.y).toBeGreaterThan(tocFirst!.y + tocFirst!.height / 2);
    expect(tocFirst!.width).toBeGreaterThan(200);

    await page.locator("#money").scrollIntoViewIfNeeded();
    const moneyCards = page.locator(".methodology-money article");
    await expect(moneyCards).toHaveCount(3);
    const moneyFirst = await moneyCards.nth(0).boundingBox();
    const moneySecond = await moneyCards.nth(1).boundingBox();
    expect(moneySecond!.y).toBeGreaterThan(moneyFirst!.y + moneyFirst!.height / 2);
    expect(moneyFirst!.width).toBeGreaterThan(280);

    await page.setViewportSize({ width: 800, height: 844 });
    await page.goto("/methodology");
    const tabletToc = page.locator(".methodology-toc a");
    const tabletTocFirst = await tabletToc.nth(0).boundingBox();
    const tabletTocSecond = await tabletToc.nth(1).boundingBox();
    expect(tabletTocSecond!.y).toBeGreaterThan(tabletTocFirst!.y + tabletTocFirst!.height / 2);

    await page.locator("#money").scrollIntoViewIfNeeded();
    const tabletMoney = page.locator(".methodology-money article");
    const tabletMoneyFirst = await tabletMoney.nth(0).boundingBox();
    const tabletMoneySecond = await tabletMoney.nth(1).boundingBox();
    expect(tabletMoneySecond!.y).toBeGreaterThan(
      tabletMoneyFirst!.y + tabletMoneyFirst!.height / 2,
    );
    expect(tabletMoneyFirst!.width).toBeGreaterThan(500);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/money#printed-headings");
    await page.getByRole("tab", { name: "Invoice coverage" }).click();
    const heading = page
      .locator("#printed-headings .pocket-ledger-row td[data-label='Printed heading']")
      .first();
    const sits = page
      .locator("#printed-headings .pocket-ledger-row td[data-label='Sits on']")
      .first();
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
    await expect(sits).toBeVisible();
    const headingBox = await heading.boundingBox();
    const sitsBox = await sits.boundingBox();
    expect(sitsBox!.y).toBeGreaterThan(headingBox!.y + headingBox!.height / 2);
    expect(headingBox!.width).toBeGreaterThan(280);
  });

  test("event type index and connection strips stop sideways scrolling", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");

    await page.goto("/events");
    const types = page.locator(".type-rail .type-chip");
    await expect(types.first()).toBeVisible();
    const first = await types.nth(0).boundingBox();
    const second = await types.nth(1).boundingBox();
    expect(second!.y).toBeGreaterThan(first!.y + first!.height / 2);
    expect(first!.width).toBeGreaterThan(280);

    await page.goto("/overview");
    await expect(page.locator(".strip-drawing")).toBeHidden();
    const stripRow = page.locator("#budget-strip ol li").first();
    await expect(stripRow).toBeVisible();
    const from = stripRow.locator("a").first();
    const to = stripRow.locator("a").nth(1);
    await expect(from).toBeVisible();
    const fromBox = await from.boundingBox();
    const toBox = await to.boundingBox();
    expect(toBox!.y).toBeGreaterThan(fromBox!.y + fromBox!.height / 2);

    await page.goto("/public-entities");
    await page.getByRole("tab", { name: "Govdirectory checklist" }).click();
    const summaries = page.locator(".govdirectory-summary [data-slot=card]");
    await expect(summaries).toHaveCount(3);
    const summaryFirst = await summaries.nth(0).boundingBox();
    const summarySecond = await summaries.nth(1).boundingBox();
    expect(summarySecond!.y).toBeGreaterThan(summaryFirst!.y + summaryFirst!.height / 2);
    expect(summaryFirst!.width).toBeGreaterThan(280);
  });

  test("connections tenure chips stack and the end field stays unlabeled current", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");
    await page.goto("/connections");
    const chips = page.locator(".as-of-rail .as-of-chip");
    await expect(chips).toHaveCount(2);
    const first = await chips.nth(0).boundingBox();
    const second = await chips.nth(1).boundingBox();
    expect(second!.y).toBeGreaterThan(first!.y + first!.height / 2);

    await chips.nth(0).click();
    await expect(page).toHaveURL(/tenure=current/);
    await page.locator("#careers").getByRole("link", { name: "Open this connection" }).first().click();
    const record = page.locator(".folio-gutter > div");
    await expect(record.first()).toBeVisible();
    const asOf = record.filter({ has: page.getByText("As of", { exact: true }) });
    const end = record.filter({ has: page.getByText("End", { exact: true }) });
    await expect(end.getByText("no end date stored")).toBeVisible();
    const asOfBox = await asOf.first().boundingBox();
    const endBox = await end.first().boundingBox();
    expect(endBox!.y).toBeGreaterThan(asOfBox!.y + asOfBox!.height / 2);

    await page.goto("/connections#unprinted-ends");
    const leftover = page.locator("#unprinted-ends");
    await expect(
      leftover.getByRole("heading", { name: "No end date stored" }),
    ).toBeVisible();
    const from = leftover
      .locator(".pocket-ledger-row td[data-label='From']")
      .first();
    const endCell = leftover
      .locator(".pocket-ledger-row td[data-label='End']")
      .first();
    await expect(from).toBeVisible();
    const leftoverFrom = await from.boundingBox();
    const leftoverEnd = await endCell.boundingBox();
    expect(leftoverFrom).toBeTruthy();
    expect(leftoverEnd).toBeTruthy();
    expect(leftoverEnd!.y).toBeGreaterThan(leftoverFrom!.y + leftoverFrom!.height / 2);
    expect(leftoverFrom!.width).toBeGreaterThan(280);
    await expect(endCell.getByText("no end date stored")).toBeVisible();
    await expect(leftover.getByText("current", { exact: true })).toHaveCount(0);
  });


  test("command palette docks as a sheet and intake and compare stack", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");
    await page.goto("/");
    await page.getByRole("button", { name: "Search the records" }).click();
    const dialog = page.getByRole("dialog", { name: "Search the records" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Search the records" })).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeGreaterThan(200);
    expect(box!.width).toBeGreaterThan(300);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);

    await page.goto("/intake");
    await expect(page.getByRole("heading", { name: "Paste a sourced line" })).toBeVisible();
    const from = await page.locator("#intake-from").boundingBox();
    const to = await page.locator("#intake-to").boundingBox();
    expect(to!.y).toBeGreaterThan(from!.y + from!.height / 2);

    await page.goto("/compare");
    await expect(page.getByRole("heading", { name: "Compare" })).toBeVisible();
    const columns = page.locator("[data-compare-column]");
    await expect(columns).toHaveCount(2);
    await expect(columns.nth(0)).toBeVisible();
    await expect(columns.nth(1)).toBeVisible();
    const left = await columns.nth(0).boundingBox();
    const right = await columns.nth(1).boundingBox();
    expect(right!.y).toBeGreaterThan(left!.y + left!.height / 2);
  });

  test("night leader drops from the pin toward the sheet when anchors work", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Pocket grammar is below lg");
    await page.goto("/map?focus=althingi");
    const leader = page.locator(".geo-leader");
    await expect(leader).toHaveCount(1);
    const geometry = await leader.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        display: style.display,
        width: style.width,
        height: style.height,
        borderLeftWidth: style.borderLeftWidth,
        borderTopWidth: style.borderTopWidth,
      };
    });
    if (geometry.display === "none") return;
    const width = Number.parseFloat(geometry.width);
    if (Number.isNaN(width)) return;
    expect(width).toBeLessThan(2);
    expect(Number.parseFloat(geometry.borderTopWidth)).toBe(0);
    expect(Number.parseFloat(geometry.borderLeftWidth)).toBeGreaterThan(0);
  });

  test("desktop atlas keeps the side caption and chips", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Desktop atlas stays as-is");
    await page.goto("/map?focus=althingi");
    await expect(page.getByRole("group", { name: "This plate" })).toBeHidden();
    await expect(page.locator(".geo-chips")).toBeVisible();
    await expect(page.locator(".geo-rail")).toBeVisible();
    const stage = await page.locator(".geo-stage").boundingBox();
    const caption = await page.getByRole("region", { name: "Plate caption" }).boundingBox();
    expect(stage).toBeTruthy();
    expect(caption).toBeTruthy();
    expect(caption!.x).toBeGreaterThan(stage!.x + stage!.width * 0.4);
  });

  test("desktop atlas keeps strip drawings and two-up landing chains", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Desktop atlas stays as-is");
    await page.goto("/overview");
    const drawing = page.locator(".strip-drawing");
    await expect(drawing).toBeVisible();
    const drawingBox = await drawing.boundingBox();
    expect(drawingBox).toBeTruthy();
    expect(drawingBox!.width).toBeGreaterThan(700);

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /chains to start from/ }),
    ).toBeVisible();
    const chains = page.locator(".landing-chains article");
    await expect(chains).toHaveCount(6);
    await chains.nth(0).scrollIntoViewIfNeeded();
    await expect(chains.nth(0)).toBeVisible();
    await expect(chains.nth(1)).toBeVisible();
    const first = await chains.nth(0).boundingBox();
    const second = await chains.nth(1).boundingBox();
    expect(first).toBeTruthy();
    expect(second).toBeTruthy();
    expect(second!.x).toBeGreaterThan(first!.x + first!.width / 2);
  });
});

test.describe("visual baselines", () => {
  test("home and money — desktop 1440", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Desktop baselines only");
    for (const route of ["/", "/money"]) {
      await page.goto(route);
      const slug = route === "/" ? "home" : "money";
      await expect(page).toHaveScreenshot(`${slug}-1440.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.03,
        timeout: 15_000,
      });
    }
  });

  test("home and money — mobile 390", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Mobile baselines only");
    for (const route of ["/", "/money"]) {
      await page.goto(route);
      const slug = route === "/" ? "home" : "money";
      await expect(page).toHaveScreenshot(`${slug}-390.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.03,
      });
    }
  });
});
