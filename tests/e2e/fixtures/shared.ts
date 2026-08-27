/**
 * Shared fixtures and helpers for E2E tests.
 *
 * Centralizes common test setup, navigation patterns, and UI interactions
 * to reduce code duplication across spec files.
 */

import { type Page, type Locator, expect } from "@playwright/test";
import {
  SELECTORS,
  SPINNER_TIMEOUT_MS,
  LONG_API_TIMEOUT_MS,
  DROPDOWN_TIMEOUT_MS,
  PLACEHOLDERS,
} from "../constants";

/**
 * Navigate to domain settings tab with proper waiting.
 * Returns the settings tab locator.
 */
export async function navigateToSettingsTab(page: Page): Promise<Locator> {
  const settingsTab = page.locator(SELECTORS.TAB_SETTINGS);
  // The tab only mounts once the ownership read resolves against the chain,
  // which regularly takes longer than the 2s this used to allow.
  await settingsTab.waitFor({
    state: "visible",
    timeout: SPINNER_TIMEOUT_MS,
  });
  await settingsTab.click();
  await expect(settingsTab).toHaveAttribute("aria-selected", "true");
  return settingsTab;
}

/**
 * Wait for the loading spinner to appear and disappear.
 */
export async function waitForSpinner(page: Page, timeout = SPINNER_TIMEOUT_MS) {
  const spinner = page.locator(".animate-spin");
  await spinner.waitFor({ state: "visible", timeout });
}

/**
 * Wait for dropdown options to appear.
 */
export async function waitForDropdown(
  page: Page,
  timeout = DROPDOWN_TIMEOUT_MS,
) {
  const dropdown = page.locator('[data-slot="select-content"]');
  await dropdown.waitFor({ state: "visible", timeout });
  return dropdown;
}

/**
 * Select first option from a dropdown trigger.
 */
export async function selectFirstDropdownOption(
  page: Page,
  triggerSelector: string,
) {
  const trigger = page.locator(triggerSelector);
  await trigger.click();
  await waitForDropdown(page);
  const firstOption = page.locator('[data-testid^="select-option-"]').first();
  await expect(firstOption).toBeVisible({ timeout: DROPDOWN_TIMEOUT_MS });
  await firstOption.click();
}

/**
 * Wait until the home-page search has finished reacting to the current query:
 * the Search button reports `aria-busy="false"` and the live region holds a
 * settled outcome rather than the "Checking availability..." spinner.
 *
 * Sleeping for the debounce alone proved both too long (most lookups settle
 * sooner) and too short (a slow testnet read outlives it), so assertions that
 * followed it raced the result they were about to check.
 */
export async function waitForSearchSettled(
  page: Page,
  timeout = LONG_API_TIMEOUT_MS,
) {
  const searchButton = page.getByRole("button", {
    name: "Search",
    exact: true,
  });
  await expect(searchButton).toHaveAttribute("aria-busy", "false", { timeout });
  // Scoped to the search widget's own text: the home page carries other
  // spinners (the recent-domains ticker among them), so a global
  // `.animate-spin` count never settles at zero.
  await expect(page.getByText("Checking availability")).toHaveCount(0, {
    timeout,
  });
}

/**
 * Fill the search input and wait for the lookup it triggers to settle.
 */
export async function searchDomain(page: Page, domain: string) {
  const input = page.getByPlaceholder(PLACEHOLDERS.SEARCH_DOMAIN);
  await input.fill(domain);
  if (!domain) return;
  await waitForSearchSettled(page);
}

/**
 * Wait for the owner's domain list to resolve. The section shows a spinner
 * until the chain read returns, then either rows or an explicit empty state —
 * both are settled outcomes, and either one means the page is safe to assert
 * against. Callers used to sleep 2s and hope.
 */
export async function waitForDomainsLoaded(page: Page) {
  await expect(
    page.locator("tbody tr").or(page.getByText("No domains found")).first(),
  ).toBeVisible({ timeout: LONG_API_TIMEOUT_MS * 2 });
}

/**
 * Wait for domain title to be visible and contain expected text.
 */
