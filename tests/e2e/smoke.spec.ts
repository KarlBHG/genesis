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
  await expect(page.getByRole("link", { name: "Íslandsbanki" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Lífeyrissjóður starfsmanna ríkisins (LSR)" }),
  ).toBeVisible();
  const caption = page.locator("#ownership [data-slot=table-caption]");
  await expect(caption).toContainText("Counts are rows, not share totals.");
  await expect(caption).toContainText("5 have none");

  const landsvirkjun = page.locator("tr", {
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
  await expect(page.getByText("vacant")).toHaveCount(0);
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

test("print plate is a citable folio", async ({ page }) => {
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
