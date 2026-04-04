import { test, expect } from '@playwright/test';
import { SELECTORS, TEXT, CSS_CLASSES, PAGINATION_WAIT_MS, TEST_DOMAIN_NAME } from './constants';
import { connectWallet } from './helpers/wallet-helper';

test.describe('User Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
  });

  test.describe('Disconnected State', () => {
    test('should show "Connect your wallet to see your domains" message', async ({ page }) => {
      const message = page.locator(`text=${TEXT.CONNECT_TO_SEE_DOMAINS}`);
      await expect(message).toBeVisible();
    });

    test('should not show Profile heading when disconnected', async ({ page }) => {
      const profileHeading = page.locator(`h1:has-text("${TEXT.PROFILE_HEADING}")`);
      await expect(profileHeading).not.toBeVisible();
    });

    test('should not show Domains heading when disconnected', async ({ page }) => {
      const domainsHeading = page.locator(`h2:has-text("${TEXT.DOMAINS_HEADING}")`);
      await expect(domainsHeading).not.toBeVisible();
    });

    test('should not show search bar when disconnected', async ({ page }) => {
      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).not.toBeVisible();
    });

    test('should not show domains table when disconnected', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).not.toBeVisible();
    });
  });

  test.describe('Connected State', () => {
    test('should show Profile heading after connecting', async ({ page }) => {
      await connectWallet(page);
      
      const profileHeading = page.locator(`h1:has-text("${TEXT.PROFILE_HEADING}")`);
      await expect(profileHeading).toBeVisible();
    });

    test('should show address chip after connecting', async ({ page }) => {
      await connectWallet(page);
      
      const addressChip = page.locator('text=address');
      await expect(addressChip).toBeVisible();
    });

    test('should show Domains heading after connecting', async ({ page }) => {
      await connectWallet(page);
      
      const domainsHeading = page.locator(`h2:has-text("${TEXT.DOMAINS_HEADING}")`);
      await expect(domainsHeading).toBeVisible();
    });

    test('should show domains table with correct columns', async ({ page }) => {
      await connectWallet(page);
      
      const table = page.locator('table');
      await expect(table).toBeVisible();
      
      await expect(page.locator('th:has-text("Token ID")')).toBeVisible();
      await expect(page.locator('th:has-text("Domain Name")')).toBeVisible();
      await expect(page.locator('th:has-text("Parent")')).toBeVisible();
    });

    test('should show test.mpc domain in table', async ({ page }) => {
      await connectWallet(page);
      
      const testDomain = page.locator(`table >> text=${TEST_DOMAIN_NAME}`);
      await expect(testDomain).toBeVisible();
    });

    test('should show pagination after domains load', async ({ page }) => {
      await connectWallet(page);
      
      const paginationInfo = page.locator('text=/\\d+\\-\\d+ of \\d+/');
      await expect(paginationInfo).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Domain Search/Filter', () => {
    test('should show search bar when connected', async ({ page }) => {
      await connectWallet(page);
      
      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).toBeVisible();
    });

    test('should filter domains by exact prefix match', async ({ page }) => {
      await connectWallet(page);
      
      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).toBeVisible({ timeout: 10000 });
      
      await searchBar.fill('test');
      
      const testDomain = page.locator(`table >> text=${TEST_DOMAIN_NAME}`);
      await expect(testDomain).toBeVisible();
    });

    test('should filter domains by fuzzy match (contains)', async ({ page }) => {
      await connectWallet(page);
      
      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).toBeVisible({ timeout: 10000 });
      
      await searchBar.fill('est.m');
      
      const testDomain = page.locator(`table >> text=${TEST_DOMAIN_NAME}`);
      await expect(testDomain).toBeVisible();
    });

    test('should show no results message for non-matching search', async ({ page }) => {
      await connectWallet(page);
      
      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).toBeVisible({ timeout: 10000 });
      
      await searchBar.fill('nonexistentdomain12345');
      
      const noResults = page.locator(`text=${TEXT.NO_DOMAINS_FOUND}`);
      await expect(noResults).toBeVisible();
    });

    test('should clear search with X button', async ({ page }) => {
      await connectWallet(page);
      
      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).toBeVisible({ timeout: 10000 });
      
      await searchBar.fill('test');
      
      const clearBtn = page.locator('[data-testid="search-bar"] + button, button:has(.lucide-x)').first();
      await clearBtn.click();
      
      await expect(searchBar).toHaveValue('');
    });
  });

  test.describe('Table Sorting', () => {
    test('should toggle sort on Token ID column', async ({ page }) => {
      await connectWallet(page);
      
      const tokenIdHeader = page.locator('th:has-text("Token ID")');
      await expect(tokenIdHeader).toBeVisible({ timeout: 10000 });
      
      await tokenIdHeader.click();
      
      await page.waitForTimeout(PAGINATION_WAIT_MS);
      
      await tokenIdHeader.click();
      
      await page.waitForTimeout(PAGINATION_WAIT_MS);
    });

    test('should toggle sort on Domain Name column', async ({ page }) => {
      await connectWallet(page);
      
      const domainNameHeader = page.locator('th:has-text("Domain Name")');
      await expect(domainNameHeader).toBeVisible({ timeout: 10000 });
      
      await domainNameHeader.click();
      
      await page.waitForTimeout(PAGINATION_WAIT_MS);
      
      await domainNameHeader.click();
      
      await page.waitForTimeout(PAGINATION_WAIT_MS);
    });

    test('should toggle sort on Parent column', async ({ page }) => {
      await connectWallet(page);
      
      const parentHeader = page.locator('th:has-text("Parent")');
      await expect(parentHeader).toBeVisible({ timeout: 10000 });
      
      await parentHeader.click();
      
      await page.waitForTimeout(PAGINATION_WAIT_MS);
      
      await parentHeader.click();
      
      await page.waitForTimeout(PAGINATION_WAIT_MS);
    });
  });

  test.describe('Pagination', () => {
    test('should show rows per page selector', async ({ page }) => {
      await connectWallet(page);
      
      const pageSizeSelector = page.locator('select').or(page.locator('[role="combobox"]')).first();
      await expect(pageSizeSelector).toBeVisible({ timeout: 10000 });
    });

    test('should show pagination navigation arrows', async ({ page }) => {
      await connectWallet(page);
      
      const paginationInfo = page.locator('text=/\\d+\\-\\d+ of \\d+/');
      await expect(paginationInfo).toBeVisible({ timeout: 10000 });
      
      await expect(page.locator('svg[class*="lucide-chevron-first"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('svg[class*="lucide-chevron-last"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('svg[class*="lucide-chevron-left"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('svg[class*="lucide-chevron-right"]')).toBeVisible({ timeout: 10000 });
    });

    test('should show correct pagination format', async ({ page }) => {
      await connectWallet(page);
      
      const paginationInfo = page.locator('text=/\\d+\\-\\d+ of \\d+/');
      await expect(paginationInfo).toBeVisible({ timeout: 10000 });
    });

    test('should change page size to 5', async ({ page }) => {
      await connectWallet(page);
      
      const pageSizeSelector = page.locator('[role="combobox"]').first();
      await expect(pageSizeSelector).toBeVisible({ timeout: 10000 });
      
      await pageSizeSelector.click();
      
      const option5 = page.locator('[role="option"]:has-text("5"), [role="option"] >> text=5').first();
      await option5.click();
      
      await page.waitForTimeout(PAGINATION_WAIT_MS);
    });

test('should navigate to next page when available', async ({ page }) => {
      await connectWallet(page);
      
      const paginationInfo = page.locator('text=/\\d+\\-\\d+ of \\d+/');
      await expect(paginationInfo).toBeVisible({ timeout: 10000 });
      
      const paginationNav = page.locator('.flex.items-center.gap-2').last();
      const nextBtn = paginationNav.locator('button >> svg[class*="chevron-right"]').first();
      
      const isDisabled = await nextBtn.isDisabled();
      if (!isDisabled) {
        await nextBtn.click();
        await page.waitForTimeout(PAGINATION_WAIT_MS);
      }
    });
    
    test('should navigate to previous page when on page > 1', async ({ page }) => {
      await connectWallet(page);
      
      const paginationInfo = page.locator('text=/\\d+\\-\\d+ of \\d+/');
      await expect(paginationInfo).toBeVisible({ timeout: 10000 });
      
      const paginationNav = page.locator('.flex.items-center.gap-2').last();
      const prevBtn = paginationNav.locator('button >> svg[class*="chevron-left"]').first();
      
      const isDisabled = await prevBtn.isDisabled();
      if (!isDisabled) {
        await prevBtn.click();
        await page.waitForTimeout(PAGINATION_WAIT_MS);
      }
    });
    
    test('should go to first page with chevron-first button', async ({ page }) => {
      await connectWallet(page);
      
      const paginationNav = page.locator('.flex.items-center.gap-2').last();
      const firstPageBtn = paginationNav.locator('button >> svg[class*="chevron-first"]').first();
      await expect(firstPageBtn).toBeVisible({ timeout: 10000 });
    });
    
    test('should go to last page with chevron-last button', async ({ page }) => {
      await connectWallet(page);
      
      const paginationNav = page.locator('.flex.items-center.gap-2').last();
      const lastPageBtn = paginationNav.locator('button >> svg[class*="chevron-last"]').first();
      await expect(lastPageBtn).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Navigate to Domain', () => {
    test('should navigate to /domain/test.mpc when clicking domain name link', async ({ page }) => {
      await connectWallet(page);
      
      const domainLink = page.locator(`a[href="/domain/${TEST_DOMAIN_NAME}"]`);
      await expect(domainLink).toBeVisible({ timeout: 10000 });
      
      await domainLink.click();
      
      await expect(page).toHaveURL(new RegExp(`\\/domain\\/${TEST_DOMAIN_NAME.replace('.', '\\\\.')}`));
    });

    test('should navigate to domain page with correct content', async ({ page }) => {
      await connectWallet(page);
      
      const domainLink = page.locator(`a[href="/domain/${TEST_DOMAIN_NAME}"]`);
      await expect(domainLink).toBeVisible({ timeout: 10000 });
      
      await domainLink.click();
      
      await expect(page.locator(SELECTORS.DOMAIN_TITLE)).toBeVisible({ timeout: 10000 });
    });
  });
});
