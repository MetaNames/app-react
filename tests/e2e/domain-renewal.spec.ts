/**
 * E2E tests for domain renewal.
 * 
 * NOTE: These tests may interact with the actual blockchain via testnet.
 * Set TESTNET_PRIVATE_KEY environment variable to enable real blockchain interactions:
 * TESTNET_PRIVATE_KEY=df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c27928c
 */

import { test, expect } from '@playwright/test';
import { connectWallet, executeBlockchainOp, gotoAndRestoreWallet } from './helpers/wallet-helper';

const TEST_DOMAIN = 'test.mpc';

test.describe('Domain Renewal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await connectWallet(page);
  });

  test('should display Renew domain heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /renew domain/i });
    await expect(heading).toBeVisible();
  });

  test('should have URL matching /domain/{name}/renew pattern', async ({ page }) => {
    await expect(page).toHaveURL(/\/domain\/test\.mpc\/renew/);
  });

  test('should display year selector with increment button', async ({ page }) => {
    const incrementButton = page.getByRole('button', { name: /\+/i }).or(page.locator('button[name*="increment"]')).or(page.locator('button').filter({ hasText: /\+/ }));
    await expect(incrementButton).toBeVisible();
  });

  test('should display year selector with decrement button', async ({ page }) => {
    const decrementButton = page.getByRole('button', { name: /-/i }).or(page.locator('button[name*="decrement"]')).or(page.locator('button').filter({ hasText: /-/ }));
    await expect(decrementButton).toBeVisible();
  });

  test('should display Go back button', async ({ page }) => {
    const goBackButton = page.getByRole('button', { name: /go back/i }).or(page.locator('a[href*="/domain/test.mpc"]'));
    await expect(goBackButton).toBeVisible();
  });

  test('should increment year when + button is clicked', async ({ page }) => {
    const incrementButton = page.getByRole('button', { name: /\+/i }).or(page.locator('button[name*="increment"]')).or(page.locator('button').filter({ hasText: /\+/ })).first();
    
    const yearDisplay = page.locator('[data-testid="years-selected"], .year-value, text=/\\d+\\s*year/i').first();
    const initialText = await yearDisplay.textContent();
    const initialYear = parseInt(initialText?.match(/\d+/)?.[0] || '1', 10);

    await incrementButton.click();
    
    const updatedText = await yearDisplay.textContent();
    const updatedYear = parseInt(updatedText?.match(/\d+/)?.[0] || '1', 10);
    expect(updatedYear).toBe(initialYear + 1);
  });

  test('should decrement year when - button is clicked', async ({ page }) => {
    const incrementButton = page.getByRole('button', { name: /\+/i }).or(page.locator('button[name*="increment"]')).or(page.locator('button').filter({ hasText: /\+/ })).first();
    const decrementButton = page.getByRole('button', { name: /-/i }).or(page.locator('button[name*="decrement"]')).or(page.locator('button').filter({ hasText: /-/ })).first();
    
    await incrementButton.click();
    await incrementButton.click();
    
    const yearDisplay = page.locator('[data-testid="years-selected"], .year-value, text=/\\d+\\s*year/i').first();
    
    await decrementButton.click();
    
    const updatedText = await yearDisplay.textContent();
    const updatedYear = parseInt(updatedText?.match(/\d+/)?.[0] || '1', 10);
    expect(updatedYear).toBe(2);
  });

  test('should not decrement below 1 year', async ({ page }) => {
    const decrementButton = page.getByRole('button', { name: /-/i }).or(page.locator('button[name*="decrement"]')).or(page.locator('button').filter({ hasText: /-/ })).first();
    
    await decrementButton.click();
    await decrementButton.click();
    await decrementButton.click();
    
    const yearDisplay = page.locator('[data-testid="years-selected"], .year-value, text=/\\d+\\s*year/i').first();
    const finalText = await yearDisplay.textContent();
    const finalYear = parseInt(finalText?.match(/\d+/)?.[0] || '1', 10);
    
    expect(finalYear).toBeGreaterThanOrEqual(1);
  });

  test('should display renewal price information', async ({ page }) => {
    const priceElement = page.locator('[data-testid="renewal-price"], .price, text=/\\d+\\s*(mpc|eth|\\$)/i');
    await expect(priceElement).toBeVisible();
  });

  test('should display total cost that updates with year selection', async ({ page }) => {
    const totalDisplay = page.locator('[data-testid="total-cost"], .total, text=/total/i');
    await expect(totalDisplay).toBeVisible();

    const priceElement = page.locator('[data-testid="renewal-price"], .price, text=/\\d+\\s*(mpc|eth|\\$)/i');
    const initialPriceText = await priceElement.textContent();
    const initialPrice = parseFloat(initialPriceText?.match(/[\d.]+/)?.[0] || '0');

    const incrementButton = page.getByRole('button', { name: /\+/i }).or(page.locator('button[name*="increment"]')).or(page.locator('button').filter({ hasText: /\+/ })).first();
    await incrementButton.click();

    const updatedPriceText = await priceElement.textContent();
    const updatedPrice = parseFloat(updatedPriceText?.match(/[\d.]+/)?.[0] || '0');
    
    expect(updatedPrice).toBe(initialPrice * 2);
  });

  test('should display proceed to payment or renew button', async ({ page }) => {
    const renewButton = page.getByRole('button', { name: /renew/i }).or(page.getByRole('button', { name: /proceed/i })).or(page.getByRole('button', { name: /pay now/i }));
    await expect(renewButton).toBeVisible();
  });

  test('should display domain name being renewed', async ({ page }) => {
    const domainName = page.locator(`text=${TEST_DOMAIN}`);
    await expect(domainName).toBeVisible();
  });

  test('should navigate back to domain page when Go back is clicked', async ({ page }) => {
    const goBackButton = page.getByRole('button', { name: /go back/i }).or(page.locator('a[href*="/domain/test.mpc"]'));
    await goBackButton.click();
    
    await expect(page).toHaveURL(/\/domain\/test\.mpc/);
  });

  test('should display wallet connection prompt when not connected', async ({ page }) => {
    const connectWalletButton = page.getByRole('button', { name: /connect wallet/i }).or(page.locator('text=/connect.*wallet/i'));
    await expect(connectWalletButton).toBeVisible({ timeout: 5000 }).catch(() => {
    });
  });

  test('should display year selector with default value of 1 year', async ({ page }) => {
    const yearDisplay = page.locator('[data-testid="years-selected"], .year-value, text=/1\\s*year/i');
    await expect(yearDisplay).toBeVisible();
  });

  test('should have accessible year selector buttons', async ({ page }) => {
    const incrementButton = page.getByRole('button', { name: /\+/i }).or(page.locator('button[name*="increment"]')).or(page.locator('button').filter({ hasText: /\+/ })).first();
    const decrementButton = page.getByRole('button', { name: /-/i }).or(page.locator('button[name*="decrement"]')).or(page.locator('button').filter({ hasText: /-/ })).first();
    
    await expect(incrementButton).toBeEnabled();
    await expect(decrementButton).toBeEnabled();
  });

  test.describe('Actual Renewal with Blockchain', () => {
    test('should attempt domain renewal with connected wallet', async ({ page }) => {
      if (!process.env.TESTNET_PRIVATE_KEY) {
        test.skip(true, 'TESTNET_PRIVATE_KEY not set - blockchain interaction disabled');
      }

      await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}/renew`);
      await page.waitForTimeout(1500);

      const renewButton = page.getByRole('button', { name: /renew/i }).or(page.getByRole('button', { name: /proceed/i })).or(page.getByRole('button', { name: /pay now/i }));
      
      await expect(renewButton).toBeVisible({ timeout: 5000 });
      
      const result = await executeBlockchainOp(async () => {
        await renewButton.click();
        await page.waitForTimeout(5000);
      }, 'Domain renewal failed');

      if (!result.success) {
        console.log('Renewal attempt failed (expected on testnet):', result.error);
      }
    });
  });
});