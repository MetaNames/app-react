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

// Unique per run so a leftover record from an earlier run cannot satisfy the
// assertions of this one.
const RUN_ID = Date.now();
const ADDED_VALUE = `hello from e2e test ${RUN_ID}`;
const EDITED_VALUE = `edited by e2e test ${RUN_ID}`;

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
  test("step 2 — add a record via the domain settings tab", async ({
    page,
  }) => {
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
    const firstOption = page.locator('[data-testid^="select-option-"]').first();
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
    await valueTextarea.fill(ADDED_VALUE);

    // Submit and wait for the transaction to complete
    const addButton = page.locator(SELECTORS.ADD_RECORD_BUTTON);
    await expect(addButton).toBeEnabled();

    const addResult = await executeBlockchainOp(async () => {
      await addButton.click();

      // Loading state may be very brief
      await page
        .locator(`${SELECTORS.ADD_RECORD_BUTTON}:has-text("Adding...")`)
        .waitFor({ state: "visible", timeout: 5000 })
        .catch(() => {});

      // Wait for loading to finish (button stops saying "Adding...")
      await expect(addButton).not.toHaveText("Adding...", { timeout: 60000 });
    }, "Add record transaction failed");

    // The helper swallows its failure and returns it; ignoring the return value
    // let a failed transaction pass as a green test.
    expect(addResult.success, addResult.error).toBe(true);

    // The record must exist AND carry the value that was typed — a visible
    // container proves only that something rendered.
    const records = page.locator(CSS_CLASSES.RECORD_CONTAINER);
    await expect(records.first()).toBeVisible({ timeout: 30000 });
    await expect(records.first()).toContainText(ADDED_VALUE, {
      timeout: 30000,
    });
  });

  // ── Step 3: Edit record ─────────────────────────────────────────────────────
  test("step 3 — edit the record via domain settings tab", async ({ page }) => {
    test.skip(!subdomain, "Step 1 (registration) did not complete");

    await gotoAndRestoreWallet(page, `/domain/${subdomain}`);
    await waitForDomainTitle(page, subdomain);
    await navigateToSettingsTab(page);

    const recordContainer = page.locator(CSS_CLASSES.RECORD_CONTAINER).first();
    await expect(recordContainer).toBeVisible({ timeout: 10000 });

    // Enter edit mode
    const editBtn = recordContainer.locator(SELECTORS.EDIT_RECORD);
    await editBtn.click();

    const textarea = recordContainer.locator("textarea");
    await expect(textarea).toBeVisible();
    await textarea.fill(EDITED_VALUE);

    // Save
    const saveBtn = recordContainer.locator(SELECTORS.SAVE_RECORD);
    await expect(saveBtn).toBeVisible();

    const editResult = await executeBlockchainOp(async () => {
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

    expect(editResult.success, editResult.error).toBe(true);

    // This step previously ended without a single assertion on the outcome: an
    // edit that reverted on-chain still reported as a passing test.
    await expect(recordContainer).toContainText(EDITED_VALUE, {
      timeout: 30000,
    });

    // And it must survive a reload — the component resetting is not proof the
    // chain accepted the write.
    // A plain reload drops the wallet — this app persists no session — so the
    // owner-only settings tab never mounts and the re-read below timed out on
    // a page that was working exactly as designed.
    await gotoAndRestoreWallet(page, `/domain/${subdomain}`);
    await waitForDomainTitle(page, subdomain);
    await navigateToSettingsTab(page);
    await expect(
      page.locator(CSS_CLASSES.RECORD_CONTAINER).first(),
    ).toContainText(EDITED_VALUE, { timeout: 30000 });
  });

  // ── Step 4: Delete record ───────────────────────────────────────────────────
  test("step 4 — delete the record via domain settings tab", async ({
    page,
  }) => {
    test.skip(!subdomain, "Step 1 (registration) did not complete");

    await gotoAndRestoreWallet(page, `/domain/${subdomain}`);
    await waitForDomainTitle(page, subdomain);
    await navigateToSettingsTab(page);

    const recordContainer = page.locator(CSS_CLASSES.RECORD_CONTAINER).first();
    await expect(recordContainer).toBeVisible({ timeout: 10000 });

    // Open delete confirmation dialog
    const deleteBtn = recordContainer.locator(SELECTORS.DELETE_RECORD);
    await deleteBtn.click();

    const dialog = page.locator(
      '[data-slot="dialog-content"]:has-text("Confirm action")',
    );
    await expect(dialog).toBeVisible();

    const deleteResult = await executeBlockchainOp(async () => {
      await dialog.locator('button:has-text("Yes")').click();

      // Loading state may be brief
      await dialog
        .locator('button:has-text("Deleting...")')
        .waitFor({ state: "visible", timeout: 5000 })
        .catch(() => {});

      // Dialog closes after tx confirms
      await expect(dialog).not.toBeVisible({ timeout: 60000 });
    }, "Delete record transaction failed");

    expect(deleteResult.success, deleteResult.error).toBe(true);

    // Domain should now have no records. `toHaveCount` polls, so this replaces
    // a 2s sleep that was simultaneously too long for a fast chain and too
    // short for a slow one.
    await expect(page.locator(CSS_CLASSES.RECORD_CONTAINER)).toHaveCount(0, {
      timeout: 30000,
    });
  });
});
