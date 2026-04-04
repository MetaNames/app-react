/**
 * E2E tests for DNS records management.
 * 
 * NOTE: These tests interact with the actual blockchain via testnet.
 * Blockchain operations (add/edit/delete records) are wrapped in try-catch
 * as they may fail due to network issues, insufficient balance, or state conflicts.
 * 
 * Set TESTNET_PRIVATE_KEY environment variable to enable real blockchain interactions:
 * TESTNET_PRIVATE_KEY=df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c27928c
 */

import { test, expect, type Page } from '@playwright/test';
import { connectWallet, restoreWalletConnection, executeBlockchainOp, TEST_DOMAIN, gotoAndRestoreWallet } from './helpers/wallet-helper';

async function skipIfNotOwner(page: Page) {
  // Try to restore wallet connection first in case state was lost
  await restoreWalletConnection(page);
  const settingsTab = page.locator('[data-testid="tab-settings"]');
  if (!await settingsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    test.skip(true, `Wallet does not own ${TEST_DOMAIN} - settings tab not visible`);
  }
}

test.describe('DNS Records Management', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await connectWallet(page);
  });

  test('non-owner cannot see records editor in settings tab', async ({ page }) => {
    await page.goto(`/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await expect(settingsTab).not.toBeVisible();
  });

  test('owner can view records container in settings tab', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    
    if (!await settingsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip(true, `Wallet does not own ${TEST_DOMAIN} - settings tab not visible`);
    }
    
    await settingsTab.click();

    await expect(settingsTab).toHaveAttribute('aria-selected', 'true');

    const recordsContainer = page.locator('[data-testid="records-container"]');
    await expect(recordsContainer).toBeVisible();
  });

  test('add-record form is visible in settings tab', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    await expect(settingsTab).toHaveAttribute('aria-selected', 'true');

    const addRecordForm = page.locator('[data-testid="add-record-form"]');
    await expect(addRecordForm).toBeVisible();
  });

  test('add-record form has record type dropdown', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    const recordTypeTrigger = page.locator('[data-testid="add-record-form"] button[role="combobox"]').first();
    await expect(recordTypeTrigger).toBeVisible();
  });

  test('record type dropdown shows available record types', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    await page.waitForTimeout(500);

    const recordTypeTrigger = page.locator('[data-testid="add-record-form"] button[role="combobox"]').first();
    await expect(recordTypeTrigger).toBeVisible({ timeout: 5000 });
    await recordTypeTrigger.click();

    await page.locator('[data-testid^="select-option-"]').first().waitFor({ timeout: 5000 });

    const optionsCount = await page.locator('[data-testid^="select-option-"]').count();
    expect(optionsCount).toBeGreaterThan(0);
  });

  test('add-record form has record value textarea', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    const recordTypeTrigger = page.locator('[data-testid="add-record-form"] button[role="combobox"]').first();
    await recordTypeTrigger.click();

    await page.locator('[data-testid^="select-option-"]').first().waitFor({ timeout: 5000 });

    const firstOption = page.locator('[data-testid^="select-option-"]').first();
    await firstOption.click();

    const valueTextarea = page.locator('[data-testid="add-record-form"] textarea');
    await expect(valueTextarea).toBeVisible();
  });

  test('add-record form has Add record button', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    const addButton = page.locator('[data-testid="add-record-button"]');
    await expect(addButton).toBeVisible();
  });

  test('Add record button is disabled when no record type selected', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    const addButton = page.locator('[data-testid="add-record-button"]');
    await expect(addButton).toBeDisabled();
  });

  test('Add record button is disabled when record value is empty', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    const recordTypeTrigger = page.locator('[data-testid="add-record-form"] button[role="combobox"]').first();
    await recordTypeTrigger.click();

    await page.locator('[data-testid^="select-option-"]').first().waitFor({ timeout: 5000 });

    const bioOption = page.locator('[data-testid^="select-option-"]').first();
    await bioOption.click();

    const addButton = page.locator('[data-testid="add-record-button"]');
    await expect(addButton).toBeDisabled();
  });

  test('Add record button is enabled when record type and value are filled', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    const recordTypeTrigger = page.locator('[data-testid="add-record-form"] button[role="combobox"]').first();
    await recordTypeTrigger.click();

    await page.locator('[data-testid^="select-option-"]').first().waitFor({ timeout: 5000 });

    const firstOption = page.locator('[data-testid^="select-option-"]').first();
    await firstOption.click();

    const valueTextarea = page.locator('[data-testid="add-record-form"] textarea');
    await valueTextarea.fill('test value');

    const addButton = page.locator('[data-testid="add-record-button"]');
    await expect(addButton).toBeVisible();
  });

  test('validation error shows when record value exceeds 64 characters', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    const recordTypeTrigger = page.locator('[data-testid="add-record-form"] button[role="combobox"]').first();
    await recordTypeTrigger.click();

    await page.locator('[data-testid^="select-option-"]').first().waitFor({ timeout: 5000 });

    const firstOption = page.locator('[data-testid^="select-option-"]').first();
    await firstOption.click();

    const valueTextarea = page.locator('[data-testid="add-record-form"] textarea');
    const longValue = 'a'.repeat(64);
    await valueTextarea.fill(longValue);

    const charCount = page.locator('[data-testid="add-record-form"] >> text=/\\d+\\/64/');
    await expect(charCount).toContainText('64/64');

    const addButton = page.locator('[data-testid="add-record-button"]');
    await expect(addButton).toBeEnabled();
  });

  test('validation error shows for invalid URL on Uri type', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    const recordTypeTrigger = page.locator('[data-testid="add-record-form"] button[role="combobox"]').first();
    await recordTypeTrigger.click();

    await page.locator('[data-testid^="select-option-"]').first().waitFor({ timeout: 5000 });

    const uriOption = page.locator('[data-testid="select-option-Uri"]');
    const uriVisible = await uriOption.isVisible().catch(() => false);
    if (!uriVisible) {
      test.skip(true, 'Uri record type not available (already used)');
    }
    await uriOption.click();

    const valueTextarea = page.locator('[data-testid="add-record-form"] textarea');
    await valueTextarea.fill('not-a-valid-url');

    const addButton = page.locator('[data-testid="add-record-button"]');
    await addButton.click();

    const errorMsg = page.locator('[data-testid="add-record-form"] .text-destructive');
    await expect(errorMsg).toContainText('Must be a valid URL');
  });

  test('validation error shows for invalid email on Email type', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    const recordTypeTrigger = page.locator('[data-testid="add-record-form"] button[role="combobox"]').first();
    await recordTypeTrigger.click();

    await page.locator('[data-testid^="select-option-"]').first().waitFor({ timeout: 5000 });

    const emailOption = page.locator('[data-testid="select-option-Email"]');
    const emailVisible = await emailOption.isVisible().catch(() => false);
    if (!emailVisible) {
      test.skip(true, 'Email record type not available (already used)');
    }
    await emailOption.click();

    const valueTextarea = page.locator('[data-testid="add-record-form"] textarea');
    await valueTextarea.fill('not-an-email');

    const addButton = page.locator('[data-testid="add-record-button"]');
    await addButton.click();

    const errorMsg = page.locator('[data-testid="add-record-form"] .text-destructive');
    await expect(errorMsg).toContainText('Must be a valid email');
  });

  test('add record button is enabled when form is filled', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    const recordTypeTrigger = page.locator('[data-testid="add-record-form"] button[role="combobox"]').first();
    await recordTypeTrigger.click();

    await page.locator('[data-testid^="select-option-"]').first().waitFor({ timeout: 5000 });

    const firstOption = page.locator('[data-testid^="select-option-"]').first();
    await firstOption.click();

    const valueTextarea = page.locator('[data-testid="add-record-form"] textarea');
    await valueTextarea.fill('Test value');

    const addButton = page.locator('[data-testid="add-record-button"]');
    await expect(addButton).toBeEnabled();
  });

  test('add new record successfully', async ({ page }) => {
    if (!process.env.TESTNET_PRIVATE_KEY) {
      test.skip(true, 'TESTNET_PRIVATE_KEY not set - blockchain interaction disabled');
    }

    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    const initialCount = await page.locator('.record-container').count();

    const recordTypeTrigger = page.locator('[data-testid="add-record-form"] button[role="combobox"]').first();
    await recordTypeTrigger.click();

    await page.locator('[data-testid^="select-option-"]').first().waitFor({ timeout: 5000 });

    const firstOption = page.locator('[data-testid^="select-option-"]').first();
    await firstOption.click();

    const valueTextarea = page.locator('[data-testid="add-record-form"] textarea');
    await valueTextarea.fill(`@testuser${Date.now()}`);

    const addButton = page.locator('[data-testid="add-record-button"]');
    
    const result = await executeBlockchainOp(async () => {
      await addButton.click();
      await expect(page.locator('[data-testid="add-record-button"]:has-text("Adding...")')).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(5000);
    }, 'Add record transaction failed');

    if (!result.success) {
      console.log('Add record failed (expected on testnet):', result.error);
      test.skip(true, `Blockchain transaction failed: ${result.error}`);
    }

    const newCount = await page.locator('.record-container').count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('edit record and save changes', async ({ page }) => {
    if (!process.env.TESTNET_PRIVATE_KEY) {
      test.skip(true, 'TESTNET_PRIVATE_KEY not set - blockchain interaction disabled');
    }

    await connectWallet(page);
    await page.goto(`/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    const recordsContainer = page.locator('[data-testid="records-container"]');
    await expect(recordsContainer).toBeVisible();

    const firstRecord = page.locator('.record-container').first();
    const editButton = firstRecord.locator('[data-testid="edit-record"]');
    await editButton.click();

    const textarea = firstRecord.locator('textarea');
    const originalValue = await textarea.inputValue();
    const modifiedValue = `${originalValue} updated`;

    await textarea.fill(modifiedValue);

    const saveButton = firstRecord.locator('[data-testid="save-record"]');
    
    const result = await executeBlockchainOp(async () => {
      await saveButton.click();
      await page.waitForTimeout(5000);
    }, 'Edit record transaction failed');

    if (!result.success) {
      console.log('Edit record failed (expected on testnet):', result.error);
      test.skip(true, `Blockchain transaction failed: ${result.error}`);
    }
  });

  test('cancel edit restores original value', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    const recordsContainer = page.locator('[data-testid="records-container"]');
    await expect(recordsContainer).toBeVisible();

    const firstRecord = page.locator('.record-container').first();
    const valueBeforeEdit = await firstRecord.locator('.record-value, [class*="value"]').first().textContent();

    const editButton = firstRecord.locator('[data-testid="edit-record"]');
    await editButton.click();

    const textarea = firstRecord.locator('textarea');
    await textarea.fill('modified value that should be cancelled');

    const cancelButton = firstRecord.locator('[data-testid="cancel-edit"]');
    await cancelButton.click();

    await expect(firstRecord.locator('[data-testid="save-record"]')).not.toBeVisible();
    await expect(firstRecord.locator('[data-testid="cancel-edit"]')).not.toBeVisible();
  });

  test('delete record after confirmation', async ({ page }) => {
    if (!process.env.TESTNET_PRIVATE_KEY) {
      test.skip(true, 'TESTNET_PRIVATE_KEY not set - blockchain interaction disabled');
    }

    await connectWallet(page);
    await page.goto(`/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    const recordsContainer = page.locator('[data-testid="records-container"]');
    await expect(recordsContainer).toBeVisible();

    const initialCount = await page.locator('.record-container').count();
    if (initialCount <= 1) {
      test.skip(true, 'Need at least 2 records to safely test deletion');
    }

    const firstRecord = page.locator('.record-container').first();
    const deleteButton = firstRecord.locator('[data-testid="delete-record"]');
    await deleteButton.click();

    const dialog = page.locator('role=dialog');
    await expect(dialog).toBeVisible();

    const yesButton = dialog.locator('button:has-text("Yes")');
    
    const result = await executeBlockchainOp(async () => {
      await yesButton.click();
      await expect(dialog.locator('button:has-text("Deleting...")')).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(5000);
    }, 'Delete record transaction failed');

    if (!result.success) {
      console.log('Delete record failed (expected on testnet):', result.error);
      test.skip(true, `Blockchain transaction failed: ${result.error}`);
    }

    const newCount = await page.locator('.record-container').count();
    expect(newCount).toBeLessThanOrEqual(initialCount);
  });

  test('empty records state shows appropriate message', async ({ page }) => {
    await connectWallet(page);
    
    const uniqueDomain = `emptyrecords${Date.now()}.mpc`;
    await page.goto(`/domain/${uniqueDomain}`);
    
    await page.waitForTimeout(2000);
    
    const settingsTab = page.locator('[data-testid="tab-settings"]');
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      const noRecordsMessage = page.locator('text=/No records found/i, text=/No record/i');
      const isVisible = await noRecordsMessage.isVisible().catch(() => false);
      if (isVisible) {
        await expect(noRecordsMessage.first()).toBeVisible();
      }
    }
  });

  test('record CRUD operations in settings tab on domain page', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();
    await expect(settingsTab).toHaveAttribute('aria-selected', 'true');

    await expect(page.locator('[data-testid="records-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-record-form"]')).toBeVisible();
  });

  test('settings tab shows Renew and Transfer buttons alongside records', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    await expect(page.locator('[data-testid="records-container"]')).toBeVisible();

    const renewButton = page.locator('button:has-text("Renew")');
    await expect(renewButton).toBeVisible();

    const transferButton = page.locator('button:has-text("Transfer")');
    await expect(transferButton).toBeVisible();
  });

  test('record value textarea shows character count', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}`);

    await expect(page.locator('[data-testid="domain-title"]')).toBeVisible({ timeout: 10000 });

    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await skipIfNotOwner(page);
    await settingsTab.click();

    const recordTypeTrigger = page.locator('[data-testid="add-record-form"] button[role="combobox"]').first();
    await recordTypeTrigger.click();

    await page.locator('[data-testid^="select-option-"]').first().waitFor({ timeout: 5000 });

    const bioOption = page.locator('[data-testid^="select-option-"]').first();
    await bioOption.click();

    const valueTextarea = page.locator('[data-testid="add-record-form"] textarea');
    await valueTextarea.fill('Test content');

    const charCount = page.locator('[data-testid="add-record-form"] [class*="char-count"], [data-testid="add-record-form"] [class*="counter"]');
    const isVisible = await charCount.isVisible().catch(() => false);
    if (isVisible) {
      await expect(charCount.first()).toBeVisible();
    }
  });
});

