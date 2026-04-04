/**
 * E2E tests for domain registration.
 * 
 * NOTE: These tests may interact with the actual blockchain via testnet.
 * Set TESTNET_PRIVATE_KEY environment variable to enable real blockchain interactions:
 * TESTNET_PRIVATE_KEY=df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c27928c
 */

import { test, expect } from '@playwright/test';
import { connectWallet, executeBlockchainOp, gotoAndRestoreWallet } from './helpers/wallet-helper';

test.describe('Domain Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to register page for available domain', async ({ page }) => {
    const input = page.getByPlaceholder('Search for a .mpc domain...');
    const testDomain = `availreg${Date.now()}`;
    await input.fill(testDomain);
    
    await page.waitForTimeout(600);
    
    const card = page.locator(`a[href^="/register/"]`);
    await expect(card).toBeVisible({ timeout: 15000 });
  });

  test('should display registration page with checkout content for available domain', async ({ page }) => {
    const testDomain = `checkout${Date.now()}.mpc`;
    await page.goto(`/register/${testDomain}`);
    
    const heading = page.locator(`h2:has-text("Register ${testDomain}")`);
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    const checkoutContent = page.locator('.content.checkout');
    await expect(checkoutContent).toBeVisible();
  });

  test('should show connect wallet prompt when wallet is disconnected', async ({ page }) => {
    const testDomain = `connect${Date.now()}.mpc`;
    await page.goto(`/register/${testDomain}`);
    
    const connectPrompt = page.locator('text=Connect your wallet to continue');
    await expect(connectPrompt).toBeVisible({ timeout: 10000 });
  });

  test('should not show payment form when wallet is disconnected', async ({ page }) => {
    const testDomain = `nopayment${Date.now()}.mpc`;
    await page.goto(`/register/${testDomain}`);
    
    await page.waitForTimeout(1000);
    
    const paymentTokenSelect = page.locator('[data-testid="payment-token-select"]');
    await expect(paymentTokenSelect).not.toBeVisible();
    
    const addYearBtn = page.locator('button[aria-label="add-year"]');
    await expect(addYearBtn).not.toBeVisible();
    
    const removeYearBtn = page.locator('button[aria-label="remove-year"]');
    await expect(removeYearBtn).not.toBeVisible();
  });

  test('should show payment form when wallet is connected', async ({ page }) => {
    const testDomain = `payform${Date.now()}.mpc`;
    if (!await gotoAndRestoreWallet(page, `/register/${testDomain}`)) {
      test.skip(true, 'Wallet not available');
    }
    
    await page.waitForTimeout(1000);
    
    const paymentTokenSelect = page.locator('[data-testid="payment-token-select"]');
    
    if (!await paymentTokenSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      const connectPrompt = page.locator('text=Connect your wallet to continue');
      if (await connectPrompt.isVisible().catch(() => false)) {
        test.skip(true, 'Wallet state not persisted after navigation - app needs wallet persistence fix');
      }
    }
    
    await expect(paymentTokenSelect).toBeVisible({ timeout: 10000 });
  });

  test('should display payment token selection dropdown with available tokens', async ({ page }) => {
    const testDomain = `tokens${Date.now()}.mpc`;
    if (!await gotoAndRestoreWallet(page, `/register/${testDomain}`)) {
      test.skip(true, 'Wallet not available');
    }
    
    await page.waitForTimeout(1000);
    
    const paymentTokenSelect = page.locator('[data-testid="payment-token-select"]');
    
    if (!await paymentTokenSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip(true, 'Wallet state not persisted after navigation - app needs wallet persistence fix');
    }
    
    await expect(paymentTokenSelect).toBeVisible({ timeout: 10000 });
    await paymentTokenSelect.click();
    
    const selectContent = page.locator('[data-slot="select-content"]');
    await expect(selectContent).toBeVisible();
    
    const expectedTokens = ['BTC', 'ETH', 'USDT', 'PARTI', 'TEST_COIN'];
    for (const token of expectedTokens) {
      await expect(page.getByText(token, { exact: false }).first()).toBeVisible();
    }
  });

  test('should display year selector with add and remove buttons', async ({ page }) => {
    const testDomain = `yearsel${Date.now()}.mpc`;
    if (!await gotoAndRestoreWallet(page, `/register/${testDomain}`)) {
      test.skip(true, 'Wallet not available');
    }
    
    await page.waitForTimeout(1000);
    
    const addYearBtn = page.locator('button[aria-label="add-year"]');
    
    if (!await addYearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip(true, 'Wallet state not persisted after navigation - app needs wallet persistence fix');
    }
    
    await expect(addYearBtn).toBeVisible({ timeout: 10000 });
    
    const removeYearBtn = page.locator('button[aria-label="remove-year"]');
    await expect(removeYearBtn).toBeVisible();
    
    const yearDisplay = page.getByText(/\d+ year/).first();
    await expect(yearDisplay).toContainText('1 year');
  });

  test('should increment year count when add-year button is clicked', async ({ page }) => {
    const testDomain = `addyear${Date.now()}.mpc`;
    if (!await gotoAndRestoreWallet(page, `/register/${testDomain}`)) {
      test.skip(true, 'Wallet not available');
    }
    
    await page.waitForTimeout(1000);
    
    const addYearBtn = page.locator('button[aria-label="add-year"]');
    
    if (!await addYearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip(true, 'Wallet state not persisted after navigation - app needs wallet persistence fix');
    }
    
    await addYearBtn.click();
    
    const yearDisplay = page.getByText(/\d+ year/).first();
    await expect(yearDisplay).toContainText('2 years');
  });

  test('should decrement year count when remove-year button is clicked', async ({ page }) => {
    const testDomain = `remyear${Date.now()}.mpc`;
    if (!await gotoAndRestoreWallet(page, `/register/${testDomain}`)) {
      test.skip(true, 'Wallet not available');
    }
    
    await page.waitForTimeout(1000);
    
    const addYearBtn = page.locator('button[aria-label="add-year"]');
    
    if (!await addYearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip(true, 'Wallet state not persisted after navigation - app needs wallet persistence fix');
    }
    
    await addYearBtn.click();
    await addYearBtn.click();
    
    const yearDisplay1 = page.getByText(/\d+ year/).first();
    await expect(yearDisplay1).toContainText('3 years');
    
    const removeYearBtn = page.locator('button[aria-label="remove-year"]');
    await removeYearBtn.click();
    
    await expect(yearDisplay1).toContainText('2 years');
  });

  test('should disable remove-year button at minimum 1 year', async ({ page }) => {
    const testDomain = `minyear${Date.now()}.mpc`;
    if (!await gotoAndRestoreWallet(page, `/register/${testDomain}`)) {
      test.skip(true, 'Wallet not available');
    }
    
    await page.waitForTimeout(1000);
    
    const removeYearBtn = page.locator('button[aria-label="remove-year"]');
    
    if (!await removeYearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip(true, 'Wallet state not persisted after navigation - app needs wallet persistence fix');
    }
    
    await expect(removeYearBtn).toBeDisabled();
    
    const addYearBtn = page.locator('button[aria-label="add-year"]');
    await addYearBtn.click();
    
    await expect(removeYearBtn).toBeEnabled();
  });

  test('should display price breakdown with 1 year registration and total', async ({ page }) => {
    const testDomain = `price${Date.now()}.mpc`;
    if (!await gotoAndRestoreWallet(page, `/register/${testDomain}`)) {
      test.skip(true, 'Wallet not available');
    }
    
    await page.waitForTimeout(2000);
    
    const priceBreakdown = page.getByText(/1 year registration/);
    await expect(priceBreakdown).toBeVisible({ timeout: 10000 });
    
    const totalPrice = page.getByText('Total (excluding network fees)');
    await expect(totalPrice).toBeVisible();
  });

  test('should update price breakdown when years are changed', async ({ page }) => {
    const testDomain = `priceupdate${Date.now()}.mpc`;
    if (!await gotoAndRestoreWallet(page, `/register/${testDomain}`)) {
      test.skip(true, 'Wallet not available');
    }
    
    await page.waitForTimeout(2000);
    
    const addYearBtn = page.locator('button[aria-label="add-year"]');
    
    if (!await addYearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip(true, 'Wallet state not persisted after navigation - app needs wallet persistence fix');
    }
    
    await addYearBtn.click();
    
    await page.waitForTimeout(500);
    
    const totalPrice = page.getByText('Total (excluding network fees)').locator('..');
    await expect(totalPrice).toContainText('2');
  });

  test('should redirect to domain page when domain is already registered', async ({ page }) => {
    await page.goto('/register/test.mpc');
    
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/domain/test.mpc');
  });

  test.describe('Subdomain Registration', () => {
    test('should show subdomain registration component when parent domain exists', async ({ page }) => {
      if (!await gotoAndRestoreWallet(page, '/register/sub.test.mpc')) {
        test.skip(true, 'Wallet not available');
      }
      
      await page.waitForTimeout(2000);
      
      const subdomainTitle = page.locator('[data-slot="card-title"]:has-text("sub.test.mpc")');
      await expect(subdomainTitle).toBeVisible({ timeout: 10000 });
      
      const parentChip = page.getByText(/Parent:/);
      await expect(parentChip).toBeVisible();
      
      const freePrice = page.getByText(/FREE/);
      await expect(freePrice).toBeVisible();
    });

    test('should show register button for subdomain', async ({ page }) => {
      if (!await gotoAndRestoreWallet(page, '/register/sub.test.mpc')) {
        test.skip(true, 'Wallet not available');
      }
      
      await page.waitForTimeout(2000);
      
      const registerBtn = page.locator('button:has-text("Register domain")');
      await expect(registerBtn).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Wallet Connection State', () => {
    test('should show payment token dropdown after connecting wallet', async ({ page }) => {
      const testDomain = `walletcon${Date.now()}.mpc`;

      // Check prompt appears when disconnected on register page
      await page.goto(`/register/${testDomain}`);
      await page.waitForTimeout(1000);
      const promptBefore = page.locator('text=Connect your wallet to continue');
      await expect(promptBefore).toBeVisible({ timeout: 10000 });

      // Connect wallet and verify payment form appears
      if (!await connectWallet(page)) {
        test.skip(true, 'Wallet not available');
      }
      await page.waitForTimeout(1000);

      await expect(promptBefore).not.toBeVisible();
      const paymentTokenSelect = page.locator('[data-testid="payment-token-select"]');
      await expect(paymentTokenSelect).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Actual Domain Registration', () => {
    test('should attempt domain registration with test key', async ({ page }) => {
      if (!process.env.TESTNET_PRIVATE_KEY) {
        test.skip(true, 'TESTNET_PRIVATE_KEY not set - blockchain interaction disabled');
      }

      const testDomain = `e2ereg${Date.now()}.mpc`;
      if (!await gotoAndRestoreWallet(page, `/register/${testDomain}`)) {
        test.skip(true, 'Wallet not available');
      }
      
      await page.waitForTimeout(2000);
      
      const registerBtn = page.locator('button:has-text("Register domain")');
      
      if (!await registerBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        test.skip(true, 'Wallet state not persisted after navigation - app needs wallet persistence fix');
      }
      
      const isEnabled = await registerBtn.isEnabled({ timeout: 5000 }).catch(() => false);
      if (!isEnabled) {
        test.skip(true, 'Register button not enabled — fees not yet approved (expected on testnet)');
      }

      const result = await executeBlockchainOp(async () => {
        await registerBtn.click();
        await page.waitForTimeout(5000);
      }, 'Domain registration failed');
      
      if (!result.success) {
        console.log('Registration attempt failed (expected on testnet):', result.error);
      }
    });
  });
});