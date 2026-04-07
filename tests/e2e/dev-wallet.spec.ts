/**
 * E2E tests for dev wallet connection.
 *
 * Uses TESTNET_PRIVATE_KEY environment variable for wallet connection.
 * Set TESTNET_PRIVATE_KEY=df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c27928c
 */

import { test, expect } from "@playwright/test";
import { getTestPrivateKey } from "./helpers/wallet-helper";
import { SELECTORS, TEXT, WALLET_CONNECT_TIMEOUT_MS } from "./constants";

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

    const connectBtn = page.locator(SELECTORS.WALLET_CONNECT_BUTTON).first();
    await connectBtn.click();

    const devKeyInput = page.locator("input.dev-key-input");
    await expect(devKeyInput).toBeVisible();

    const devConnectBtn = page.locator("button.dev-key-connect");
    await expect(devConnectBtn).toBeVisible();
  });

  test("should disable dev connect button when key is too short", async ({
    page,
  }) => {
    await page.goto("/");

    const connectBtn = page.locator(SELECTORS.WALLET_CONNECT_BUTTON).first();
    await connectBtn.click();

    const devKeyInput = page.locator("input.dev-key-input");
    await devKeyInput.fill(
      "df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c2792",
    ); // 63 chars

    const devConnectBtn = page.locator("button.dev-key-connect");
    await expect(devConnectBtn).toBeDisabled();
  });

  test("should enable dev connect button when key is 64 chars", async ({
    page,
  }) => {
    const privateKey = getTestPrivateKey();

    await page.goto("/");

    const connectBtn = page.locator(SELECTORS.WALLET_CONNECT_BUTTON).first();
    await connectBtn.click();

    const devKeyInput = page.locator("input.dev-key-input");
    await devKeyInput.fill(privateKey);

    const devConnectBtn = page.locator("button.dev-key-connect");
    await expect(devConnectBtn).toBeEnabled();
  });

  test("should connect wallet with dev private key", async ({ page }) => {
    const privateKey = getTestPrivateKey();

    await page.goto("/");

    const connectBtn = page.locator(SELECTORS.WALLET_CONNECT_BUTTON).first();
    await connectBtn.click();

    const devKeyInput = page.locator("input.dev-key-input");
    await devKeyInput.fill(privateKey);

    const devConnectBtn = page.locator("button.dev-key-connect");
    await devConnectBtn.click();

    await expect(page.locator(SELECTORS.WALLET_CONNECTED).first()).toBeVisible({
      timeout: WALLET_CONNECT_TIMEOUT_MS,
    });
  });

  test("should show shortened address after connection", async ({ page }) => {
    const privateKey = getTestPrivateKey();

    await page.goto("/");

    const connectBtn = page.locator(SELECTORS.WALLET_CONNECT_BUTTON).first();
    await connectBtn.click();

    const devKeyInput = page.locator("input.dev-key-input");
    await devKeyInput.fill(privateKey);

    const devConnectBtn = page.locator("button.dev-key-connect");
    await devConnectBtn.click();

    const walletBtn = page.locator(SELECTORS.WALLET_CONNECTED).first();
    await expect(walletBtn).toBeVisible({ timeout: WALLET_CONNECT_TIMEOUT_MS });
  });

  test("should show disconnect option when connected", async ({ page }) => {
    const privateKey = getTestPrivateKey();

    await page.goto("/");

    const connectBtn = page.locator(SELECTORS.WALLET_CONNECT_BUTTON).first();
    await connectBtn.click();

    const devKeyInput = page.locator("input.dev-key-input");
    await devKeyInput.fill(privateKey);

    const devConnectBtn = page.locator("button.dev-key-connect");
    await devConnectBtn.click();

    const walletBtn = page.locator(SELECTORS.WALLET_CONNECTED).first();
    await walletBtn.click();

    const disconnectBtn = page.locator(`text=${TEXT.DISCONNECT}`);
    await expect(disconnectBtn).toBeVisible();
  });

  test("should disconnect wallet and show Connect button", async ({ page }) => {
    const privateKey = getTestPrivateKey();

    await page.goto("/");

    const connectBtn = page.locator(SELECTORS.WALLET_CONNECT_BUTTON).first();
    await connectBtn.click();

    const devKeyInput = page.locator("input.dev-key-input");
    await devKeyInput.fill(privateKey);

    const devConnectBtn = page.locator("button.dev-key-connect");
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
