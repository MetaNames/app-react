import { test } from "@playwright/test";

import { ROUTES } from "./routes";

/**
 * Compile every route once, alone, before the suite fans out.
 *
 * `next dev` compiles a route the first time it is requested. With a worker per
 * core, a dozen first requests arrive at once and the server compiles them all
 * together: markup is served while hydration is still tens of seconds away, and
 * a control that is on screen but unhydrated ignores every click and key press.
 * That looked like flaky tests — it is the dev server being asked to build the
 * app during the run. Walking the routes serially here pays the compile cost
 * once, so the tests themselves meet a warm server.
 */
test("warm up every route", async ({ page }) => {
  test.setTimeout(300_000);

  for (const route of ROUTES) {
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    // The wallet trigger hydrating is the signal that this route's client
    // bundle is compiled and running, which is what the suite actually needs.
    await page
      .locator('[data-testid="wallet-connect-button"]')
      .first()
      .waitFor({ state: "visible", timeout: 60_000 })
      .catch(() => {});
  }
});
