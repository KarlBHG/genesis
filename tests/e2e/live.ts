import { expect, type Locator, type Page } from "@playwright/test";

/** ⌘K is live once the palette's keydown listener is attached. */
export async function waitForSearchLive(page: Page) {
  const search = page.getByRole("button", { name: "Search the records" });
  await expect(search).toBeVisible();
  await expect(search).toHaveAttribute("data-search-live", "");
  return search;
}

export async function waitForTenureLive(page: Page) {
  const tenure = page.getByRole("region", {
    name: "Filter current or ended connections",
  });
  await expect(tenure).toBeVisible();
  await expect(tenure).toHaveAttribute("data-tenure-live", "");
  return tenure;
}

export function tenureChip(tenure: Locator, which: "current" | "ended") {
  return tenure.getByRole("button", {
    name: which === "current" ? /^current membership —/ : /^ended —/,
  });
}

export async function waitForSelectedTab(page: Page, name: string | RegExp) {
  const tab = page.getByRole("tab", { name });
  await expect(tab).toBeVisible();
  await expect(tab).toHaveAttribute("aria-selected", "true");
  return tab;
}

export async function clickLive(locator: Locator) {
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  await locator.click();
}

export async function emulatePrint(page: Page) {
  await page.emulateMedia({ media: "print" });
  await page.waitForFunction(() => window.matchMedia("print").matches);
}

export async function expectFacing(
  left: Locator,
  right: Locator,
  extras?: { ySlop?: number; widthSlop?: number },
) {
  await expect(left).toBeVisible();
  await expect(right).toBeVisible();
  await expect
    .poll(async () => {
      const a = await left.boundingBox();
      const b = await right.boundingBox();
      if (!a || !b) return false;
      if (b.x <= a.x + a.width - 8) return false;
      if (extras?.ySlop != null && Math.abs(a.y - b.y) >= extras.ySlop) {
        return false;
      }
      if (
        extras?.widthSlop != null &&
        Math.abs(a.width - b.width) >= extras.widthSlop
      ) {
        return false;
      }
      return true;
    })
    .toBe(true);
}

export async function expectStacked(
  first: Locator,
  second: Locator,
  extras?: { minWidth?: number },
) {
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();
  await expect
    .poll(async () => {
      const a = await first.boundingBox();
      const b = await second.boundingBox();
      if (!a || !b) return false;
      if (b.y <= a.y + a.height / 2) return false;
      if (extras?.minWidth != null && a.width <= extras.minWidth) return false;
      return true;
    })
    .toBe(true);
}
