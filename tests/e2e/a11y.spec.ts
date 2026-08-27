import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { ROUTES, gotoLoaded } from "./routes";

// This package is CommonJS (no "type": "module" in package.json) and Playwright compiles test
// files accordingly, so `import.meta.url` — which the legacy Vite/ESM suite used with
// `createRequire` to locate the axe-core bundle — isn't available here. `axe-core` is a
// devDependency (added for this suite) and always resolves under the repo root's node_modules,
// so a plain path join is the equivalent, CJS-safe way to read the same file.
const AXE = readFileSync(
  path.join(process.cwd(), "node_modules/axe-core/axe.min.js"),
  "utf8",
);

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

type Violation = { id: string; impact: string; nodes: { target: string[] }[] };

async function scan(page: Page): Promise<Violation[]> {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async (tags) => {
    // @ts-expect-error injected by addScriptTag
    const result = await window.axe.run(document, {
      runOnly: { type: "tag", values: tags },
      resultTypes: ["violations"],
    });
    return result.violations.map((v: Violation) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({ target: n.target })),
    }));
  }, TAGS);
}

// Both cases below judge whatever is on screen when they run, so what is on screen has to be the
// thing they name. `tests/e2e/routes.ts` carries the seven routes with a loaded-branch anchor and
// a fresh register name apiece — a fixed sleep or a false route would let a spinner (no
// violations to report, no h1 to count) pass one assertion and fail the other for a reason that
// has nothing to do with the page itself.
test.describe("WCAG 2.2 A + AA", () => {
  for (const route of ROUTES) {
    test(`${route.name} has no violations`, async ({ page }) => {
      await gotoLoaded(page, route);

      const violations = await scan(page);
      expect(
        violations,
        violations
          .map((v) => `${v.impact} ${v.id} x${v.nodes.length}`)
          .join("\n"),
      ).toEqual([]);
    });

    test(`${route.name} has exactly one level-one heading`, async ({
      page,
    }) => {
      await gotoLoaded(page, route);
      await expect(page.locator("h1")).toHaveCount(1);
    });
  }
});

test("the search result is inside a live region", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const input = page.locator(
    "input[placeholder='Search for a .mpc domain...']",
  );
  const status = page.locator('div[role="status"][aria-live="polite"]');

  // Typing before hydration fills the DOM node without React ever seeing an
  // onChange, so the lookup never fires and the region stays empty for the
  // whole timeout. Re-typing after hydration is what un-sticks it.
  for (let attempt = 0; attempt < 3; attempt++) {
    await input.fill("");
    await input.fill("test");
    try {
      await expect(status.locator("a")).toBeVisible({ timeout: 10000 });
      return;
    } catch {
      // Next attempt retypes.
    }
  }

  await expect(status.locator("a")).toBeVisible({ timeout: 10000 });
});

// The register route's loading spinner sits in a `role="status"` region that names what is being
// waited for, the same wrapper /domain and /tld give their own spinners (see
// app/register/[name]/RegisterPageClient.tsx). Asserted on the unsettled branch on purpose: this
// test judges the wait, not the form, so it must not wait for the form to finish loading.
test("the register page announces its loading state", async ({ page }) => {
  await page.goto(`/register/zzunregistered${Date.now()}`, {
    waitUntil: "domcontentloaded",
  });

  const spinner = page.locator(
    'div[role="status"][aria-label="Loading the registration form"]',
  );
  await expect(spinner).toBeVisible({ timeout: 15000 });
  await expect(spinner).toHaveAttribute("aria-label", /Loading/);
});

// Copy success is a status element inside the chip (components/chip.tsx), which needs
// grantClipboardPermissions + click to appear. Skipped when the browser context cannot be granted
// clipboard access rather than red for an environment reason.
//
// Every chip labelled "link" is given an `href` (components/domain-details.tsx), and chip.tsx
// renders any chip with an `href` as an `<a>`, not a `<button>` — clicking it would navigate, not
// copy. The "Expires" chip carries neither `href` nor `onClick`, so it is the one guaranteed to
// take chip.tsx's default copy-to-clipboard path on /domain/test.mpc.
test("a successful chip copy is announced", async ({ browser }) => {
  const ctx = await browser.newContext();
  let granted = true;
  try {
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: process.env.E2E_ORIGIN || "http://localhost:3000",
    });
  } catch {
    granted = false;
  }
  test.skip(!granted, "clipboard permissions unsupported in this environment");

  const page = await ctx.newPage();
  await page.goto("/domain/test.mpc", { waitUntil: "domcontentloaded" });

  const chip = page.locator("button", { hasText: "Expires" }).first();
  await expect(chip).toBeVisible({ timeout: 15000 });

  // A click that lands before the chip's handler is attached copies nothing and
  // announces nothing, and the status node only exists once a copy succeeds —
  // so the assertion had no element to wait on. Clicking again after hydration
  // is harmless: the copy is idempotent.
  const announcement = chip.locator('[role="status"]');
  for (let attempt = 0; attempt < 3; attempt++) {
    await chip.click();
    try {
      await expect(announcement).toHaveText("Copied to the clipboard", {
        timeout: 5000,
      });
      break;
    } catch {
      if (attempt === 2) {
        await expect(announcement).toHaveText("Copied to the clipboard", {
          timeout: 5000,
        });
      }
    }
  }
  await ctx.close();
});

