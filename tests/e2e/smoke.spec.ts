import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/map",
  "/money",
  "/anomalies",
  "/methodology",
  "/connections",
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
    await expect(page.locator("main, [role='main'], body")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });
}

test.describe("visual baselines", () => {
  test("home and money at 390 and 1440", async ({ page }, testInfo) => {
    for (const route of ["/", "/money"]) {
      await page.goto(route);
      const slug = route === "/" ? "home" : "money";
      await expect(page).toHaveScreenshot(`${slug}-${testInfo.project.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.03,
      });
    }
  });
});
