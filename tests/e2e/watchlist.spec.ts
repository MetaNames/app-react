import { test, expect } from "@playwright/test";

import { waitForHydratedTrigger } from "./helpers/wallet-helper";

/**
 * The watchlist needs no wallet: it is browser-local, which is exactly what
 * makes it worth an end-to-end test — the value only exists if it survives a
 * navigation and a reload.
 */
test.describe("Watchlist", () => {
  const DOMAIN = "test.mpc";

  test("watches a domain and shows it on the profile", async ({ page }) => {
    await page.goto(`/domain/${DOMAIN}`);

    const star = page.getByTestId("watch-button");
    // The star is server-rendered inert; clicking before React claims it does
    // nothing at all and the failure reads as "the click did not register".
    await waitForHydratedTrigger(star);
    await expect(star).toHaveAttribute("aria-pressed", "false");
    await star.click();
    await expect(star).toHaveAttribute("aria-pressed", "true");

    await page.goto("/profile");
    await expect(
      page.getByTestId("watchlist").getByRole("link", { name: DOMAIN }),
    ).toBeVisible();
  });

  test("keeps the list across a reload and drops it when removed", async ({
    page,
  }) => {
    await page.goto(`/domain/${DOMAIN}`);
    const star = page.getByTestId("watch-button");
    await waitForHydratedTrigger(star);
    await star.click();

    await page.reload();
    await waitForHydratedTrigger(page.getByTestId("watch-button"));
    await expect(page.getByTestId("watch-button")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.goto("/profile");
    await page.getByRole("button", { name: `Stop watching ${DOMAIN}` }).click();

    await expect(page.getByTestId("watchlist-empty")).toBeVisible();
  });

  test("tells a new visitor how to fill the empty list", async ({ page }) => {
    await page.goto("/profile");

    await expect(page.getByTestId("watchlist-empty")).toContainText(
      "press the star",
    );
  });

  test("shows an available name as registrable", async ({ page }) => {
    const free = `zzzwatch${Date.now()}.mpc`;
    // A name nobody has registered still has a domain page, and watching it is
    // the whole point of the feature: the list is where you learn it is free.
    await page.goto(`/register/${free}`);
    await page.evaluate((name) => {
      localStorage.setItem(
        "metanames:watchlist",
        JSON.stringify({ state: { names: [name] }, version: 0 }),
      );
    }, free);

    await page.goto("/profile");
    const row = page.getByTestId("watchlist").locator("li").first();
    await expect(row.getByText("Available")).toBeVisible();
    await expect(row.getByRole("link", { name: free })).toHaveAttribute(
      "href",
      `/register/${free}`,
    );
  });
});
