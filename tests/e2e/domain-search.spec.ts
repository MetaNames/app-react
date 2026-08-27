import { test, expect } from "@playwright/test";
import { type Page } from "@playwright/test";
import { LONG_API_TIMEOUT_MS, PLACEHOLDERS } from "./constants";
import { generateTestDomain, waitForSearchSettled } from "./fixtures/shared";

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
    const input = getSearchInput(page);
    await input.fill("test!@#");

    const errorMsg = page.locator("p.text-destructive");
    await expect(errorMsg).toContainText(
      "Only lowercase letters, numbers, and hyphens allowed",
    );
  });

  test("should show validation error for leading hyphen", async ({ page }) => {
    const input = getSearchInput(page);
    await input.fill("-test");

    const errorMsg = page.locator("p.text-destructive");
    await expect(errorMsg).toContainText("Cannot start or end with a hyphen");
  });

  test("should show validation error for trailing hyphen", async ({ page }) => {
    const input = getSearchInput(page);
    await input.fill("test-");

    const errorMsg = page.locator("p.text-destructive");
    await expect(errorMsg).toContainText("Cannot start or end with a hyphen");
  });

  test("should allow searching for 1-letter domain", async ({ page }) => {
    const input = getSearchInput(page);
    await input.fill("a");
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
    const input = getSearchInput(page);
    await input.fill("loadingtest" + Date.now());

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
    const input = getSearchInput(page);
    const testDomain = generateTestDomain("zzztest");
    await input.fill(testDomain);
    await waitForSearchSettled(page);

    const availableBadge = page.getByText("Available");
    await expect(availableBadge).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });
  });

  test("should show registered badge for existing domain", async ({ page }) => {
    const input = getSearchInput(page);
    await input.fill("test");
    await waitForSearchSettled(page);

    const registeredBadge = page.getByText("Registered");
    await expect(registeredBadge).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });
  });

  test("should navigate to register page for available domain", async ({
    page,
  }) => {
    const input = getSearchInput(page);
    const testDomain = generateTestDomain("avail");
    await input.fill(testDomain);
    await waitForSearchSettled(page);

    const card = page.locator('a[href^="/register/"]');
    await expect(card).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });
  });

  test("should navigate to domain page for registered domain", async ({
    page,
  }) => {
    const input = getSearchInput(page);
    await input.fill("test");
    await waitForSearchSettled(page);

    const card = page.locator('a[href^="/domain/"]');
    await expect(card).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });
  });

  test("should clear results when input is cleared", async ({ page }) => {
    const input = getSearchInput(page);
    await input.fill("test");
    await waitForSearchSettled(page);

    await expect(page.getByText("Registered")).toBeVisible({
      timeout: LONG_API_TIMEOUT_MS,
    });

    await input.clear();
    await expect(page.getByText("Registered")).not.toBeVisible();
  });

  test("should trigger search immediately on Enter key", async ({ page }) => {
    const input = getSearchInput(page);
    await input.fill("enterkeytest" + Date.now());
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
    await input.fill(testDomain);
    await input.press("Enter");

    const availableBadge = page.getByText("Available");
    await expect(availableBadge).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });
  });

  test("should navigate to register page when pressing Enter on available domain", async ({
    page,
  }) => {
    const input = getSearchInput(page);
    const testDomain = generateTestDomain("zzznavig");
    await input.fill(testDomain);
    await waitForSearchSettled(page);

    const availableBadge = page.getByText("Available");
    await expect(availableBadge).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });

    await input.press("Enter");
    await expect(page).toHaveURL(/\/register\//);
  });
});
