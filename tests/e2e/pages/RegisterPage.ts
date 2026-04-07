/**
 * Page Object for domain registration pages (/register/:name).
 */

import { type Page, type Locator, expect } from "@playwright/test";
import { SELECTORS, TEXT, CSS_CLASSES, PLACEHOLDERS } from "../constants";

export class RegisterPage {
  readonly page: Page;

  // Main elements
  readonly heading: Locator;
  readonly checkoutContent: Locator;

  // Wallet prompts
  readonly connectWalletPrompt: Locator;

  // Payment form
  readonly paymentTokenSelect: Locator;
  readonly addYearButton: Locator;
  readonly removeYearButton: Locator;
  readonly yearDisplay: Locator;
  readonly priceBreakdown: Locator;
  readonly totalPrice: Locator;
  readonly registerButton: Locator;
  readonly approveFeesButton: Locator;

  // Subdomain elements
  readonly subdomainTitle: Locator;
  readonly parentChip: Locator;
  readonly freePrice: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.locator("h2");
    this.checkoutContent = page.locator(CSS_CLASSES.CONTENT_CHECKOUT);

    this.connectWalletPrompt = page.getByText(TEXT.CONNECT_WALLET_PROMPT);

    this.paymentTokenSelect = page.locator(SELECTORS.PAYMENT_TOKEN_SELECT);
    this.addYearButton = page.locator(`button[aria-label="${TEXT.ADD_YEAR}"]`);
    this.removeYearButton = page.locator(
      `button[aria-label="${TEXT.REMOVE_YEAR}"]`,
    );
    this.yearDisplay = page.getByText(/\d+ year/).first();
    this.priceBreakdown = page.getByText(/1 year registration/);
    this.totalPrice = page.getByText("Total (excluding network fees)");
    this.registerButton = page.locator(
      `button:has-text("${TEXT.REGISTER_DOMAIN}")`,
    );
    this.approveFeesButton = page.locator(SELECTORS.APPROVE_FEES);

    this.subdomainTitle = page.locator('[data-slot="card-title"]');
    this.parentChip = page.getByText(/Parent:/);
    this.freePrice = page.getByText(/FREE/);
  }

  async goto(domain: string) {
    await this.page.goto(`/register/${domain}`);
  }

  async waitForPaymentForm(timeout = 10000) {
    await expect(this.paymentTokenSelect).toBeVisible({ timeout });
  }

  async expectWalletDisconnected() {
    await expect(this.connectWalletPrompt).toBeVisible();
    await expect(this.paymentTokenSelect).not.toBeVisible();
    await expect(this.addYearButton).not.toBeVisible();
  }

  async expectWalletConnected() {
    await expect(this.connectWalletPrompt).not.toBeVisible();
    await expect(this.paymentTokenSelect).toBeVisible();
  }

  async selectPaymentToken(token: string) {
    await this.paymentTokenSelect.click();
    const selectContent = this.page.locator('[data-slot="select-content"]');
    await expect(selectContent).toBeVisible();
    await this.page.getByText(token, { exact: false }).first().click();
  }

  async incrementYears(count = 1) {
    for (let i = 0; i < count; i++) {
      await this.addYearButton.click();
    }
  }

  async decrementYears(count = 1) {
    for (let i = 0; i < count; i++) {
      await this.removeYearButton.click();
    }
  }

  async expectYearCount(expected: number) {
    const text = expected === 1 ? `${expected} year` : `${expected} years`;
    await expect(this.yearDisplay).toContainText(text);
  }

  async expectRemoveYearDisabled() {
    await expect(this.removeYearButton).toBeDisabled();
  }

  async expectRemoveYearEnabled() {
    await expect(this.removeYearButton).toBeEnabled();
  }

  async expectSubdomainRegistration() {
    await expect(this.subdomainTitle).toBeVisible();
    await expect(this.parentChip).toBeVisible();
    await expect(this.freePrice).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }
}
