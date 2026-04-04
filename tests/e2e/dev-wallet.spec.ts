/**
 * E2E tests for dev wallet connection.
 * 
 * Uses TESTNET_PRIVATE_KEY environment variable for wallet connection.
 * Set TESTNET_PRIVATE_KEY=df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c27928c
 */

import { test, expect } from '@playwright/test';
import { getTestPrivateKey } from './helpers/wallet-helper';

test.describe('Wallet Connection', () => {
  test('should show Connect button when disconnected', async ({ page }) => {
    await page.goto('/');
    
    const connectBtn = page.locator('button:has-text("Connect")');
    await expect(connectBtn).toBeVisible();
  });

  test('should open wallet dropdown menu on click', async ({ page }) => {
    await page.goto('/');
    
    const connectBtn = page.locator('button:has-text("Connect")');
    await connectBtn.click();
    
    const menu = page.locator('text=MetaMask Wallet');
    await expect(menu).toBeVisible();
    await expect(page.locator('text=Partisia Wallet')).toBeVisible();
    await expect(page.locator('text=Ledger')).toBeVisible();
  });

  test('should show dev key input in testnet', async ({ page }) => {
    await page.goto('/');
    
    const connectBtn = page.locator('button:has-text("Connect")');
    await connectBtn.click();
    
    const devKeyInput = page.locator('input.dev-key-input');
    await expect(devKeyInput).toBeVisible();
    
    const devConnectBtn = page.locator('button.dev-key-connect');
    await expect(devConnectBtn).toBeVisible();
  });

  test('should disable dev connect button when key is too short', async ({ page }) => {
    await page.goto('/');
    
    const connectBtn = page.locator('button:has-text("Connect")');
    await connectBtn.click();
    
    const devKeyInput = page.locator('input.dev-key-input');
    await devKeyInput.fill('df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c2792'); // 63 chars
    
    const devConnectBtn = page.locator('button.dev-key-connect');
    await expect(devConnectBtn).toBeDisabled();
  });

  test('should enable dev connect button when key is 64 chars', async ({ page }) => {
    const privateKey = getTestPrivateKey();
    
    await page.goto('/');
    
    const connectBtn = page.locator('button:has-text("Connect")');
    await connectBtn.click();
    
    const devKeyInput = page.locator('input.dev-key-input');
    await devKeyInput.fill(privateKey);
    
    const devConnectBtn = page.locator('button.dev-key-connect');
    await expect(devConnectBtn).toBeEnabled();
  });

  test('should connect wallet with dev private key', async ({ page }) => {
    const privateKey = getTestPrivateKey();
    
    await page.goto('/');
    
    const connectBtn = page.locator('button:has-text("Connect")');
    await connectBtn.click();
    
    const devKeyInput = page.locator('input.dev-key-input');
    await devKeyInput.fill(privateKey);
    
    const devConnectBtn = page.locator('button.dev-key-connect');
    await devConnectBtn.click();
    
    await page.waitForTimeout(1000);
    
    await expect(page.locator('button:has-text("0037")')).toBeVisible({ timeout: 10000 });
  });

  test('should show shortened address after connection', async ({ page }) => {
    const privateKey = getTestPrivateKey();
    
    await page.goto('/');
    
    const connectBtn = page.locator('button:has-text("Connect")');
    await connectBtn.click();
    
    const devKeyInput = page.locator('input.dev-key-input');
    await devKeyInput.fill(privateKey);
    
    const devConnectBtn = page.locator('button.dev-key-connect');
    await devConnectBtn.click();
    
    await page.waitForTimeout(1000);
    
    const walletBtn = page.locator('button:has-text("0037")');
    await expect(walletBtn).toBeVisible({ timeout: 10000 });
  });

  test('should show disconnect option when connected', async ({ page }) => {
    const privateKey = getTestPrivateKey();
    
    await page.goto('/');
    
    const connectBtn = page.locator('button:has-text("Connect")');
    await connectBtn.click();
    
    const devKeyInput = page.locator('input.dev-key-input');
    await devKeyInput.fill(privateKey);
    
    const devConnectBtn = page.locator('button.dev-key-connect');
    await devConnectBtn.click();
    
    await page.waitForTimeout(1000);
    
    const walletBtn = page.locator('button:has-text("0037")');
    await walletBtn.click();
    
    const disconnectBtn = page.locator('text=Disconnect');
    await expect(disconnectBtn).toBeVisible();
  });

  test('should disconnect wallet and show Connect button', async ({ page }) => {
    const privateKey = getTestPrivateKey();
    
    await page.goto('/');
    
    const connectBtn = page.locator('button:has-text("Connect")');
    await connectBtn.click();
    
    const devKeyInput = page.locator('input.dev-key-input');
    await devKeyInput.fill(privateKey);
    
    const devConnectBtn = page.locator('button.dev-key-connect');
    await devConnectBtn.click();
    
    await page.waitForTimeout(1000);
    
    const walletBtn = page.locator('button:has-text("0037")');
    await walletBtn.click();
    
    const disconnectBtn = page.locator('text=Disconnect');
    await disconnectBtn.click();
    
    await expect(page.getByRole('button', { name: 'Connect', exact: true })).toBeVisible({ timeout: 5000 });
  });
});