/**
 * The focus ring as a sighted keyboard user meets it: how thick, and how far it stands off the
 * thing behind it. Ported from the legacy suite's `ringOn`/`expectRing` — same luminance/contrast
 * math — but plumbed through a Playwright `Locator` rather than a raw CSS selector string, because
 * the new app's chip selector needs `hasText`, which `document.querySelector` cannot express.
 */
async function ringOn(locator: Locator) {
  return locator.evaluate((el: HTMLElement) => {
    el.focus();

    const channels = (colour: string) =>
      (colour.match(/[\d.]+/g) ?? []).map(Number);
    const luminance = (colour: string) => {
      const [r, g, b] = channels(colour)
        .slice(0, 3)
        .map((v) => v / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    let backdrop = "rgb(0, 0, 0)";
    for (let node = el.parentElement; node; node = node.parentElement) {
      const bg = getComputedStyle(node).backgroundColor;
      const alpha = channels(bg)[3];
      if (alpha === undefined || alpha > 0.5) {
        backdrop = bg;
        break;
      }
    }

    const style = getComputedStyle(el);
    const [lighter, darker] = [
      luminance(style.outlineColor),
      luminance(backdrop),
    ].sort((a, b) => b - a);
    return {
      focusVisible: el.matches(":focus-visible"),
      style: style.outlineStyle,
      width: parseFloat(style.outlineWidth),
      backdrop,
      ratio: (lighter + 0.05) / (darker + 0.05),
    };
  });
}

/** The four things a ring has to be: on, drawn, thick enough, and 3:1 against what is behind it. */
async function expectRing(locator: Locator, label: string) {
  const ring = await ringOn(locator);
  expect(ring.focusVisible, label).toBe(true);
  expect(ring.style, label).not.toBe("none");
  expect(ring.width, label).toBeGreaterThanOrEqual(2);
  expect(ring.ratio, `${label} on ${ring.backdrop}`).toBeGreaterThanOrEqual(3);
}

/** The dropdown-menu-item family base-ui/shadcn resets, reachable from every route's header. */
const MENU_ITEM = '[data-slot="dropdown-menu-item"]';

/**
 * Open the header wallet menu from the keyboard, retrying while the menu hydrates.
 *
 * Keyboard rather than `click()` on purpose: Chromium only honours `:focus-visible` for a
 * programmatic `focus()` while the last input was a key press, so clicking here would make every
 * ring assertion below fail for a reason that has nothing to do with the CSS under test.
 */
async function openWalletMenuFromKeyboard(page: Page) {
  const trigger = page.locator('[data-testid="wallet-connect-button"]');
  const item = page.locator(MENU_ITEM).first();

  for (let attempt = 1; attempt <= 5; attempt++) {
    await trigger.focus();
    await page.keyboard.press("Enter");
    try {
      await expect(item).toBeVisible({ timeout: 3000 });
      return;
    } catch {
      await page.keyboard.press("Escape").catch(() => {});
    }
  }

  // Surface the real diagnostic rather than the last swallowed per-attempt timeout.
  await expect(item).toBeVisible({ timeout: 3000 });
}

// 320 CSS px is what a 1280 px desktop looks like at the 400% zoom SC 1.4.10 names — the proxy the
// legacy suite used for its zoomed pass. The unzoomed (1280px) pass and the MDC-specific
// snackbar-ring case are dropped per the port brief; this keeps only the zoomed pass, on the new
// app's selectors.
test("every focusable control gets a visible, contrasting outline at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/domain/test.mpc", { waitUntil: "domcontentloaded" });

  const chip = page.locator("button", { hasText: "Expires" }).first();
  await expect(chip).toBeVisible({ timeout: 15000 });

  await expectRing(page.locator("header a").first(), "header a");
  await expectRing(
    page.locator('[data-testid="wallet-connect-button"]'),
    "wallet-connect-button",
  );
  await expectRing(chip, "chip button");

  await openWalletMenuFromKeyboard(page);
  await expectRing(page.locator(MENU_ITEM).first(), MENU_ITEM);
});

test("reduced motion is honoured without hiding what was animating", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const walletButton = page.locator('[data-testid="wallet-connect-button"]');
  const duration = await walletButton.evaluate(
    (n) => getComputedStyle(n).transitionDuration,
  );
  expect(parseFloat(duration)).toBeLessThan(0.05);

  // Collapsing every duration to ~0 is only safe if the end state is the visible one: the wallet
  // dropdown still has to open with reduced motion honoured, not suppressed content.
  // Same hydration race the ring test hit: a keypress that lands before the
  // trigger is wired does nothing, so retry through the shared helper rather
  // than assert on a single press.
  await openWalletMenuFromKeyboard(page);

  await ctx.close();
});
