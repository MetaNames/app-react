import { test, expect } from '@playwright/test';

const TEST_WALLET_PK = 'df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c27928c';

test.describe('Domain Management', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  const connectWallet = async (page: any) => {
    const connectBtn = page.locator('button:has-text("Connect")');
    await connectBtn.click();
    const devKeyInput = page.locator('input.dev-key-input');
    await devKeyInput.fill(TEST_WALLET_PK);
    const devConnectBtn = page.locator('button.dev-key-connect');
    await devConnectBtn.click();
    await page.waitForTimeout(1500);
  };

  test('non-existent domain redirects to register page', async ({ page }) => {
    const nonexistentDomain = `nonexistent${Date.now()}.mpc`;
    await page.goto(`/domain/${nonexistentDomain}`);

    await expect(page).toHaveURL(new RegExp(`/register/${nonexistentDomain.replace('.mpc', '')}`), { timeout: 10000 });
  });

  test('view domain details for owned domain (test.mpc)', async ({ page }) => {
    await connectWallet(page);
    await page.goto('/domain/test.mpc');

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="domain-title"]')).toContainText('test.mpc');

    const avatar = page.locator('.avatar svg');
    await expect(avatar).toBeVisible();

    const profileSection = page.locator('h5:has-text("Profile")');
    await expect(profileSection).toBeVisible();

    const whoisSection = page.locator('h5:has-text("Whois")');
    await expect(whoisSection).toBeVisible();

    const ownerChip = page.locator('button:has-text(/Owner/i)');
    await expect(ownerChip).toBeVisible();

    const expiresChip = page.locator('button:has-text(/Expires/i)');
    await expect(expiresChip).toBeVisible();

    const socialSection = page.locator('h5:has-text("Social")');
    await expect(socialSection).toBeVisible();
  });

  test('owner sees tabs for details and settings', async ({ page }) => {
    await connectWallet(page);
    await page.goto('/domain/test.mpc');

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const tabsList = page.locator('role=tablist');
    await expect(tabsList).toBeVisible();

    const detailsTab = page.locator('role=tab[name="details"]');
    await expect(detailsTab).toBeVisible();
    await expect(detailsTab).toHaveAttribute('aria-selected', 'true');

    const settingsTab = page.locator('role=tab[name="settings"]');
    await expect(settingsTab).toBeVisible();
  });

  test('owner can switch between details and settings tabs', async ({ page }) => {
    await connectWallet(page);
    await page.goto('/domain/test.mpc');

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('role=tab[name="settings"]');
    await settingsTab.click();

    await expect(settingsTab).toHaveAttribute('aria-selected', 'true');

    const detailsTab = page.locator('role=tab[name="details"]');
    await detailsTab.click();

    await expect(detailsTab).toHaveAttribute('aria-selected', 'true');

    const profileSection = page.locator('h5:has-text("Profile")');
    await expect(profileSection).toBeVisible();
  });

  test('non-owner view shows no tabs', async ({ page }) => {
    await page.goto('/domain/test.mpc');

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const tabsList = page.locator('role=tablist');
    await expect(tabsList).not.toBeVisible();

    const profileSection = page.locator('h5:has-text("Profile")');
    await expect(profileSection).toBeVisible();

    const whoisSection = page.locator('h5:has-text("Whois")');
    await expect(whoisSection).toBeVisible();
  });

  test('domain page shows profile records (Bio and Price for test.mpc)', async ({ page }) => {
    await connectWallet(page);
    await page.goto('/domain/test.mpc');

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const profileSection = page.locator('h5:has-text("Profile")');
    await expect(profileSection).toBeVisible();

    const profileChips = page.locator('.flex.flex-wrap.gap-2').first();
    await expect(profileChips).toBeVisible();
  });

  test('domain page shows Whois section with Owner and Expires chips', async ({ page }) => {
    await connectWallet(page);
    await page.goto('/domain/test.mpc');

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const whoisSection = page.locator('h5:has-text("Whois")');
    await expect(whoisSection).toBeVisible();

    const ownerChip = page.locator('button:has-text(/Owner/i)');
    await expect(ownerChip).toBeVisible();

    const expiresChip = page.locator('button:has-text(/Expires/i)');
    await expect(expiresChip).toBeVisible();
  });

  test('domain page shows Social section', async ({ page }) => {
    await connectWallet(page);
    await page.goto('/domain/test.mpc');

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const socialSection = page.locator('h5:has-text("Social")');
    await expect(socialSection).toBeVisible();
  });

  test('settings tab shows Records editor and action buttons', async ({ page }) => {
    await connectWallet(page);
    await page.goto('/domain/test.mpc');

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('role=tab[name="settings"]');
    await settingsTab.click();

    await expect(settingsTab).toHaveAttribute('aria-selected', 'true');

    const recordsSection = page.locator('.records');
    await expect(recordsSection).toBeVisible();

    const renewButton = page.locator('button:has-text("Renew")');
    await expect(renewButton).toBeVisible();

    const transferButton = page.locator('button:has-text("Transfer")');
    await expect(transferButton).toBeVisible();
  });

  test('token id is displayed on domain page', async ({ page }) => {
    await connectWallet(page);
    await page.goto('/domain/test.mpc');

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const tokenIdText = page.locator('p.text-muted-foreground:has-text("#")');
    await expect(tokenIdText).toBeVisible();
  });
});
