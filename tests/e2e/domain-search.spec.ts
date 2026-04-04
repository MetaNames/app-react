import { test, expect } from '@playwright/test';
import { type Page } from '@playwright/test';
import { DEBOUNCE_MS, SPINNER_TIMEOUT_MS, LONG_API_TIMEOUT_MS, CSS_CLASSES, PLACEHOLDERS } from './constants';
import { generateTestDomain } from './fixtures/shared';

const getSearchInput = (page: Page) => page.getByPlaceholder(PLACEHOLDERS.SEARCH_DOMAIN);

test.describe('Domain Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display search input and placeholder', async ({ page }) => {
    const input = getSearchInput(page);
    await expect(input).toBeVisible();
  });

  test('should show validation error for invalid characters', async ({ page }) => {
    const input = getSearchInput(page);
    await input.fill('test!@#');
    
    const errorMsg = page.locator('p.text-destructive');
    await expect(errorMsg).toContainText('Only lowercase letters, numbers, and hyphens allowed');
  });

  test('should show validation error for leading hyphen', async ({ page }) => {
    const input = getSearchInput(page);
    await input.fill('-test');
    
    const errorMsg = page.locator('p.text-destructive');
    await expect(errorMsg).toContainText('Cannot start or end with a hyphen');
  });

  test('should show validation error for trailing hyphen', async ({ page }) => {
    const input = getSearchInput(page);
    await input.fill('test-');
    
    const errorMsg = page.locator('p.text-destructive');
    await expect(errorMsg).toContainText('Cannot start or end with a hyphen');
  });

  test('should allow searching for 1-letter domain', async ({ page }) => {
    const input = getSearchInput(page);
    await input.fill('a');
    
    await page.waitForTimeout(DEBOUNCE_MS);
    
    const spinner = page.locator(CSS_CLASSES.ANIMATE_SPIN);
    await expect(spinner).toBeVisible({ timeout: SPINNER_TIMEOUT_MS });
  });

  test('should show loading spinner while checking availability', async ({ page }) => {
    const input = getSearchInput(page);
    await input.fill('loadingtest' + Date.now());
    
    await page.waitForTimeout(DEBOUNCE_MS);
    const spinner = page.locator(CSS_CLASSES.ANIMATE_SPIN);
    await expect(spinner).toBeVisible({ timeout: SPINNER_TIMEOUT_MS });
  });

  test('should show available badge for new domain', async ({ page }) => {
    const input = getSearchInput(page);
    const testDomain = generateTestDomain('zzztest');
    await input.fill(testDomain);
    
    await page.waitForTimeout(DEBOUNCE_MS);
    
    const availableBadge = page.getByText('Available');
    await expect(availableBadge).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });
  });

  test('should show registered badge for existing domain', async ({ page }) => {
    const input = getSearchInput(page);
    await input.fill('test');
    
    await page.waitForTimeout(DEBOUNCE_MS);
    
    const registeredBadge = page.getByText('Registered');
    await expect(registeredBadge).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });
  });

  test('should navigate to register page for available domain', async ({ page }) => {
    const input = getSearchInput(page);
    const testDomain = generateTestDomain('avail');
    await input.fill(testDomain);
    
    await page.waitForTimeout(DEBOUNCE_MS);
    
    const card = page.locator('a[href^="/register/"]');
    await expect(card).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });
  });

  test('should navigate to domain page for registered domain', async ({ page }) => {
    const input = getSearchInput(page);
    await input.fill('test');
    
    await page.waitForTimeout(DEBOUNCE_MS);
    
    const card = page.locator('a[href^="/domain/"]');
    await expect(card).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });
  });

  test('should clear results when input is cleared', async ({ page }) => {
    const input = getSearchInput(page);
    await input.fill('test');
    await page.waitForTimeout(DEBOUNCE_MS);
    
    await expect(page.getByText('Registered')).toBeVisible({ timeout: LONG_API_TIMEOUT_MS });
    
    await input.clear();
    await expect(page.getByText('Registered')).not.toBeVisible();
  });
});
