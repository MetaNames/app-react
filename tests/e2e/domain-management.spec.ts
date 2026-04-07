import { test, expect } from "@playwright/test";
import { connectWallet, gotoAndRestoreWallet } from "./helpers/wallet-helper";
import { SELECTORS, TEXT, CSS_CLASSES, TEST_DOMAIN_NAME } from "./constants";
import {
  navigateToSettingsTab,
  expectSectionConditional,
  waitForDomainTitle,
} from "./fixtures/shared";
import { DomainPage } from "./pages/DomainPage";

test.describe("Domain Management", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await connectWallet(page);
  });

  test("non-existent domain redirects to register page", async ({ page }) => {
    const nonexistentDomain = `nonexistent${Date.now()}.mpc`;
    await page.goto(`/domain/${nonexistentDomain}`);

    await expect(page).toHaveURL(
      new RegExp(`/register/${nonexistentDomain.replace(".mpc", "")}`),
      { timeout: 10000 },
    );
  });

  test("view domain details for owned domain (test.mpc)", async ({ page }) => {
    const domainPage = new DomainPage(page);

    if (!(await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN_NAME}`))) {
      test.skip(true, "Wallet not available");
    }

    await waitForDomainTitle(page, TEST_DOMAIN_NAME);
    await expect(domainPage.avatar).toBeVisible();
    await expect(domainPage.profileSection).toBeVisible();
    await expect(domainPage.whoisSection).toBeVisible();
    await expect(domainPage.ownerChip).toBeVisible();
    await expect(domainPage.expiresChip).toBeVisible();

    // Social section only renders when domain has social records
    await expectSectionConditional(page, TEXT.SOCIAL);
  });

  test("owner sees tabs for details and settings", async ({ page }) => {
    const domainPage = new DomainPage(page);

    if (!(await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN_NAME}`))) {
      test.skip(true, "Wallet not available");
    }

    await waitForDomainTitle(page, TEST_DOMAIN_NAME);
    await expect(domainPage.tabsList).toBeVisible();
    await expect(domainPage.detailsTab).toBeVisible();
    await expect(domainPage.detailsTab).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(domainPage.settingsTab).toBeVisible();
  });

  test("owner can switch between details and settings tabs", async ({
    page,
  }) => {
    const domainPage = new DomainPage(page);

    if (!(await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN_NAME}`))) {
      test.skip(true, "Wallet not available");
    }

    await waitForDomainTitle(page, TEST_DOMAIN_NAME);

    await domainPage.switchToSettingsTab();
    await domainPage.switchToDetailsTab();
    await expect(domainPage.profileSection).toBeVisible();
  });

  test("non-owner view shows no tabs", async ({ page }) => {
    const domainPage = new DomainPage(page);

    await domainPage.goto(TEST_DOMAIN_NAME);
    await waitForDomainTitle(page, TEST_DOMAIN_NAME);

    await expect(domainPage.tabsList).not.toBeVisible();
    await expect(domainPage.profileSection).toBeVisible();
    await expect(domainPage.whoisSection).toBeVisible();
  });

  test("domain page shows profile records (Bio and Price for test.mpc)", async ({
    page,
  }) => {
    const domainPage = new DomainPage(page);

    if (!(await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN_NAME}`))) {
      test.skip(true, "Wallet not available");
    }

    await waitForDomainTitle(page, TEST_DOMAIN_NAME);
    await expect(domainPage.profileSection).toBeVisible();

    const profileChips = page.locator(CSS_CLASSES.PROFILE_CHIPS).first();
    await expect(profileChips).toBeVisible();
  });

  test("domain page shows Whois section with Owner and Expires chips", async ({
    page,
  }) => {
    const domainPage = new DomainPage(page);

    if (!(await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN_NAME}`))) {
      test.skip(true, "Wallet not available");
    }

    await waitForDomainTitle(page, TEST_DOMAIN_NAME);
    await expect(domainPage.whoisSection).toBeVisible();
    await expect(domainPage.ownerChip).toBeVisible();
    await expect(domainPage.expiresChip).toBeVisible();
  });

  test("domain page shows Social section", async ({ page }) => {
    const domainPage = new DomainPage(page);

    if (!(await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN_NAME}`))) {
      test.skip(true, "Wallet not available");
    }

    await waitForDomainTitle(page, TEST_DOMAIN_NAME);
    await domainPage.expectHasSocialSection();
  });

  test("settings tab shows Records editor and action buttons", async ({
    page,
  }) => {
    const domainPage = new DomainPage(page);

    if (!(await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN_NAME}`))) {
      test.skip(true, "Wallet not available");
    }

    await waitForDomainTitle(page, TEST_DOMAIN_NAME);

    await navigateToSettingsTab(page);

    const recordsSection = page.locator(CSS_CLASSES.RECORDS_SECTION);
    await expect(recordsSection).toBeVisible();

    const renewButton = page.locator(`button:has-text("${TEXT.RENEW}")`);
    await expect(renewButton).toBeVisible();

    const transferButton = page.locator(`button:has-text("${TEXT.TRANSFER}")`);
    await expect(transferButton).toBeVisible();
  });

  test("token id is displayed on domain page", async ({ page }) => {
    const domainPage = new DomainPage(page);

    if (!(await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN_NAME}`))) {
      test.skip(true, "Wallet not available");
    }

    await waitForDomainTitle(page, TEST_DOMAIN_NAME);
    await expect(domainPage.tokenId).toBeVisible();
  });
});
