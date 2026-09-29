import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
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

test("command palette opens with Ctrl+K", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("dialog", { name: "Search the records" })).toHaveCount(0);
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Search the records" })).toBeVisible();
  await expect(page.locator('input[aria-label="Search the records"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Search the records" })).toHaveCount(0);
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
