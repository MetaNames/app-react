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
// Five short attempts rather than three long ones: what these retries wait out
// is hydration, which either has happened or has not — a longer single window
// buys nothing, while more windows cover the page that hydrates late.
const CONNECT_ATTEMPTS = 5;
// A click that lands before hydration needs the dialog re-opening, so each
// attempt gets a window of its own. Three of them plus the close waits still
// has to fit inside a spec's whole budget alongside navigation and the chain
// reads that follow; at 10s each it did not, and a hook killed mid-retry
// reported as "the wallet never connected" rather than as the timeout it was.
// Hydration settles far inside 6s — the retries are for the render that misses
// it, not for a slow one.
const CONNECT_ATTEMPT_TIMEOUT_MS = 5000;
const MENU_CLOSE_TIMEOUT_MS = 2000;

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

  // Opened from the keyboard, not with a click. The trigger toggles on the
  // pointer-down half of a click, so a click that arrives while the menu is
  // mid-open toggles it straight back shut — the failure looked like "the menu
  // never opened" and no amount of clicking fixed it, because every retry could
  // lose the same race. Enter on a focused trigger opens once, deterministically.
  //
  // The retry that remains is for the pre-hydration window, where the key press
  // reaches a button with no handler yet. Each attempt closes whatever state the
  // last one left behind before trying again.
  const devKeyInput = page.locator('[data-testid="dev-key-input"]');
  const menu = page.locator('[role="menu"]');

  let winner: "devKey" | "connected" | null = null;
  for (let attempt = 0; attempt < CONNECT_ATTEMPTS && !winner; attempt++) {
    if (attempt > 0) {
      await page.keyboard.press("Escape").catch(() => {});
      await menu
        .first()
        .waitFor({ state: "hidden", timeout: MENU_CLOSE_TIMEOUT_MS })
        .catch(() => {});
    }
    const menuOpen = await menu
      .first()
      .isVisible()
      .catch(() => false);
    if (!menuOpen) {
      await connectBtn.focus();
      await page.keyboard.press("Enter");
    }
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
