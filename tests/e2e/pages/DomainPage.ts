/**
 * Page Object for domain detail pages (/domain/:name).
 */

import { type Page, type Locator, expect } from "@playwright/test";
import { SELECTORS, TEXT, CSS_CLASSES, URL_PATTERNS } from "../constants";

export class DomainPage {
  readonly page: Page;
  readonly urlPattern: RegExp;

  // Main elements
  readonly domainTitle: Locator;
  readonly avatar: Locator;

  // Tabs
  readonly tabsList: Locator;
  readonly detailsTab: Locator;
  readonly settingsTab: Locator;

  // Sections
  readonly profileSection: Locator;
  readonly whoisSection: Locator;
  readonly socialSection: Locator;

  // Chips
  readonly ownerChip: Locator;
  readonly expiresChip: Locator;

  // Token
  readonly tokenId: Locator;

  // Buttons
  readonly renewButton: Locator;
  readonly transferButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.urlPattern = URL_PATTERNS.DOMAIN;

    this.domainTitle = page.locator(SELECTORS.DOMAIN_TITLE);
    this.avatar = page.locator(CSS_CLASSES.AVATAR);

    this.tabsList = page.locator("role=tablist");
    this.detailsTab = page.locator(SELECTORS.TAB_DETAILS);
    this.settingsTab = page.locator(SELECTORS.TAB_SETTINGS);

    this.profileSection = page.locator(`h5:has-text("${TEXT.PROFILE}")`);
    this.whoisSection = page.locator(`h5:has-text("${TEXT.WHOIS}")`);
    this.socialSection = page.locator(`h5:has-text("${TEXT.SOCIAL}")`);

    this.ownerChip = page.getByText(/Owner/i);
    this.expiresChip = page.getByText(/Expires/i);

    this.tokenId = page.locator('p.text-muted-foreground:has-text("#")');

    this.renewButton = page.locator(`button:has-text("${TEXT.RENEW}")`);
    this.transferButton = page.locator(`button:has-text("${TEXT.TRANSFER}")`);
  }

  async goto(domain: string) {
    await this.page.goto(`/domain/${domain}`);
  }

  async waitForTitle(timeout = 10000) {
    await expect(this.domainTitle).toBeVisible({ timeout });
  }

  async expectTitleContains(domain: string) {
    await expect(this.domainTitle).toContainText(domain);
  }

  async switchToSettingsTab() {
    await this.settingsTab.click();
    await expect(this.settingsTab).toHaveAttribute("aria-selected", "true");
  }

  async switchToDetailsTab() {
    await this.detailsTab.click();
    await expect(this.detailsTab).toHaveAttribute("aria-selected", "true");
  }

  async expectOwnerView() {
    await expect(this.tabsList).toBeVisible();
    await expect(this.detailsTab).toBeVisible();
    await expect(this.settingsTab).toBeVisible();
    await expect(this.profileSection).toBeVisible();
    await expect(this.whoisSection).toBeVisible();
  }

  async expectNonOwnerView() {
    await expect(this.tabsList).not.toBeVisible();
    await expect(this.profileSection).toBeVisible();
    await expect(this.whoisSection).toBeVisible();
  }

  async expectHasSocialSection() {
    const isVisible = await this.socialSection.isVisible().catch(() => false);
    if (isVisible) {
      await expect(this.socialSection).toBeVisible();
    }
  }
}
