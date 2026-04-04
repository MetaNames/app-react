import { test, expect } from '@playwright/test';
import { SELECTORS, TEXT, CSS_CLASSES, SPINNER_TIMEOUT_MS } from './constants';
import { DomainPage } from './pages/DomainPage';

test.describe('TLD Information', () => {
  let domainPage: DomainPage;

  test.beforeEach(async ({ page }) => {
    domainPage = new DomainPage(page);
    await page.goto('/tld');
  });

  test('should show loading spinner while fetching TLD data', async ({ page }) => {
    const spinner = page.locator(CSS_CLASSES.ANIMATE_SPIN);
    await expect(spinner).toBeVisible();
  });

  test('should display TLD name (mpc)', async ({ page }) => {
    await expect(page.locator(SELECTORS.DOMAIN_TITLE)).toBeVisible({ timeout: SPINNER_TIMEOUT_MS });
    await expect(page.locator(SELECTORS.DOMAIN_TITLE)).toContainText('mpc');
  });

  test('should display TLD avatar (jdenticon)', async ({ page }) => {
    await expect(page.locator(SELECTORS.DOMAIN_TITLE)).toBeVisible({ timeout: SPINNER_TIMEOUT_MS });
    const avatar = page.locator(CSS_CLASSES.AVATAR);
    await expect(avatar).toBeVisible();
  });

  test('should display token id', async ({ page }) => {
    await expect(page.locator(SELECTORS.DOMAIN_TITLE)).toBeVisible({ timeout: SPINNER_TIMEOUT_MS });
    await expect(domainPage.tokenId).toBeVisible();
  });

  test('should display owner chip linking to contract page', async ({ page }) => {
    await expect(page.locator(SELECTORS.DOMAIN_TITLE)).toBeVisible({ timeout: SPINNER_TIMEOUT_MS });
    const ownerChip = page.locator('a[href*="/contracts/"]');
    await expect(ownerChip).toBeVisible();
    await expect(ownerChip).toHaveAttribute('href', /\/contracts\//);
  });

  test('should display Whois section', async ({ page }) => {
    await expect(page.locator(SELECTORS.DOMAIN_TITLE)).toBeVisible({ timeout: SPINNER_TIMEOUT_MS });
    const whoisSection = page.locator(`h5:has-text("${TEXT.WHOIS}")`);
    await expect(whoisSection).toBeVisible();
  });

  test('should NOT display Settings tab for TLD (isTld=true)', async ({ page }) => {
    await expect(page.locator(SELECTORS.DOMAIN_TITLE)).toBeVisible({ timeout: SPINNER_TIMEOUT_MS });
    const tabsList = page.locator('[role=tablist]');
    await expect(tabsList).not.toBeVisible();
  });

  test('should NOT display Details tab for TLD (isTld=true)', async ({ page }) => {
    await expect(page.locator(SELECTORS.DOMAIN_TITLE)).toBeVisible({ timeout: SPINNER_TIMEOUT_MS });
    const detailsTab = page.locator(SELECTORS.TAB_DETAILS);
    await expect(detailsTab).not.toBeVisible();
  });

  test('should display TLD information without tabs', async ({ page }) => {
    await expect(page.locator(SELECTORS.DOMAIN_TITLE)).toBeVisible({ timeout: SPINNER_TIMEOUT_MS });
    
    // Verify Whois section is visible directly (no tabs wrapping)
    const whoisSection = page.locator(`h5:has-text("${TEXT.WHOIS}")`);
    await expect(whoisSection).toBeVisible();
    
    // Verify owner chip is visible (rendered as anchor due to href)
    const ownerChip = page.locator('a[href*="/contracts/"]');
    await expect(ownerChip).toBeVisible();
    
    // Verify no tabs exist
    const tabsList = page.locator('[role=tablist]');
    await expect(tabsList).not.toBeVisible();
  });
});
