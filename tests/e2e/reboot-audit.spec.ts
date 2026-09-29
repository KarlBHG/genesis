import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { waitForSelectedTab } from "./live";

async function headingClearsMasthead(page: import("@playwright/test").Page, id: string) {
  await expect
    .poll(
      async () => {
        return page.evaluate((targetId) => {
          const header = document.querySelector(".site-masthead");
          const el = document.getElementById(targetId);
          if (!header || !el) return { ok: false, reason: "missing" };
          const heading = el.querySelector("h1,h2,h3") ?? el;
          const style = getComputedStyle(el);
          if (style.display === "none") return { ok: false, reason: "hidden" };
          const top = heading.getBoundingClientRect().top;
          const bottom = header.getBoundingClientRect().bottom;
          return {
            ok: top >= bottom - 1,
            top: Math.round(top),
            headerBottom: Math.round(bottom),
          };
        }, id);
      },
      { timeout: 12_000 },
    )
    .toMatchObject({ ok: true });
}

test("unprinted career ends heading clears the masthead", async ({ page }) => {
  await page.goto("/connections#unprinted-ends");
  await expect(
    page.locator("#unprinted-ends").getByRole("heading", { name: "No end date stored" }),
  ).toBeVisible();
  await headingClearsMasthead(page, "unprinted-ends");
});

test("parent-ministry tab keeps a valid panel id", async ({ page }) => {
  await page.goto("/public-entities#parent-ministry");
  await expect(page.locator("[data-tabs-live]")).toHaveCount(1);
  await waitForSelectedTab(page, "Parent ministry");
  await expect(page.getByRole("heading", { name: "Parent ministry" })).toBeVisible();
  await headingClearsMasthead(page, "parent-ministry");

  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
});
