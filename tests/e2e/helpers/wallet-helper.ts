/**
 * Shared helper for E2E tests requiring blockchain interaction.
 * 
 * IMPORTANT: Real blockchain tests require valid testnet state and may fail due to:
 * - Network issues
 * - Insufficient gas/balance
 * - Domain ownership conflicts
 * - Testnet race conditions
 * 
 * All blockchain operations should be wrapped in try-catch.
 */

import { Page } from '@playwright/test';

// Get the testnet private key from environment
export const getTestPrivateKey = (): string => {
  const pk = process.env.TESTNET_PRIVATE_KEY;
  if (!pk) {
    throw new Error('TESTNET_PRIVATE_KEY environment variable is not set');
  }
  return pk;
};

// Shared wallet connection helper that reads from process.env.TESTNET_PRIVATE_KEY
export const connectWallet = async (page: Page): Promise<void> => {
  const privateKey = getTestPrivateKey();
  
  // Store the private key in sessionStorage before connecting
  // This allows the wallet to be restored after page reloads
  await page.evaluate((key) => {
    sessionStorage.setItem('testWalletPrivateKey', key);
  }, privateKey);
  
  // Check if already connected (try to restore first)
  const storedKey = await page.evaluate(() => sessionStorage.getItem('testWalletPrivateKey'));
  const walletConnected = await page.locator('[data-testid="wallet-connected"]').isVisible().catch(() => false);
  
  if (walletConnected) {
    // Already connected, just ensure SDK is ready
    await page.waitForTimeout(1000);
    return;
  }
  
  // Need to connect
  const connectBtn = page.locator('button:has-text("Connect")');
  await connectBtn.click();

  const devKeyInput = page.locator('input.dev-key-input');
  await devKeyInput.waitFor({ state: 'visible', timeout: 10000 });
  await devKeyInput.fill(storedKey || privateKey);

  const devConnectBtn = page.locator('button.dev-key-connect');
  await devConnectBtn.click();

  // Wait for the wallet button to show the connected address (indicates successful connection)
  await page.locator('[data-testid="wallet-connected"]').waitFor({ state: 'visible', timeout: 10000 }).catch(
    () => page.locator('button:has-text("00")').waitFor({ state: 'visible', timeout: 10000 })
  );
  
  // Brief wait for SDK to be ready
  await page.waitForTimeout(100);
};

// Helper to restore wallet connection after page reload
export const restoreWalletConnection = async (page: Page): Promise<void> => {
  const storedKey = await page.evaluate(() => sessionStorage.getItem('testWalletPrivateKey'));
  if (!storedKey) {
    console.log('No stored wallet key found, cannot restore connection');
    return;
  }
  
  // Check if already connected
  const walletConnected = await page.locator('[data-testid="wallet-connected"]').isVisible().catch(() => false);
  if (walletConnected) return;
  
  const connectBtn = page.locator('button:has-text("Connect")');
  await connectBtn.click();

  const devKeyInput = page.locator('input.dev-key-input');
  await devKeyInput.waitFor({ state: 'visible', timeout: 10000 });
  await devKeyInput.fill(storedKey);

  const devConnectBtn = page.locator('button.dev-key-connect');
  await devConnectBtn.click();

  await page.locator('[data-testid="wallet-connected"]').waitFor({ state: 'visible', timeout: 10000 }).catch(
    () => page.locator('button:has-text("00")').waitFor({ state: 'visible', timeout: 10000 })
  );
  
  await page.waitForTimeout(100);
};

// Wait for toast notification with optional timeout
export const waitForToast = async (
  page: Page, 
  text: string, 
  timeout = 10000
): Promise<void> => {
  await page.locator(`role=alert >> text=${text}`).waitFor({ timeout });
};

// Helper to safely execute blockchain operations with error handling
export const executeBlockchainOp = async <T>(
  operation: () => Promise<T>,
  errorMessage = 'Blockchain operation failed'
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`${errorMessage}: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
};

// Default test domain for blockchain operations
export const TEST_DOMAIN = 'name.mpc';

// Helper to verify wallet is connected and owns the domain by checking settings tab visibility
export const ensureDomainOwnership = async (page: Page, domainName: string): Promise<boolean> => {
  await page.goto(`/domain/${domainName}`);
  
  // Wait for domain title to load
  await page.locator('[data-testid="domain-title"]').waitFor({ state: 'visible', timeout: 10000 });
  
  // Check if settings tab is visible (indicates ownership)
  const settingsTab = page.locator('[data-testid="tab-settings"]');
  const isOwner = await settingsTab.isVisible().catch(() => false);
  
  if (!isOwner) {
    console.log(`Wallet does not own domain ${domainName}. The settings tab is not visible.`);
    console.log('This may be because:');
    console.log('1. The wallet is not properly connected');
    console.log('2. The domain is not owned by this wallet');
    console.log('3. The domain is a TLD');
  }
  
  return isOwner;
};