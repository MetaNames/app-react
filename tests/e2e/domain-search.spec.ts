import { test, expect } from "@playwright/test";
import { type Page } from "@playwright/test";
import { LONG_API_TIMEOUT_MS, PLACEHOLDERS } from "./constants";
import {
  generateTestDomain,
  typeSearch,
  waitForSearchSettled,
} from "./fixtures/shared";

const getSearchInput = (page: Page) =>
  page.getByPlaceholder(PLACEHOLDERS.SEARCH_DOMAIN);

test.describe("Domain Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display search input and placeholder", async ({ page }) => {
    const input = getSearchInput(page);
    await expect(input).toBeVisible();
  });

  test("should show validation error for invalid characters", async ({
    page,
  }) => {
    await typeSearch(page, "test!@#");

    const errorMsg = page.locator("p.text-destructive");
    await expect(errorMsg).toContainText(
      "Only lowercase letters, numbers, and hyphens allowed",
    );
  });

  test("should show validation error for leading hyphen", async ({ page }) => {
    await typeSearch(page, "-test");

    const errorMsg = page.locator("p.text-destructive");
    await expect(errorMsg).toContainText("Cannot start or end with a hyphen");
  });

  test("should show validation error for trailing hyphen", async ({ page }) => {
    await typeSearch(page, "test-");

    const errorMsg = page.locator("p.text-destructive");
    await expect(errorMsg).toContainText("Cannot start or end with a hyphen");
  });

  test("should allow searching for 1-letter domain", async ({ page }) => {
    await typeSearch(page, "a");
    await waitForSearchSettled(page);

    // A single character is a legal name: the lookup must resolve to a verdict
    // rather than a validation error.
    await expect(page.getByText(/^(Available|Registered)$/)).toBeVisible({
      timeout: LONG_API_TIMEOUT_MS,
    });
  });

  test("should report progress while checking availability", async ({
    page,
  }) => {
    await typeSearch(page, "loadingtest" + Date.now());

    // Asserting the spinner is *visible* races the lookup: a fast testnet read
    // resolves before the assertion runs and the test fails on healthy
    // behaviour. The durable contract is that the live region announces a
    // busy state and then a settled one.
    const status = page.getByRole("status");
    await expect(status).toContainText(
      /Checking availability|Register this name|View this domain/,
      { timeout: LONG_API_TIMEOUT_MS },
    );
    await waitForSearchSettled(page);
    await expect(
      page.getByRole("button", { name: "Search", exact: true }),
    ).toHaveAttribute("aria-busy", "false");
  });

  test("should show available badge for new domain", async ({ page }) => {
    const testDomain = generateTestDomain("zzztest");
    await typeSearch(page, testDomain);
    await waitForSearchSettled(page);

    const availableBadge = page.getByText("Available");
    await expect(availableBadge).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });
  });

  test("should show registered badge for existing domain", async ({ page }) => {
    await typeSearch(page, "test");
    await waitForSearchSettled(page);

    const registeredBadge = page.getByText("Registered");
    await expect(registeredBadge).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });
  });

  test("should navigate to register page for available domain", async ({
    page,
  }) => {
    const testDomain = generateTestDomain("avail");
    await typeSearch(page, testDomain);
    await waitForSearchSettled(page);

    // Scoped to the search result's live region: the home page also lists
    // recent domains, so an unscoped href match resolves to every card on the
    // page and fails strict mode.
    const card = page
      .locator('div[role="status"] a[href^="/register/"]')
      .first();
    await expect(card).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });
  });

  test("should navigate to domain page for registered domain", async ({
    page,
  }) => {
    await typeSearch(page, "test");
    await waitForSearchSettled(page);

    // Scoped to the search result's live region: the home page also lists
    // recent domains, so an unscoped href match resolves to every card on the
    // page and fails strict mode.
    const card = page.locator('div[role="status"] a[href^="/domain/"]').first();
    await expect(card).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });
  });

  test("should clear results when input is cleared", async ({ page }) => {
    const input = getSearchInput(page);
    await typeSearch(page, "test");
    await waitForSearchSettled(page);

    await expect(page.getByText("Registered")).toBeVisible({
      timeout: LONG_API_TIMEOUT_MS,
    });

    await input.clear();
    await expect(page.getByText("Registered")).not.toBeVisible();
  });

  test("should trigger search immediately on Enter key", async ({ page }) => {
    const input = getSearchInput(page);
    await typeSearch(page, "enterkeytest" + Date.now());
    await input.press("Enter");

    await expect(page.getByText(/^(Available|Registered)$/)).toBeVisible({
      timeout: LONG_API_TIMEOUT_MS,
    });
  });

  test("should show available badge after Enter key search", async ({
    page,
  }) => {
    const input = getSearchInput(page);
    const testDomain = generateTestDomain("zzzenter");
    await typeSearch(page, testDomain);
    await input.press("Enter");

    const availableBadge = page.getByText("Available");
    await expect(availableBadge).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });
  });

  test("should navigate to register page when pressing Enter on available domain", async ({
    page,
  }) => {
    const input = getSearchInput(page);
    const testDomain = generateTestDomain("zzznavig");
    await typeSearch(page, testDomain);
    await waitForSearchSettled(page);

    const availableBadge = page.getByText("Available");
    await expect(availableBadge).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });

    await input.press("Enter");
    await expect(page).toHaveURL(/\/register\//);
  });
  test("should offer the last searched name once the box is empty", async ({
    page,
  }) => {
    const input = getSearchInput(page);
    await typeSearch(page, "test");
    await waitForSearchSettled(page);
    await expect(page.getByText("Registered")).toBeVisible({
      timeout: LONG_API_TIMEOUT_MS,
    });

    await input.clear();

    const recent = page.getByTestId("recent-searches");
    await expect(recent).toContainText("test.mpc");

    // Clicking a remembered name puts it back in the box, ready to search.
    await recent.getByRole("button", { name: "test.mpc" }).click();
    await expect(input).toHaveValue("test");

    await input.clear();
    await page.getByTestId("clear-recent-searches").click();
    await expect(recent).toBeHidden();
  });

  test("should keep recent searches across a reload", async ({ page }) => {
    const input = getSearchInput(page);
    await typeSearch(page, "test");
    await waitForSearchSettled(page);
    await expect(page.getByText("Registered")).toBeVisible({
      timeout: LONG_API_TIMEOUT_MS,
    });

    await page.reload();

    await expect(page.getByTestId("recent-searches")).toContainText("test.mpc");
    await expect(input).toHaveValue("");
  });
});
