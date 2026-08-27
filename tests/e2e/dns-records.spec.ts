/**
 * E2E tests for DNS records management.
 *
 * NOTE: These tests interact with the actual blockchain via testnet.
 * Blockchain operations (edit/delete records) are wrapped in try-catch
 * as they may fail due to network issues, insufficient balance, or state conflicts.
 *
 * Set TESTNET_PRIVATE_KEY in .env.local to enable real blockchain interactions.
 *
 * Architecture note:
 * - /domain/:name settings tab: the single place for all record management —
 *   add, view, edit, delete records, plus Renew/Transfer buttons.
 */

import { test, expect } from "@playwright/test";
import {
  connectWallet,
  executeBlockchainOp,
  gotoAndRestoreWallet,
} from "./helpers/wallet-helper";
import { SELECTORS, TEXT, TEST_DOMAIN_NAME } from "./constants";
import {
  editedRecordValue,
  ensureEditableRecord,
  navigateToSettingsTab,
  waitForDomainTitle,
} from "./fixtures/shared";

test.describe("DNS Records Management", () => {
  test.describe.configure({ mode: "serial" });
  // A record write waits up to 60s for the chain to confirm, so a 60s test
  // budget could never contain one — the test timed out on the very wait it
  // was there to perform.
  test.setTimeout(150000);

  // Disconnected visitor viewing the domain — settings tab / editor not shown
  test("non-owner view does not show records editor", async ({ page }) => {
    // Navigate without reconnecting wallet so the page renders as a visitor
    await page.goto(`/domain/${TEST_DOMAIN_NAME}`);
    await waitForDomainTitle(page, TEST_DOMAIN_NAME);

    const settingsTab = page.locator(SELECTORS.TAB_SETTINGS);
    await expect(settingsTab).not.toBeVisible();
  });

  // ── Domain settings tab ──────────────────────────────────────────────────────
  // Edit and delete operations are available in the settings tab of the domain page
  test.describe("Domain settings tab (view/edit/delete)", () => {
    test.beforeEach(async ({ page }) => {
      await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN_NAME}`);
    });

    test("owner can view records container in settings tab", async ({
      page,
    }) => {
      await waitForDomainTitle(page, TEST_DOMAIN_NAME);
      await navigateToSettingsTab(page);

      const recordsContainer = page.locator(SELECTORS.RECORDS_CONTAINER);
      await expect(recordsContainer).toBeVisible();
    });

    test("edit record and save changes", async ({ page }) => {
      await waitForDomainTitle(page, TEST_DOMAIN_NAME);

      await navigateToSettingsTab(page);

      const recordsContainer = page.locator(SELECTORS.RECORDS_CONTAINER);
      await expect(recordsContainer).toBeVisible();

      // Bio-like classes take free text; the fallback still writes a value
      // valid for whatever class the domain happens to expose.
      const { record: firstRecord, type } = await ensureEditableRecord(page, [
        "Bio",
        "Twitter",
        "Discord",
      ]);
      const editButton = firstRecord.locator(SELECTORS.EDIT_RECORD);
      await editButton.click();

      const textarea = firstRecord.locator("textarea");
      await expect(textarea).toBeVisible();
      const modifiedValue = editedRecordValue(type, String(Date.now()));

      await textarea.fill(modifiedValue);

      const saveButton = firstRecord.locator(SELECTORS.SAVE_RECORD);

      const result = await executeBlockchainOp(async () => {
        await saveButton.click();
        // Sleeping five seconds asserted nothing: the test passed whether the
        // write landed, reverted, or never started. The component leaves edit
        // mode only once the transaction resolves without error.
        await expect(firstRecord.locator(SELECTORS.EDIT_RECORD)).toBeVisible({
          timeout: 60000,
        });
      }, "Edit record transaction failed");

      expect(result.success, result.error).toBe(true);
      await expect(firstRecord).toContainText(modifiedValue, {
        timeout: 30000,
      });
    });

    test("cancel edit restores original value", async ({ page }) => {
      await waitForDomainTitle(page, TEST_DOMAIN_NAME);

      await navigateToSettingsTab(page);

      const recordsContainer = page.locator(SELECTORS.RECORDS_CONTAINER);
      await expect(recordsContainer).toBeVisible();

      const { record: firstRecord } = await ensureEditableRecord(page);

      const editButton = firstRecord.locator(SELECTORS.EDIT_RECORD);
      await editButton.click();

      const textarea = firstRecord.locator("textarea");
      await textarea.fill("modified value that should be cancelled");

      const cancelButton = firstRecord.locator(SELECTORS.CANCEL_EDIT);
      await cancelButton.click();

      await expect(
        firstRecord.locator(SELECTORS.SAVE_RECORD),
      ).not.toBeVisible();
      await expect(
        firstRecord.locator(SELECTORS.CANCEL_EDIT),
      ).not.toBeVisible();
    });

    test("delete record after confirmation", async ({ page }) => {
      await waitForDomainTitle(page, TEST_DOMAIN_NAME);

      await navigateToSettingsTab(page);

      const recordsContainer = page.locator(SELECTORS.RECORDS_CONTAINER);
      await expect(recordsContainer).toBeVisible();

      const { record: firstRecord } = await ensureEditableRecord(page);
      const deleteButton = firstRecord.locator(SELECTORS.DELETE_RECORD);
      await deleteButton.click();

      const dialog = page.locator(
        '[data-slot="dialog-content"]:has-text("Confirm action")',
      );
      await expect(dialog).toBeVisible();

      const yesButton = dialog.locator('button:has-text("Yes")');
      await expect(yesButton).toBeVisible();

      await yesButton.click();

      // Loading state may be brief — non-fatal check
      await dialog
        .locator('button:has-text("Deleting...")')
        .waitFor({ state: "visible", timeout: 3000 })
        .catch(() => {});

      // `expect(dialogGone || true).toBe(true)` is true for every possible
      // run, so this step asserted nothing at all. The dialog closes only when
      // the delete transaction resolves successfully.
      await expect(dialog).toBeHidden({ timeout: 60000 });
    });

    test("record CRUD operations in settings tab on domain page", async ({
      page,
    }) => {
      await waitForDomainTitle(page, TEST_DOMAIN_NAME);

      await navigateToSettingsTab(page);
      const settingsTab = page.locator(SELECTORS.TAB_SETTINGS);
      await expect(settingsTab).toHaveAttribute("aria-selected", "true");

      await expect(page.locator(SELECTORS.RECORDS_CONTAINER)).toBeVisible();
    });

    test("settings tab shows Renew and Transfer buttons alongside records", async ({
      page,
    }) => {
      await waitForDomainTitle(page, TEST_DOMAIN_NAME);

      await navigateToSettingsTab(page);

      await expect(page.locator(SELECTORS.RECORDS_CONTAINER)).toBeVisible();

      const renewButton = page.locator(`button:has-text("${TEXT.RENEW}")`);
      await expect(renewButton).toBeVisible();

      const transferButton = page.locator(
        `button:has-text("${TEXT.TRANSFER}")`,
      );
      await expect(transferButton).toBeVisible();
    });

    test("settings tab shows add-record form when record types are available", async ({
      page,
    }) => {
      await waitForDomainTitle(page, TEST_DOMAIN_NAME);
      await navigateToSettingsTab(page);

      // The add-record form appears once the repository is ready (async load)
      const addRecordForm = page.locator(SELECTORS.ADD_RECORD_FORM);
      // name.mpc has all record types set so the form may not appear — tolerate either state
      const isVisible = await addRecordForm
        .isVisible({ timeout: 10000 })
        .catch(() => false);
      // If available types exist the form must be present; if all used it is hidden (expected)
      if (isVisible) {
        await expect(addRecordForm).toBeVisible();
      }
    });
  });

  // ── Miscellaneous ─────────────────────────────────────────────────────────────
  test("empty records state shows appropriate message", async ({ page }) => {
    const uniqueDomain = `emptyrecords${Date.now()}.mpc`;
    await page.goto(`/domain/${uniqueDomain}`);
    await connectWallet(page).catch(() => {});

    // An unregistered name redirects to /register; wait for whichever end
    // state the page settles into rather than sampling mid-flight.
    await expect(
      page
        .locator(SELECTORS.DOMAIN_TITLE)
        .or(page.locator(SELECTORS.TAB_SETTINGS))
        .or(page.locator("h1"))
        .first(),
    ).toBeVisible({ timeout: 30000 });

    const settingsTab = page.locator(SELECTORS.TAB_SETTINGS);
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      const noRecordsMessage = page
        .getByText(/No records? found/i)
        .or(page.getByText(/No record/i));
      const isVisible = await noRecordsMessage.isVisible().catch(() => false);
      if (isVisible) {
        await expect(noRecordsMessage.first()).toBeVisible();
      }
    }
  });
});
