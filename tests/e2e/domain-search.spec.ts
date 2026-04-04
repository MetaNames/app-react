import { test, expect } from '@playwright/test';

const TEST_WALLET_PK = 'df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c27928c';

test.describe('Domain Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display search input and placeholder', async ({ page }) => {
    const input = page.getByPlaceholder('Search for a .mpc domain...');
    await expect(input).toBeVisible();
  });

  test('should show validation error for invalid characters', async ({ page }) => {
    const input = page.getByPlaceholder('Search for a .mpc domain...');
    await input.fill('test!@#');
    
    const errorMsg = page.locator('p.text-destructive');
    await expect(errorMsg).toContainText('Only lowercase letters, numbers, and hyphens allowed');
  });

  test('should show validation error for leading hyphen', async ({ page }) => {
    const input = page.getByPlaceholder('Search for a .mpc domain...');
    await input.fill('-test');
    
    const errorMsg = page.locator('p.text-destructive');
    await expect(errorMsg).toContainText('Cannot start or end with a hyphen');
  });

  test('should show validation error for trailing hyphen', async ({ page }) => {
    const input = page.getByPlaceholder('Search for a .mpc domain...');
    await input.fill('test-');
    
    const errorMsg = page.locator('p.text-destructive');
    await expect(errorMsg).toContainText('Cannot start or end with a hyphen');
  });

  test('should allow searching for 1-letter domain', async ({ page }) => {
    const input = page.getByPlaceholder('Search for a .mpc domain...');
    await input.fill('a');
    
    await page.waitForTimeout(600);
    
    const spinner = page.locator('.animate-spin');
    await expect(spinner).toBeVisible({ timeout: 10000 });
  });

  test('should show loading spinner while checking availability', async ({ page }) => {
    const input = page.getByPlaceholder('Search for a .mpc domain...');
    await input.fill('loadingtest' + Date.now());
    
    await page.waitForTimeout(600); // wait for debounce (400ms) and SDK init
    const spinner = page.locator('.animate-spin');
    await expect(spinner).toBeVisible({ timeout: 10000 });
  });

  test('should show available badge for new domain', async ({ page }) => {
    const input = page.getByPlaceholder('Search for a .mpc domain...');
    const testDomain = `zzztest${Date.now()}`;
    await input.fill(testDomain);
    
    await page.waitForTimeout(600);
    
    const availableBadge = page.locator('text=Available');
    await expect(availableBadge).toBeVisible({ timeout: 15000 });
  });

  test('should show registered badge for existing domain', async ({ page }) => {
    const input = page.getByPlaceholder('Search for a .mpc domain...');
    await input.fill('test');
    
    await page.waitForTimeout(600);
    
    const registeredBadge = page.locator('text=Registered');
    await expect(registeredBadge).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to register page for available domain', async ({ page }) => {
    const input = page.getByPlaceholder('Search for a .mpc domain...');
    const testDomain = `avail${Date.now()}`;
    await input.fill(testDomain);
    
    await page.waitForTimeout(600);
    
    const card = page.locator('a[href^="/register/"]');
    await expect(card).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to domain page for registered domain', async ({ page }) => {
    const input = page.getByPlaceholder('Search for a .mpc domain...');
    await input.fill('test');
    
    await page.waitForTimeout(600);
    
    const card = page.locator('a[href^="/domain/"]');
    await expect(card).toBeVisible({ timeout: 15000 });
  });

  test('should clear results when input is cleared', async ({ page }) => {
    const input = page.getByPlaceholder('Search for a .mpc domain...');
    await input.fill('test');
    await page.waitForTimeout(600);
    
    await expect(page.locator('text=Registered')).toBeVisible({ timeout: 15000 });
    
    await input.clear();
    await expect(page.locator('text=Registered')).not.toBeVisible();
  });
});