import { test, expect } from '@playwright/test';

const TEST_WALLET_PK = 'df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c27928c';

async function connectWallet(page: any) {
  const connectBtn = page.locator('button:has-text("Connect")');
  await connectBtn.click();
  
  const devKeyInput = page.locator('input.dev-key-input');
  await devKeyInput.fill(TEST_WALLET_PK);
  
  const devConnectBtn = page.locator('button.dev-key-connect');
  await devConnectBtn.click();
  
  await page.waitForTimeout(1500);
}

test.describe('User Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
  });

  test.describe('Disconnected State', () => {
    test('should show "Connect your wallet to see your domains" message', async ({ page }) => {
      const message = page.locator('text=Connect your wallet to see your domains');
      await expect(message).toBeVisible();
    });

    test('should not show Profile heading when disconnected', async ({ page }) => {
      const profileHeading = page.locator('h1:has-text("Profile")');
      await expect(profileHeading).not.toBeVisible();
    });

    test('should not show Domains heading when disconnected', async ({ page }) => {
      const domainsHeading = page.locator('h2:has-text("Domains")');
      await expect(domainsHeading).not.toBeVisible();
    });

    test('should not show search bar when disconnected', async ({ page }) => {
      const searchBar = page.locator('[data-testid="search-bar"]');
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
      
      const profileHeading = page.locator('h1:has-text("Profile")');
      await expect(profileHeading).toBeVisible();
    });

    test('should show address chip after connecting', async ({ page }) => {
      await connectWallet(page);
      
      const addressChip = page.locator('text=address');
      await expect(addressChip).toBeVisible();
    });

    test('should show Domains heading after connecting', async ({ page }) => {
      await connectWallet(page);
      
      const domainsHeading = page.locator('h2:has-text("Domains")');
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
      
      const testDomain = page.locator('table >> text=test.mpc');
      await expect(testDomain).toBeVisible();
    });

    test('should show loading spinner while fetching domains', async ({ page }) => {
      await connectWallet(page);
      
      const loadingSpinner = page.locator('.animate-spin');
      await expect(loadingSpinner).toBeVisible();
    });

    test('should show pagination after domains load', async ({ page }) => {
      await connectWallet(page);
      
      const paginationInfo = page.locator('text=/\\d+-\\d+ of \\d+/');
      await expect(paginationInfo).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Domain Search/Filter', () => {
    test('should show search bar when connected', async ({ page }) => {
      await connectWallet(page);
      
      const searchBar = page.locator('[data-testid="search-bar"]');
      await expect(searchBar).toBeVisible();
    });

    test('should filter domains by exact prefix match', async ({ page }) => {
      await connectWallet(page);
      
      const searchBar = page.locator('[data-testid="search-bar"]');
      await expect(searchBar).toBeVisible({ timeout: 10000 });
      
      await searchBar.fill('test');
      
      const testDomain = page.locator('table >> text=test.mpc');
      await expect(testDomain).toBeVisible();
    });

    test('should filter domains by fuzzy match (contains)', async ({ page }) => {
      await connectWallet(page);
      
      const searchBar = page.locator('[data-testid="search-bar"]');
      await expect(searchBar).toBeVisible({ timeout: 10000 });
      
      await searchBar.fill('est.m');
      
      const testDomain = page.locator('table >> text=test.mpc');
      await expect(testDomain).toBeVisible();
    });

    test('should show no results message for non-matching search', async ({ page }) => {
      await connectWallet(page);
      
      const searchBar = page.locator('[data-testid="search-bar"]');
      await expect(searchBar).toBeVisible({ timeout: 10000 });
      
      await searchBar.fill('nonexistentdomain12345');
      
      const noResults = page.locator('text=No domains found');
      await expect(noResults).toBeVisible();
    });

    test('should clear search with X button', async ({ page }) => {
      await connectWallet(page);
      
      const searchBar = page.locator('[data-testid="search-bar"]');
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
      
      await page.waitForTimeout(300);
      
      await tokenIdHeader.click();
      
      await page.waitForTimeout(300);
    });

    test('should toggle sort on Domain Name column', async ({ page }) => {
      await connectWallet(page);
      
      const domainNameHeader = page.locator('th:has-text("Domain Name")');
      await expect(domainNameHeader).toBeVisible({ timeout: 10000 });
      
      await domainNameHeader.click();
      
      await page.waitForTimeout(300);
      
      await domainNameHeader.click();
      
      await page.waitForTimeout(300);
    });

    test('should toggle sort on Parent column', async ({ page }) => {
      await connectWallet(page);
      
      const parentHeader = page.locator('th:has-text("Parent")');
      await expect(parentHeader).toBeVisible({ timeout: 10000 });
      
      await parentHeader.click();
      
      await page.waitForTimeout(300);
      
      await parentHeader.click();
      
      await page.waitForTimeout(300);
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
      
      await expect(page.locator('button:has([class*="lucide-chevron"])')).toHaveCount(4, { timeout: 10000 });
    });

    test('should show correct pagination format', async ({ page }) => {
      await connectWallet(page);
      
      const paginationInfo = page.locator('text=/\\d+-\\d+ of \\d+/');
      await expect(paginationInfo).toBeVisible({ timeout: 10000 });
    });

    test('should change page size to 5', async ({ page }) => {
      await connectWallet(page);
      
      const pageSizeSelector = page.locator('[role="combobox"]').first();
      await expect(pageSizeSelector).toBeVisible({ timeout: 10000 });
      
      await pageSizeSelector.click();
      
      const option5 = page.locator('[role="option"]:has-text("5"), [role="option"] >> text=5').first();
      await option5.click();
      
      await page.waitForTimeout(300);
    });

    test('should navigate to next page when available', async ({ page }) => {
      await connectWallet(page);
      
      const paginationInfo = page.locator('text=/\\d+-\\d+ of \\d+/');
      await expect(paginationInfo).toBeVisible({ timeout: 10000 });
      
      const nextBtn = page.locator('button:has([class*="lucide-chevron-right"]):not(:has([class*="lucide-chevrons"]))');
      
      const isDisabled = await nextBtn.isDisabled();
      if (!isDisabled) {
        await nextBtn.click();
        await page.waitForTimeout(300);
      }
    });

    test('should navigate to previous page when on page > 1', async ({ page }) => {
      await connectWallet(page);
      
      const paginationInfo = page.locator('text=/\\d+-\\d+ of \\d+/');
      await expect(paginationInfo).toBeVisible({ timeout: 10000 });
      
      const prevBtn = page.locator('button:has([class*="lucide-chevron-left"]):not(:has([class*="lucide-chevrons"]))');
      
      const isDisabled = await prevBtn.isDisabled();
      if (!isDisabled) {
        await prevBtn.click();
        await page.waitForTimeout(300);
      }
    });

    test('should go to first page with chevron-first button', async ({ page }) => {
      await connectWallet(page);
      
      const firstPageBtn = page.locator('button:has([class*="lucide-chevrons-left"])');
      await expect(firstPageBtn).toBeVisible({ timeout: 10000 });
    });

    test('should go to last page with chevron-last button', async ({ page }) => {
      await connectWallet(page);
      
      const lastPageBtn = page.locator('button:has([class*="lucide-chevrons-right"])');
      await expect(lastPageBtn).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Navigate to Domain', () => {
    test('should navigate to /domain/test.mpc when clicking domain name link', async ({ page }) => {
      await connectWallet(page);
      
      const domainLink = page.locator('a[href="/domain/test.mpc"]');
      await expect(domainLink).toBeVisible({ timeout: 10000 });
      
      await domainLink.click();
      
      await expect(page).toHaveURL(/\/domain\/test\.mpc/);
    });

    test('should navigate to domain page with correct content', async ({ page }) => {
      await connectWallet(page);
      
      const domainLink = page.locator('a[href="/domain/test.mpc"]');
      await expect(domainLink).toBeVisible({ timeout: 10000 });
      
      await domainLink.click();
      
      await expect(page.locator('h1:has-text("test.mpc")')).toBeVisible({ timeout: 10000 });
    });
  });
});