export async function waitForDomainTitle(
  page: Page,
  domain: string,
  timeout = SPINNER_TIMEOUT_MS,
) {
  const title = page.locator(SELECTORS.DOMAIN_TITLE);
  await expect(title).toBeVisible({ timeout });
  await expect(title).toContainText(domain);
  return title;
}

/**
 * Skip helper for wallet-based tests.
 * Returns true if skipped.
 */
export async function skipIfWalletNotConnected(
  page: Page,
  skipMessage?: string,
): Promise<boolean> {
  const isConnected = await page
    .locator(SELECTORS.WALLET_CONNECTED)
    .isVisible()
    .catch(() => false);
  if (!isConnected) {
    console.log(skipMessage || "Wallet not connected, skipping test");
    return true;
  }
  return false;
}

/**
 * Expect a section to be visible (with optional conditional).
 */
export async function expectSectionVisible(
  page: Page,
  sectionName: string,
  required = true,
) {
  const section = page.locator(`h2:has-text("${sectionName}")`);
  if (required) {
    await expect(section).toBeVisible();
  }
  return section;
}

/**
 * Conditional section check - only asserts if visible.
 */
export async function expectSectionConditional(
  page: Page,
  sectionName: string,
) {
  const section = page.locator(`h2:has-text("${sectionName}")`);
  const isVisible = await section
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (isVisible) {
    await expect(section).toBeVisible();
  }
  return { section, isVisible };
}

/**
 * Wait for a pagination click to land. Comparing the "N of M" indicator before
 * and after is the only signal the table actually turned the page; the old
 * fixed 300ms sleep passed whether or not anything moved.
 */
export async function waitForPagination(page: Page, previousLabel?: string) {
  const indicator = page.locator("text=/\\d+ of \\d+/").first();
  await expect(indicator).toBeVisible({ timeout: SPINNER_TIMEOUT_MS });
  if (previousLabel !== undefined) {
    await expect(indicator).not.toHaveText(previousLabel, {
      timeout: SPINNER_TIMEOUT_MS,
    });
  }
  return (await indicator.textContent()) ?? "";
}

/**
 * Generate a unique test domain name.
 */
export function generateTestDomain(prefix = "test"): string {
  return `${prefix}${Date.now()}.mpc`;
}

/**
 * Generate a unique subdomain name.
 */
export function generateSubdomain(parentDomain: string): string {
  return `sub.${parentDomain}`;
}

/**
 * Delete all records of a specific type (e.g., "Uri", "Email", "Bio") if they exist.
 * Useful for ensuring a specific record type is available for testing.
 */
export async function deleteRecordTypeByName(
  page: Page,
  recordTypeName: string,
): Promise<boolean> {
  const recordSelector = `.record-container:has-text("${recordTypeName}")`;
  const records = page.locator(recordSelector);
  const count = await records.count();

  if (count === 0) {
    return false; // No records of this type to delete
  }

  for (let i = 0; i < count; i++) {
    const record = records.first();
    const deleteBtn = record.locator('[data-testid="delete-record"]');
    const deleteVisible = await deleteBtn.isVisible().catch(() => false);

    if (!deleteVisible) {
      // Need to expand the record to see delete button
      const editBtn = record.locator('[data-testid="edit-record"]');
      await editBtn.click().catch(() => {});
      await expect(deleteBtn).toBeVisible({ timeout: DROPDOWN_TIMEOUT_MS });
    }

    await deleteBtn.click();

    // Wait for confirmation dialog
    const dialog = page.locator(
      '[data-slot="dialog-content"]:has-text("Confirm action")',
    );
    const dialogVisible = await dialog
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (dialogVisible) {
      const yesBtn = dialog.locator('button:has-text("Yes")');
      await yesBtn.click();
      // The dialog stays open for the whole transaction and closes only on
      // success, so its disappearance — not a 1.5s guess — is the completion
      // signal. Without this the next iteration clicked into a stale record.
      await expect(dialog).toBeHidden({ timeout: LONG_API_TIMEOUT_MS * 4 });
      await expect(records).toHaveCount(count - i - 1, {
        timeout: LONG_API_TIMEOUT_MS,
      });
    }
  }

  return true;
}
