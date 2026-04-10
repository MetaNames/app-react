/**
 * E2E tests for the complete record CRUD lifecycle on a freshly minted domain.
 *
 * Uses a subdomain of name.mpc (which the test wallet owns) for registration
 * because subdomain minting is free and requires only a single blockchain tx.
 *
 * Tests run in serial order:
 *   1. Register a subdomain of name.mpc (one tx, free)
 *   2. Add a record via the domain settings tab
 *   3. Edit the record via the domain settings tab
 *   4. Delete the record via the domain settings tab
 *
 * Requires TESTNET_PRIVATE_KEY env variable for all blockchain interactions.
 * Serial mode auto-skips later tests if an earlier one fails.
 */

import { test, expect } from "@playwright/test";
import {
  gotoAndRestoreWallet,
  executeBlockchainOp,
} from "./helpers/wallet-helper";
import { SELECTORS, CSS_CLASSES, TEXT } from "./constants";
import {
  navigateToSettingsTab,
  waitForDomainTitle,
  waitForDropdown,
} from "./fixtures/shared";

// The test wallet owns name.mpc; subdomains of it are free to register.
const PARENT_DOMAIN = "name.mpc";

// Shared across all serial tests — set by step 1 (registration).
let subdomain = "";

test.describe("Record CRUD lifecycle on freshly registered subdomain", () => {
  test.describe.configure({ mode: "serial" });
  // Subdomain registration is a single blockchain tx — allow up to 3 min.
  test.setTimeout(180000);

  // ── Step 1: Mint ────────────────────────────────────────────────────────────
  test("step 1 — register a subdomain of name.mpc", async ({ page }) => {
    const label = `e2ecrud${Date.now()}`;
    subdomain = `${label}.${PARENT_DOMAIN}`;

    await gotoAndRestoreWallet(page, `/register/${subdomain}`);

    // SubdomainRegistration renders a single "Register domain" button (no approve step).
    const registerBtn = page.locator(
      `button:has-text("${TEXT.REGISTER_DOMAIN}")`,
    );
    await expect(registerBtn).toBeVisible({ timeout: 15000 });

    // Confirm it shows FREE price
    const freeLabel = page.getByText(/FREE/);
    await expect(freeLabel).toBeVisible();

    const result = await executeBlockchainOp(async () => {
      await registerBtn.click();

      // Wait for redirect to the newly created domain page
      await expect(page).toHaveURL(
        new RegExp(`/domain/${label}\\.${PARENT_DOMAIN.replace(".", "\\.")}`),
        { timeout: 120000 },
      );
    }, "Subdomain registration failed");

    if (!result.success) {
      throw new Error(
        `Registration failed — subsequent steps will be skipped. Error: ${result.error}`,
      );
    }

    await waitForDomainTitle(page, subdomain);
  });

  // ── Step 2: Add record ──────────────────────────────────────────────────────
  test("step 2 — add a record via the domain settings tab", async ({ page }) => {
    test.skip(!subdomain, "Step 1 (registration) did not complete");

    await gotoAndRestoreWallet(page, `/domain/${subdomain}`);
    await waitForDomainTitle(page, subdomain);
    await navigateToSettingsTab(page);

    // Add-record form appears once the repository is ready (async) and there are available types
    const addRecordForm = page.locator(SELECTORS.ADD_RECORD_FORM);
    await expect(addRecordForm).toBeVisible({ timeout: 15000 });

    // Open the record-type dropdown
    const recordTypeTrigger = addRecordForm
      .locator('button[role="combobox"]')
      .first();
    await recordTypeTrigger.click();
    await waitForDropdown(page);

    // Prefer Bio; fall back to the first available type
    const bioOption = page.locator('[data-testid="select-option-Bio"]');
    const firstOption = page
      .locator('[data-testid^="select-option-"]')
      .first();
    const bioVisible = await bioOption
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (bioVisible) {
      await bioOption.click();
    } else {
      await firstOption.click();
    }

    // Fill in a value
    const valueTextarea = addRecordForm.locator("textarea");
    await expect(valueTextarea).toBeVisible();
    await valueTextarea.fill("hello from e2e test");

    // Submit and wait for the transaction to complete
    const addButton = page.locator(SELECTORS.ADD_RECORD_BUTTON);
    await expect(addButton).toBeEnabled();

    await executeBlockchainOp(async () => {
      await addButton.click();

      // Loading state may be very brief
      await page
        .locator(`${SELECTORS.ADD_RECORD_BUTTON}:has-text("Adding...")`)
        .waitFor({ state: "visible", timeout: 5000 })
        .catch(() => {});

      // Wait for loading to finish (button stops saying "Adding...")
      await expect(addButton).not.toHaveText("Adding...", { timeout: 60000 });
    }, "Add record transaction failed");

    // Record container must appear after tx
    await page.waitForTimeout(2000);
    const records = page.locator(CSS_CLASSES.RECORD_CONTAINER);
    await expect(records.first()).toBeVisible({ timeout: 10000 });
  });

  // ── Step 3: Edit record ─────────────────────────────────────────────────────
  test("step 3 — edit the record via domain settings tab", async ({ page }) => {
    test.skip(!subdomain, "Step 1 (registration) did not complete");

    await gotoAndRestoreWallet(page, `/domain/${subdomain}`);
    await waitForDomainTitle(page, subdomain);
    await navigateToSettingsTab(page);

    const recordContainer = page
      .locator(CSS_CLASSES.RECORD_CONTAINER)
      .first();
    await expect(recordContainer).toBeVisible({ timeout: 10000 });

    // Enter edit mode
    const editBtn = recordContainer.locator(SELECTORS.EDIT_RECORD);
    await editBtn.click();

    const textarea = recordContainer.locator("textarea");
    await expect(textarea).toBeVisible();
    await textarea.fill("edited by e2e test");

    // Save
    const saveBtn = recordContainer.locator(SELECTORS.SAVE_RECORD);
    await expect(saveBtn).toBeVisible();

    await executeBlockchainOp(async () => {
      await saveBtn.click();

      // Button disables while tx is pending
      await expect(saveBtn)
        .toBeDisabled({ timeout: 5000 })
        .catch(() => {});

      // Edit button reappears once the tx confirms and the component resets
      await expect(recordContainer.locator(SELECTORS.EDIT_RECORD)).toBeVisible({
        timeout: 60000,
      });
    }, "Edit record transaction failed");
  });

  // ── Step 4: Delete record ───────────────────────────────────────────────────
  test("step 4 — delete the record via domain settings tab", async ({ page }) => {
    test.skip(!subdomain, "Step 1 (registration) did not complete");

    await gotoAndRestoreWallet(page, `/domain/${subdomain}`);
    await waitForDomainTitle(page, subdomain);
    await navigateToSettingsTab(page);

    const recordContainer = page
      .locator(CSS_CLASSES.RECORD_CONTAINER)
      .first();
    await expect(recordContainer).toBeVisible({ timeout: 10000 });

    // Open delete confirmation dialog
    const deleteBtn = recordContainer.locator(SELECTORS.DELETE_RECORD);
    await deleteBtn.click();

    const dialog = page.locator(
      '[data-slot="dialog-content"]:has-text("Confirm action")',
    );
    await expect(dialog).toBeVisible();

    await executeBlockchainOp(async () => {
      await dialog.locator('button:has-text("Yes")').click();

      // Loading state may be brief
      await dialog
        .locator('button:has-text("Deleting...")')
        .waitFor({ state: "visible", timeout: 5000 })
        .catch(() => {});

      // Dialog closes after tx confirms
      await expect(dialog).not.toBeVisible({ timeout: 60000 });
    }, "Delete record transaction failed");

    // Domain should now have no records
    await page.waitForTimeout(2000);
    const remainingRecords = await page
      .locator(CSS_CLASSES.RECORD_CONTAINER)
      .count();
    expect(remainingRecords).toBe(0);
  });
});
