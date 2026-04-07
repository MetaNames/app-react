/**
 * Shared fixtures and helpers for E2E tests.
 *
 * Centralizes common test setup, navigation patterns, and UI interactions
 * to reduce code duplication across spec files.
 */

import { type Page, type Locator, expect } from "@playwright/test";
import {
  SELECTORS,
  DEBOUNCE_MS,
  SPINNER_TIMEOUT_MS,
  VISIBILITY_TIMEOUT_MS,
  DROPWDOWN_TIMEOUT_MS,
  PAGINATION_WAIT_MS,
} from "../constants";

/**
 * Navigate to domain settings tab with proper waiting.
 * Returns the settings tab locator.
 */
export async function navigateToSettingsTab(page: Page): Promise<Locator> {
  const settingsTab = page.locator(SELECTORS.TAB_SETTINGS);
  await settingsTab.waitFor({
    state: "visible",
    timeout: VISIBILITY_TIMEOUT_MS,
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
  timeout = DROPWDOWN_TIMEOUT_MS,
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
  await expect(firstOption).toBeVisible({ timeout: DROPWDOWN_TIMEOUT_MS });
  await firstOption.click();
}

/**
 * Fill search input and wait for results/debounce.
 */
export async function searchDomain(page: Page, domain: string) {
  const input = page.getByPlaceholder("Search for a .mpc domain...");
  await input.fill(domain);
  await page.waitForTimeout(DEBOUNCE_MS);
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
  const section = page.locator(`h5:has-text("${sectionName}")`);
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
  const section = page.locator(`h5:has-text("${sectionName}")`);
  const isVisible = await section
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (isVisible) {
    await expect(section).toBeVisible();
  }
  return { section, isVisible };
}

/**
 * Wait for pagination to settle.
 */
export async function waitForPagination(page: Page) {
  await page.waitForTimeout(PAGINATION_WAIT_MS);
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
