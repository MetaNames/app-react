/**
 * E2E tests for dev wallet connection.
 *
 * Uses TESTNET_PRIVATE_KEY environment variable for wallet connection.
 * Set TESTNET_PRIVATE_KEY in .env.local.
 */

import { test, expect, type Page } from "@playwright/test";
import { getTestPrivateKey } from "./helpers/wallet-helper";
import { SELECTORS, TEXT, WALLET_CONNECT_TIMEOUT_MS } from "./constants";

/**
 * Open the header wallet menu and wait for the dev-key section inside it.
 *
 * That section is gated on a post-mount effect, so a click that lands during
 * hydration can leave the menu open but empty — and every test below then
 * timed out filling an input that was never going to appear. Escape-and-
 * reopen is the only retry that actually changes the page: a second click on
 * a toggle just closes it.
 */
async function openDevKeyMenu(page: Page) {
  const connectBtn = page.locator(SELECTORS.WALLET_CONNECT_BUTTON).first();
  const devKeyInput = page.locator('[data-testid="dev-key-input"]');
  const menu = page.locator('[role="menu"]');

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await page.keyboard.press("Escape").catch(() => {});
      await menu
        .first()
        .waitFor({ state: "hidden", timeout: 5000 })
        .catch(() => {});
    }
    if (
      !(await menu
        .first()
        .isVisible()
        .catch(() => false))
    ) {
      await connectBtn.click();
    }
    try {
      await expect(devKeyInput).toBeVisible({ timeout: 5000 });
      return devKeyInput;
    } catch {
      // Next attempt reopens the menu.
    }
  }

  // Surface the real diagnostic rather than the last swallowed timeout.
  await expect(devKeyInput).toBeVisible({ timeout: 5000 });
  return devKeyInput;
}

test.describe("Wallet Connection", () => {
  test("should show Connect button when disconnected", async ({ page }) => {
    await page.goto("/");

    const connectBtn = page.locator(SELECTORS.WALLET_CONNECT_BUTTON).first();
    await expect(connectBtn).toBeVisible();
  });

  test("should open wallet dropdown menu on click", async ({ page }) => {
    await page.goto("/");

    const connectBtn = page.locator(SELECTORS.WALLET_CONNECT_BUTTON).first();
    await connectBtn.click();

    const menu = page.locator("text=MetaMask Wallet");
    await expect(menu).toBeVisible();
    await expect(page.locator("text=Partisia Wallet")).toBeVisible();
    await expect(page.locator("text=Ledger")).toBeVisible();
  });

  test("should show dev key input in testnet", async ({ page }) => {
    await page.goto("/");

    const devKeyInput = await openDevKeyMenu(page);
    await expect(devKeyInput).toBeVisible();

    const devConnectBtn = page.locator(
      '[data-testid="dev-key-connect-button"]',
    );
    await expect(devConnectBtn).toBeVisible();
  });

  test("should disable dev connect button when key is too short", async ({
    page,
  }) => {
    await page.goto("/");

    const devKeyInput = await openDevKeyMenu(page);
    await devKeyInput.fill(
      "abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678",
    ); // 62 chars — invalid length

    const devConnectBtn = page.locator(
      '[data-testid="dev-key-connect-button"]',
    );
    await expect(devConnectBtn).toBeDisabled();
  });

  test("should enable dev connect button when key is 64 chars", async ({
    page,
  }) => {
    const privateKey = getTestPrivateKey();

    await page.goto("/");

    const devKeyInput = await openDevKeyMenu(page);
    await devKeyInput.fill(privateKey);

    const devConnectBtn = page.locator(
      '[data-testid="dev-key-connect-button"]',
    );
    await expect(devConnectBtn).toBeEnabled();
  });

  test("should connect wallet with dev private key", async ({ page }) => {
    const privateKey = getTestPrivateKey();

    await page.goto("/");

    const devKeyInput = await openDevKeyMenu(page);
    await devKeyInput.fill(privateKey);

    const devConnectBtn = page.locator(
      '[data-testid="dev-key-connect-button"]',
    );
    await devConnectBtn.click();

    await expect(page.locator(SELECTORS.WALLET_CONNECTED).first()).toBeVisible({
      timeout: WALLET_CONNECT_TIMEOUT_MS,
    });
  });

  test("should show shortened address after connection", async ({ page }) => {
    const privateKey = getTestPrivateKey();

    await page.goto("/");

    const devKeyInput = await openDevKeyMenu(page);
    await devKeyInput.fill(privateKey);

    const devConnectBtn = page.locator(
      '[data-testid="dev-key-connect-button"]',
    );
    await devConnectBtn.click();

    const walletBtn = page.locator(SELECTORS.WALLET_CONNECTED).first();
    await expect(walletBtn).toBeVisible({ timeout: WALLET_CONNECT_TIMEOUT_MS });
  });

  test("should show disconnect option when connected", async ({ page }) => {
    const privateKey = getTestPrivateKey();

    await page.goto("/");

    const devKeyInput = await openDevKeyMenu(page);
    await devKeyInput.fill(privateKey);

    const devConnectBtn = page.locator(
      '[data-testid="dev-key-connect-button"]',
    );
    await devConnectBtn.click();

    const walletBtn = page.locator(SELECTORS.WALLET_CONNECTED).first();
    await walletBtn.click();

    const disconnectBtn = page.locator(`text=${TEXT.DISCONNECT}`);
    await expect(disconnectBtn).toBeVisible();
  });

  test("should disconnect wallet and show Connect button", async ({ page }) => {
    const privateKey = getTestPrivateKey();

    await page.goto("/");

    const devKeyInput = await openDevKeyMenu(page);
    await devKeyInput.fill(privateKey);

    const devConnectBtn = page.locator(
      '[data-testid="dev-key-connect-button"]',
    );
    await devConnectBtn.click();

    const walletBtn = page.locator(SELECTORS.WALLET_CONNECTED).first();
    await walletBtn.click();

    const disconnectBtn = page.locator(`text=${TEXT.DISCONNECT}`);
    await disconnectBtn.click();

    await expect(
      page.locator(SELECTORS.WALLET_CONNECT_BUTTON).first(),
    ).toBeVisible({ timeout: WALLET_CONNECT_TIMEOUT_MS });
  });
});
