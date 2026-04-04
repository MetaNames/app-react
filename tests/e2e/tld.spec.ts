import { test, expect } from '@playwright/test';

test.describe('TLD Information', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tld');
  });

  test('should show loading spinner while fetching TLD data', async ({ page }) => {
    const spinner = page.locator('.animate-spin');
    await expect(spinner).toBeVisible();
  });

  test('should display TLD name (mpc)', async ({ page }) => {
    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="domain-title"]')).toContainText('mpc');
  });

  test('should display TLD avatar (jdenticon)', async ({ page }) => {
    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });
    const avatar = page.locator('.avatar svg');
    await expect(avatar).toBeVisible();
  });

  test('should display token id', async ({ page }) => {
    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });
    const tokenIdText = page.locator('p.text-muted-foreground:has-text("#")');
    await expect(tokenIdText).toBeVisible();
  });

  test('should display owner chip with contract address', async ({ page }) => {
    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });
    const ownerChip = page.locator('a:has-text("Owner")');
    await expect(ownerChip).toBeVisible();
  });

  test('should display Whois section', async ({ page }) => {
    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });
    const whoisSection = page.locator('h5:has-text("Whois")');
    await expect(whoisSection).toBeVisible();
  });

  test('should NOT display Settings tab for TLD (isTld=true)', async ({ page }) => {
    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });
    const tabsList = page.locator('role=tablist');
    await expect(tabsList).not.toBeVisible();
  });

  test('should NOT display Details tab for TLD (isTld=true)', async ({ page }) => {
    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });
    const detailsTab = page.locator('role=tab[name="details"]');
    await expect(detailsTab).not.toBeVisible();
  });

  test('should display TLD information without tabs', async ({ page }) => {
    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });
    
    // Verify Whois section is visible directly (no tabs wrapping)
    const whoisSection = page.locator('h5:has-text("Whois")');
    await expect(whoisSection).toBeVisible();
    
    // Verify owner chip is visible (rendered as anchor due to href)
    const ownerChip = page.locator('a:has-text("Owner")');
    await expect(ownerChip).toBeVisible();
    
    // Verify no tabs exist
    const tabsList = page.locator('role=tablist');
    await expect(tabsList).not.toBeVisible();
  });
});
