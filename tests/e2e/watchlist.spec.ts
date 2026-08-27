import { test, expect } from "@playwright/test";

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
    await page.getByTestId("watch-button").click();

    await page.reload();
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
});
