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

import { Locator, Page, expect } from "@playwright/test";

// One budget for every step of the connect handshake. The old helper mixed
// 5s, 10s and 15s waits, so which step timed out depended on how loaded the
// testnet was rather than on what was actually broken.
const CONNECT_TIMEOUT_MS = 15000;
const CONNECT_ATTEMPTS = 3;
// A click lands before the SDK finishes initialising often enough that the
// dialog needs re-opening, so each attempt gets a full window of its own
// rather than a third of one — a loaded testnet took longer than 5s to open
// the dialog and the helper gave up while it was still coming.
const CONNECT_ATTEMPT_TIMEOUT_MS = 10000;

// Get the testnet private key from environment
export const getTestPrivateKey = (): string => {
  const pk = process.env.TESTNET_PRIVATE_KEY;
  if (!pk) {
    throw new Error("TESTNET_PRIVATE_KEY environment variable is not set");
  }
  return pk;
};

/**
 * Resolve as soon as one of the locators becomes visible, without ever
 * rejecting. `Promise.race` over two `waitFor` calls loses whichever branch
 * has the shorter timeout: the loser rejects first and takes the race down
 * with it even though the other element was about to appear. Both branches
 * here share one deadline and swallow their own timeout, so the race settles
 * on the first *success* and returns null only when neither ever showed.
 */
const firstVisible = async <K extends string>(
  candidates: Record<K, Locator>,
  timeout: number,
): Promise<K | null> => {
  const attempts = (Object.entries(candidates) as [K, Locator][]).map(
    ([key, locator]) =>
      locator
        .waitFor({ state: "visible", timeout })
        .then(() => key)
        .catch(() => null),
  );

  // A branch that resolves null must not win the race ahead of a branch still
  // waiting, so a failed branch is parked forever and only the all-settled
  // guard can produce the null result.
  return Promise.race([
    ...attempts.map((attempt) =>
      attempt.then((key) => key ?? new Promise<never>(() => {})),
    ),
    Promise.all(attempts).then(() => null),
  ]);
};

// Shared wallet connection helper that reads from process.env.TESTNET_PRIVATE_KEY
// No sessionStorage persistence - wallet must be reconnected on each page reload
export const connectWallet = async (page: Page): Promise<boolean> => {
  const privateKey = getTestPrivateKey();

  const walletConnectedEl = page
    .locator('[data-testid="wallet-connected"]')
    .first();

  // Check if already connected
  const walletConnected = await walletConnectedEl
    .isVisible()
    .catch(() => false);
  if (walletConnected) return true;

  const connectBtn = page
    .locator('[data-testid="wallet-connect-button"]')
    .first();
  await connectBtn.waitFor({ state: "visible", timeout: CONNECT_TIMEOUT_MS });

  // The button mounts before the SDK finishes initialising; clicking in that
  // window opens nothing and the test then waits out its whole budget on a
  // dialog that was never asked for. Retrying the click costs one second and
  // removes the single largest source of flake in this suite.
  const devKeyInput = page.locator('[data-testid="dev-key-input"]');

  let winner: "devKey" | "connected" | null = null;
  for (let attempt = 0; attempt < CONNECT_ATTEMPTS && !winner; attempt++) {
    await connectBtn.click();
    winner = await firstVisible(
      { devKey: devKeyInput, connected: walletConnectedEl },
      CONNECT_ATTEMPT_TIMEOUT_MS,
    );
  }

  if (winner === null) {
    throw new Error(
      `Wallet connect opened neither the dev-key dialog nor a connected state after ${CONNECT_ATTEMPTS} attempts`,
    );
  }

  if (winner === "connected") return true;

  await devKeyInput.fill(privateKey);

  const devConnectBtn = page.locator('[data-testid="dev-key-connect-button"]');
  await expect(devConnectBtn).toBeEnabled({ timeout: CONNECT_TIMEOUT_MS });
  await devConnectBtn.click();

  await walletConnectedEl.waitFor({
    state: "visible",
    timeout: CONNECT_TIMEOUT_MS,
  });

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
  // `role=alert >> text=<value>` breaks on any value containing a quote or a
  // `>>`; a filter passes the string through as data instead of selector
  // syntax. Sonner also stacks toasts, so match any of them, not the first.
  const toast = page.getByRole("alert").filter({ hasText: text });
  await expect(toast.first()).toBeVisible({ timeout });
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

  // Check if settings tab is visible (indicates ownership). The tab renders
  // only after the owner read resolves, which lands after the title — polling
  // once immediately reports "not owner" for a domain the wallet does own.
  const settingsTab = page.locator('[data-testid="tab-settings"]');
  const isOwner = await settingsTab
    .waitFor({ state: "visible", timeout: 10000 })
    .then(() => true)
    .catch(() => false);

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
