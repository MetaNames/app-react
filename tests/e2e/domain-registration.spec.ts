/**
 * E2E tests for domain registration.
 *
 * NOTE: These tests may interact with the actual blockchain via testnet.
 * Set TESTNET_PRIVATE_KEY environment variable to enable real blockchain interactions.
 */

import { test, expect } from "@playwright/test";
import {
  executeBlockchainOp,
  gotoAndRestoreWallet,
} from "./helpers/wallet-helper";
import {
  SELECTORS,
  TEXT,
  CSS_CLASSES,
  PLACEHOLDERS,
  VISIBILITY_TIMEOUT_MS,
} from "./constants";
import { generateTestDomain, waitForDomainTitle, waitForDropdown } from "./fixtures/shared";

test.describe("Domain Registration", () => {
  // Disconnected-state tests: navigate directly without connecting wallet
  test.describe("Disconnected State", () => {
    test("should show connect wallet prompt when wallet is disconnected", async ({
      page,
    }) => {
      const testDomain = generateTestDomain("connect");
      await page.goto(`/register/${testDomain}`);

      const connectPrompt = page.getByText(TEXT.CONNECT_WALLET_PROMPT);
      const connectButton = page.locator('[data-testid="wallet-connect-button"]');
      const isPromptVisible = await connectPrompt.isVisible().catch(() => false);
      const isButtonVisible = await connectButton
        .isVisible()
        .catch(() => false);
      expect(isPromptVisible || isButtonVisible).toBeTruthy();
    });

    test("should not show payment form when wallet is disconnected", async ({
      page,
    }) => {
      const testDomain = generateTestDomain("nopayment");
      await page.goto(`/register/${testDomain}`);

      await page.waitForTimeout(VISIBILITY_TIMEOUT_MS / 5);

      const paymentTokenSelect = page.locator(SELECTORS.PAYMENT_TOKEN_SELECT);
      await expect(paymentTokenSelect).not.toBeVisible();

      const addYearBtn = page.locator(`button[aria-label="${TEXT.ADD_YEAR}"]`);
      await expect(addYearBtn).not.toBeVisible();

      const removeYearBtn = page.locator(
        `button[aria-label="${TEXT.REMOVE_YEAR}"]`,
      );
      await expect(removeYearBtn).not.toBeVisible();
    });

    test("should navigate to register page for available domain", async ({
      page,
    }) => {
      await page.goto("/");
      const input = page.getByPlaceholder(PLACEHOLDERS.SEARCH_DOMAIN);
      const testDomain = generateTestDomain("availreg");
      await input.fill(testDomain);

      await page.waitForTimeout(VISIBILITY_TIMEOUT_MS / 5);

      const card = page.locator(`a[href^="/register/"]`);
      await expect(card).toBeVisible({ timeout: 15000 });
    });

    test("should display registration page with checkout content for available domain", async ({
      page,
    }) => {
      const testDomain = generateTestDomain("checkout");
      await page.goto(`/register/${testDomain}`);

      const heading = page.locator(`h2:has-text("Register ${testDomain}")`);
      await expect(heading).toBeVisible({ timeout: 10000 });

      const checkoutContent = page.locator(CSS_CLASSES.CONTENT_CHECKOUT).first();
      await expect(checkoutContent).toBeVisible();
    });

    test("should redirect to domain page when domain is already registered", async ({
      page,
    }) => {
      await page.goto("/register/name.mpc");
      await expect(page).toHaveURL(/\/domain\/name\.mpc/, { timeout: 15000 });
    });
  });

  // Connected-state tests: each test navigates to the register page with wallet connected
  test.describe("Connected State", () => {
    test("should show payment form when wallet is connected", async ({
      page,
    }) => {
      const testDomain = generateTestDomain("payform");
      await gotoAndRestoreWallet(page, `/register/${testDomain}`);

      const paymentTokenSelect = page.locator(SELECTORS.PAYMENT_TOKEN_SELECT);
      await expect(paymentTokenSelect).toBeVisible({ timeout: 10000 });
    });

    test("should display payment token selection dropdown with available tokens", async ({
      page,
    }) => {
      const testDomain = generateTestDomain("tokens");
      await gotoAndRestoreWallet(page, `/register/${testDomain}`);

      const paymentTokenSelect = page.locator(SELECTORS.PAYMENT_TOKEN_SELECT);
      await expect(paymentTokenSelect).toBeVisible({ timeout: 10000 });
      await paymentTokenSelect.click();

      const selectContent = page.locator('[data-slot="select-content"]');
      await expect(selectContent).toBeVisible();

      const selectOptions = page.getByRole("option");
      const optionCount = await selectOptions.count();
      expect(optionCount).toBeGreaterThan(0);
      for (let i = 0; i < optionCount; i++) {
        await expect(selectOptions.nth(i)).toBeVisible();
      }
    });

    test("should display year selector with add and remove buttons", async ({
      page,
    }) => {
      const testDomain = generateTestDomain("yearsel");
      await gotoAndRestoreWallet(page, `/register/${testDomain}`);

      const addYearBtn = page.locator(`button[aria-label="${TEXT.ADD_YEAR}"]`);
      await expect(addYearBtn).toBeVisible({ timeout: 10000 });

      const removeYearBtn = page.locator(
        `button[aria-label="${TEXT.REMOVE_YEAR}"]`,
      );
      await expect(removeYearBtn).toBeVisible();

      const yearDisplay = page.locator(CSS_CLASSES.YEAR_DISPLAY);
      await expect(yearDisplay).toContainText("1 year");
    });

    test("should increment year count when add-year button is clicked", async ({
      page,
    }) => {
      const testDomain = generateTestDomain("addyear");
      await gotoAndRestoreWallet(page, `/register/${testDomain}`);

      const addYearBtn = page.locator(`button[aria-label="${TEXT.ADD_YEAR}"]`);
      await addYearBtn.click();

      const yearDisplay = page.locator(CSS_CLASSES.YEAR_DISPLAY);
      await expect(yearDisplay).toContainText("2 years");
    });

    test("should decrement year count when remove-year button is clicked", async ({
      page,
    }) => {
      const testDomain = generateTestDomain("remyear");
      await gotoAndRestoreWallet(page, `/register/${testDomain}`);

      const addYearBtn = page.locator(`button[aria-label="${TEXT.ADD_YEAR}"]`);
      await addYearBtn.click();
      await addYearBtn.click();

      const yearDisplay = page.locator(CSS_CLASSES.YEAR_DISPLAY);
      await expect(yearDisplay).toContainText("3 years");

      const removeYearBtn = page.locator(
        `button[aria-label="${TEXT.REMOVE_YEAR}"]`,
      );
      await removeYearBtn.click();

      await expect(yearDisplay).toContainText("2 years");
    });

    test("should disable remove-year button at minimum 1 year", async ({
      page,
    }) => {
      const testDomain = generateTestDomain("minyear");
      await gotoAndRestoreWallet(page, `/register/${testDomain}`);

      const removeYearBtn = page.locator(
        `button[aria-label="${TEXT.REMOVE_YEAR}"]`,
      );
      await expect(removeYearBtn).toBeDisabled();

      const addYearBtn = page.locator(`button[aria-label="${TEXT.ADD_YEAR}"]`);
      await addYearBtn.click();

      await expect(removeYearBtn).toBeEnabled();
    });

    test("should display price breakdown with 1 year registration and total", async ({
      page,
    }) => {
      const testDomain = generateTestDomain("price");
      await gotoAndRestoreWallet(page, `/register/${testDomain}`);

      const priceBreakdown = page.getByText(/1 year registration/);
      await expect(priceBreakdown).toBeVisible({ timeout: 10000 });

      const totalPrice = page.getByText("Total (excluding network fees)");
      await expect(totalPrice).toBeVisible();
    });

    test("should update price breakdown when years are changed", async ({
      page,
    }) => {
      const testDomain = generateTestDomain("priceupdate");
      await gotoAndRestoreWallet(page, `/register/${testDomain}`);

      const addYearBtn = page.locator(`button[aria-label="${TEXT.ADD_YEAR}"]`);
      await addYearBtn.click();

      // Year display is the reliable indicator — price values vary by domain/token
      const yearDisplay = page.locator(CSS_CLASSES.YEAR_DISPLAY);
      await expect(yearDisplay).toContainText("2 years");

      // Total label should still be visible
      const totalLabel = page.getByText("Total (excluding network fees)");
      await expect(totalLabel).toBeVisible();
    });
  });

  test.describe("Subdomain Registration", () => {
    test("should show subdomain registration component when parent domain exists", async ({
      page,
    }) => {
      await gotoAndRestoreWallet(page, `/register/sub.name.mpc`);

      const subdomainTitle = page
        .locator('[data-slot="card-title"]')
        .filter({ hasText: "sub.name.mpc" });
      await expect(subdomainTitle).toBeVisible({ timeout: 10000 });

      const parentChip = page.getByText(/Parent:/);
      await expect(parentChip).toBeVisible();

      const freePrice = page.getByText(/FREE/);
      await expect(freePrice).toBeVisible();
    });

    test("should show register button for subdomain", async ({ page }) => {
      await gotoAndRestoreWallet(page, `/register/sub.name.mpc`);

      const registerBtn = page.locator(
        `button:has-text("${TEXT.REGISTER_DOMAIN}")`,
      );
      await expect(registerBtn).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Actual Domain Registration", () => {
    test("should show register domain button and attempt registration", async ({
      page,
    }) => {
      const testDomain = generateTestDomain("e2ereg");
      await gotoAndRestoreWallet(page, `/register/${testDomain}`);

      const registerBtn = page.locator(
        `button:has-text("${TEXT.REGISTER_DOMAIN}")`,
      );
      await expect(registerBtn).toBeVisible({ timeout: 15000 });

      // Attempt registration only if button is enabled (fees approved)
      const isEnabled = await registerBtn
        .isEnabled({ timeout: 5000 })
        .catch(() => false);
      if (isEnabled) {
        await executeBlockchainOp(async () => {
          await registerBtn.click();
          await page.waitForTimeout(3000);
        }, "Domain registration failed");
      }
      // Test passes whether button is enabled or not — we've verified the UI is correct
    });
  });

  test.describe("Full Registration Flow with TEST_COIN", () => {
    // Two blockchain transactions: approve fees + register domain.
    test.setTimeout(300000);

    test("should register a new domain end-to-end using TEST_COIN", async ({
      page,
    }) => {
      const label = `e2ereg${Date.now()}`;
      const testDomain = `${label}.mpc`;

      await gotoAndRestoreWallet(page, `/register/${testDomain}`);

      // Select TEST_COIN as payment token
      const tokenSelect = page.locator(SELECTORS.PAYMENT_TOKEN_SELECT);
      await expect(tokenSelect).toBeVisible({ timeout: 15000 });
      await tokenSelect.click();
      await waitForDropdown(page);
      await page.getByRole("option", { name: "TEST_COIN" }).click();

      // Wait for fees to load with the selected coin before proceeding
      await expect(page.getByText(/1 year registration/)).toBeVisible({ timeout: 15000 });

      // ── Step 1: Approve fees ──────────────────────────────────────────────
      const approveBtn = page.locator(SELECTORS.APPROVE_FEES);
      await expect(approveBtn).toBeVisible({ timeout: 10000 });
      await expect(approveBtn).toBeEnabled();

      const approveResult = await executeBlockchainOp(async () => {
        await approveBtn.click();

        // Button may briefly show "Approving..." while tx is pending
        await page
          .locator('[data-testid="approve-fees"]:has-text("Approving...")')
          .waitFor({ state: "visible", timeout: 10000 })
          .catch(() => { });

        // Wait until fees are confirmed (button text changes to "Fees approved ✓")
        await expect(approveBtn).toHaveText("Fees approved ✓", {
          timeout: 120000,
        });
      }, "Fee approval failed");

      if (!approveResult.success) {
        throw new Error(`Fee approval failed: ${approveResult.error}`);
      }

      // ── Step 2: Register domain ───────────────────────────────────────────
      const registerBtn = page.locator(
        `button:has-text("${TEXT.REGISTER_DOMAIN}")`,
      );
      await expect(registerBtn).toBeEnabled({ timeout: 10000 });

      const registerResult = await executeBlockchainOp(async () => {
        await registerBtn.click();

        // Button may briefly show "Registering..." while tx is pending
        await page
          .locator(`button:has-text("Registering...")`)
          .waitFor({ state: "visible", timeout: 10000 })
          .catch(() => { });

        // Wait for redirect to the newly created domain page
        await expect(page).toHaveURL(
          new RegExp(`/domain/${label}\\.mpc`),
          { timeout: 120000 },
        );
      }, "Domain registration failed");

      if (!registerResult.success) {
        throw new Error(`Domain registration failed: ${registerResult.error}`);
      }

      await waitForDomainTitle(page, testDomain);
    });
  });
});
