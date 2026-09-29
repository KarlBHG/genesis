import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/map",
  "/money",
  "/anomalies",
  "/methodology",
  "/intake",
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
  await expect(page.getByRole("alert")).toContainText(
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
