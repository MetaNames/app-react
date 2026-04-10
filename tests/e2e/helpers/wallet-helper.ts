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

import { Page, expect } from "@playwright/test";
import { log } from "console";

// Get the testnet private key from environment
export const getTestPrivateKey = (): string => {
  const pk = process.env.TESTNET_PRIVATE_KEY;
  if (!pk) {
    throw new Error("TESTNET_PRIVATE_KEY environment variable is not set");
  }
  return pk;
};

// Shared wallet connection helper that reads from process.env.TESTNET_PRIVATE_KEY
// Returns true if connected, false if SDK not ready (caller should skip test)
// No sessionStorage persistence - wallet must be reconnected on each page reload
export const connectWallet = async (page: Page): Promise<boolean> => {
  const privateKey = getTestPrivateKey();

  // Check if already connected
  const walletConnected = await page
    .locator('[data-testid="wallet-connected"]')
    .first()
    .isVisible()
    .catch(() => false);
  if (walletConnected) return true;

  const connectBtn = page
    .locator('[data-testid="wallet-connect-button"]')
    .first();
  await connectBtn.waitFor({ state: "visible", timeout: 15000 });
  await connectBtn.click();

  const devKeyInput = page.locator('[data-testid="dev-key-input"]');
  const walletConnectedEl = page.locator('[data-testid="wallet-connected"]');

  const winner = await Promise.race([
    devKeyInput
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => "devKey"),
    walletConnectedEl
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => "connected"),
  ]);

  if (winner === "connected") {
    return true;
  }

  await devKeyInput.fill(privateKey);

  const devConnectBtn = page.locator('[data-testid="dev-key-connect-button"]');
  await devConnectBtn.waitFor({ state: "visible", timeout: 5000 });
  await expect(devConnectBtn).toBeEnabled({ timeout: 5000 });
  await devConnectBtn.click();

  await walletConnectedEl.waitFor({ state: "visible", timeout: 10000 });

  return true;
};

// Helper to check if wallet is actually connected and ready
export const isWalletConnected = async (page: Page): Promise<boolean> => {
  try {
    const isVisible = await page
      .locator('[data-testid="wallet-connected"]')
      .isVisible()
      .catch(() => false);
    return isVisible;
  } catch {
    return false;
  }
};

// Navigate to a page and ensure wallet is connected
// Clears any persisted wallet state for clean reconnect on each navigation
// Returns true if wallet connected, false if failed
export const gotoAndRestoreWallet = async (
  page: Page,
  url: string,
): Promise<boolean> => {
  await page.goto(url);
  return await connectWallet(page);
};

// Wait for dropdown options to appear with proper timing
export const waitForDropdownOptions = async (
  page: Page,
  timeout = 5000,
): Promise<boolean> => {
  const selectContent = page.locator('[data-slot="select-content"]').last();
  try {
    await selectContent.waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
};

// Wait for toast notification with optional timeout
export const waitForToast = async (
  page: Page,
  text: string,
  timeout = 10000,
): Promise<void> => {
  try {
    await page.locator(`role=alert >> text=${text}`).waitFor({ timeout });
  } catch {
    throw new Error(`Toast with text "${text}" not found within ${timeout}ms`);
  }
};

// Helper to safely execute blockchain operations with error handling
export const executeBlockchainOp = async <T>(
  operation: () => Promise<T>,
  errorMessage = "Blockchain operation failed",
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
export const TEST_DOMAIN = "name.mpc";

// Helper to verify wallet is connected and owns the domain by checking settings tab visibility
export const ensureDomainOwnership = async (
  page: Page,
  domainName: string,
): Promise<boolean> => {
  await page.goto(`/domain/${domainName}`);

  // Wait for domain title to load
  await page
    .locator('[data-testid="domain-title"]')
    .waitFor({ state: "visible", timeout: 10000 });

  // Check if settings tab is visible (indicates ownership)
  const settingsTab = page.locator('[data-testid="tab-settings"]');
  const isOwner = await settingsTab.isVisible().catch(() => false);

  if (!isOwner) {
    console.log(
      `Wallet does not own domain ${domainName}. The settings tab is not visible.`,
    );
    console.log("This may be because:");
    console.log("1. The wallet is not properly connected");
    console.log("2. The domain is not owned by this wallet");
    console.log("3. The domain is a TLD");
  }

  return isOwner;
};
