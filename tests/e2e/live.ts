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

/**
 * Tenure chips are Next.js Links with `role="button"`. Playwright's locator
 * click often does not navigate them under a shared webServer and parallel
 * workers; a native `<a>.click()` does.
 */
export async function clickTenureChip(chip: Locator) {
  await expect(chip).toBeVisible();
  await expect(chip).toHaveAttribute("href", /tenure=/);
  await chip.evaluate((node) => {
    if (node instanceof HTMLAnchorElement) node.click();
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

/** Hash target heading sits below the sticky masthead and inside the viewport. */
export async function headingClearsMasthead(page: Page, id: string) {
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
          const box = heading.getBoundingClientRect();
          const bottom = header.getBoundingClientRect().bottom;
          const inView = box.top < window.innerHeight && box.bottom > 0;
          return {
            ok: box.height >= 1 && box.top >= bottom - 1 && inView,
            top: Math.round(box.top),
            headerBottom: Math.round(bottom),
            inView,
          };
        }, id);
      },
      { timeout: 12_000 },
    )
    .toMatchObject({ ok: true });
}
