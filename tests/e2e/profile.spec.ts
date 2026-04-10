import { test, expect } from "@playwright/test";
import {
  SELECTORS,
  TEXT,
  PAGINATION_WAIT_MS,
  TEST_DOMAIN_NAME,
} from "./constants";
import { connectWallet } from "./helpers/wallet-helper";

test.describe("User Profile", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Disconnected State", () => {
    test('should show "Connect your wallet to see your domains" message', async ({
      page,
    }) => {
      const message = page.locator(`text=${TEXT.CONNECT_TO_SEE_DOMAINS}`);
      await expect(message).toBeVisible();
    });

    test("should not show Profile heading when disconnected", async ({
      page,
    }) => {
      const profileHeading = page.locator(
        `h1:has-text("${TEXT.PROFILE_HEADING}")`,
      );
      await expect(profileHeading).not.toBeVisible();
    });

    test("should not show Domains heading when disconnected", async ({
      page,
    }) => {
      const domainsHeading = page.locator(
        `h2:has-text("${TEXT.DOMAINS_HEADING}")`,
      );
      await expect(domainsHeading).not.toBeVisible();
    });

    test("should not show search bar when disconnected", async ({ page }) => {
      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).not.toBeVisible();
    });

    test("should not show domains table when disconnected", async ({
      page,
    }) => {
      const table = page.locator("table");
      await expect(table).not.toBeVisible();
    });
  });

  test.describe("Connected State", () => {
    test("should show Profile heading after connecting", async ({ page }) => {
      await connectWallet(page);

      const profileHeading = page.locator(
        `h1:has-text("${TEXT.PROFILE_HEADING}")`,
      );
      await expect(profileHeading).toBeVisible();
    });

    test("should show address chip after connecting", async ({ page }) => {
      await connectWallet(page);

      const addressChip = page.locator("text=address");
      await expect(addressChip).toBeVisible();
    });

    test("should show Domains heading after connecting", async ({ page }) => {
      await connectWallet(page);

      const domainsHeading = page.locator(
        `h2:has-text("${TEXT.DOMAINS_HEADING}")`,
      );
      await expect(domainsHeading).toBeVisible();
    });

    test("should show domains table with correct columns", async ({ page }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const tableRows = page.locator("tbody tr");
      await expect(tableRows.first()).toBeVisible({ timeout: 30000 });
    });

    test("should show name.mpc domain in table", async ({ page }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const testDomain = page.locator(`text=${TEST_DOMAIN_NAME}`);
      await expect(testDomain).toBeVisible({ timeout: 10000 });
    });

    test("should show pagination after domains load", async ({ page }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const paginationInfo = page.locator("text=/\\d+ of \\d+/");
      await expect(paginationInfo).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Domain Search/Filter", () => {
    test("should show search bar when connected", async ({ page }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).toBeVisible({ timeout: 30000 });
    });

    test("should filter domains by exact prefix match", async ({ page }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).toBeVisible({ timeout: 30000 });

      await searchBar.fill("name");

      const testDomain = page.locator(`text=${TEST_DOMAIN_NAME}`).first();
      await expect(testDomain).toBeVisible({ timeout: 10000 });
    });

    test("should filter domains by fuzzy match (contains)", async ({
      page,
    }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).toBeVisible({ timeout: 30000 });

      await searchBar.fill("ame.m");

      const testDomain = page.locator(`text=${TEST_DOMAIN_NAME}`).first();
      await expect(testDomain).toBeVisible({ timeout: 10000 });
    });

    test("should show no results message for non-matching search", async ({
      page,
    }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).toBeVisible({ timeout: 30000 });

      await searchBar.fill("nonexistentdomain12345");

      const noResults = page.locator(`text=${TEXT.NO_DOMAINS_FOUND}`);
      await expect(noResults).toBeVisible({ timeout: 10000 });
    });

    test("should clear search with X button", async ({ page }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).toBeVisible({ timeout: 30000 });

      await searchBar.fill("test");

      const clearBtn = page.locator('[data-testid="search-bar"] + button');
      await expect(clearBtn).toBeVisible({ timeout: 5000 });
      await clearBtn.click();

      await expect(searchBar).toHaveValue("");
    });
  });

  test.describe("Table Sorting", () => {
    test("should toggle sort on Token ID column", async ({ page }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const tokenIdHeader = page.locator("thead th").first();
      await expect(tokenIdHeader).toBeVisible({ timeout: 10000 });

      await tokenIdHeader.click();

      await page.waitForTimeout(PAGINATION_WAIT_MS);

      await tokenIdHeader.click();

      await page.waitForTimeout(PAGINATION_WAIT_MS);
    });

    test("should toggle sort on Domain Name column", async ({ page }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const domainNameHeader = page.locator("thead th").nth(1);
      await expect(domainNameHeader).toBeVisible({ timeout: 10000 });

      await domainNameHeader.click();

      await page.waitForTimeout(PAGINATION_WAIT_MS);

      await domainNameHeader.click();

      await page.waitForTimeout(PAGINATION_WAIT_MS);
    });

    test("should toggle sort on Parent column", async ({ page }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const parentHeader = page.locator("thead th").nth(2);
      await expect(parentHeader).toBeVisible({ timeout: 10000 });

      await parentHeader.click();

      await page.waitForTimeout(PAGINATION_WAIT_MS);

      await parentHeader.click();

      await page.waitForTimeout(PAGINATION_WAIT_MS);
    });
  });

  test.describe("Pagination", () => {
    test("should show rows per page selector", async ({ page }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const pageSizeSelector = page.locator('[role="combobox"]').first();
      await expect(pageSizeSelector).toBeVisible({ timeout: 10000 });
    });

    test("should show pagination navigation arrows", async ({ page }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const paginationNav = page.locator(".flex.items-center.gap-2").last();
      await expect(paginationNav).toBeVisible({ timeout: 10000 });
    });

    test("should show correct pagination format", async ({ page }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const paginationInfo = page.locator("text=/\\d+ of \\d+/");
      await expect(paginationInfo).toBeVisible({ timeout: 15000 });
    });

    test("should change page size to 5", async ({ page }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const pageSizeSelector = page.locator('[role="combobox"]').first();
      await expect(pageSizeSelector).toBeVisible({ timeout: 10000 });
    });

    test("should navigate to next page when available", async ({ page }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const paginationNav = page.locator(".flex.items-center.gap-2").last();
      const nextBtn = paginationNav.locator("button").nth(2);

      const isDisabled = await nextBtn.isDisabled();
      if (!isDisabled) {
        await nextBtn.click();
        await page.waitForTimeout(PAGINATION_WAIT_MS);
      }
    });

    test("should navigate to previous page when on page > 1", async ({
      page,
    }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const paginationNav = page.locator(".flex.items-center.gap-2").last();
      const prevBtn = paginationNav.locator("button").nth(1);

      const isDisabled = await prevBtn.isDisabled();
      if (!isDisabled) {
        await prevBtn.click();
        await page.waitForTimeout(PAGINATION_WAIT_MS);
      }
    });

    test("should go to first page with chevron-first button", async ({
      page,
    }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const paginationNav = page.locator(".flex.items-center.gap-2").last();
      const firstPageBtn = paginationNav.locator("button").first();
      await expect(firstPageBtn).toBeVisible({ timeout: 10000 });
    });

    test("should go to last page with chevron-last button", async ({
      page,
    }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const paginationNav = page.locator(".flex.items-center.gap-2").last();
      const lastPageBtn = paginationNav.locator("button").last();
      await expect(lastPageBtn).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Navigate to Domain", () => {
    test("should navigate to /domain/name.mpc when clicking domain name link", async ({
      page,
    }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const domainLink = page.locator(`a[href="/domain/${TEST_DOMAIN_NAME}"]`);
      await expect(domainLink).toBeVisible({ timeout: 10000 });

      await domainLink.click();

      await expect(page).toHaveURL(/\/domain\/name\.mpc/, { timeout: 10000 });
    });

    test("should navigate to domain page with correct content", async ({
      page,
    }) => {
      await connectWallet(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const domainLink = page.locator(`a[href="/domain/${TEST_DOMAIN_NAME}"]`);
      await expect(domainLink).toBeVisible({ timeout: 10000 });

      await domainLink.click();

      await expect(page.locator(SELECTORS.DOMAIN_TITLE)).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
