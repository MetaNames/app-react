import { test, expect } from '@playwright/test';
import { SELECTORS, TEXT, CSS_CLASSES, VALID_ADDRESS, INVALID_ADDRESS_SHORT, TEST_DOMAIN_NAME, PLACEHOLDERS } from './constants';
import { connectWallet, gotoAndRestoreWallet } from './helpers/wallet-helper';

test.describe('Domain Transfer', () => {
  test.describe('with wallet connected', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await connectWallet(page);
      if (!await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN_NAME}/transfer`)) {
        test.skip(true, 'Wallet not available');
      }
    });

    test('should display transfer page with all elements', async ({ page }) => {
      const heading = page.locator(`h2:has-text("${TEXT.TRANSFER_HEADING}")`);
      await expect(heading).toBeVisible();

      const domainName = page.locator(`h4:has-text("${TEST_DOMAIN_NAME}")`);
      await expect(domainName).toBeVisible();

      const warningDiv = page.locator(CSS_CLASSES.WARNING_DIV);
      await expect(warningDiv.locator('strong:has-text("Please note that all transfers are irreversible.")')).toBeVisible();
      await expect(warningDiv.locator('strong:has-text("Verify the address is correct")')).toBeVisible();

      const addressInput = page.getByPlaceholder(PLACEHOLDERS.RECIPIENT_ADDRESS);
      await expect(addressInput).toBeVisible();

      const goBackBtn = page.locator(`button:has-text("${TEXT.GO_BACK}")`);
      await expect(goBackBtn).toBeVisible();
      const arrowIcon = goBackBtn.locator('svg');
      await expect(arrowIcon).toBeVisible();
    });

    test('should show validation error for invalid address', async ({ page }) => {
      const addressInput = page.getByPlaceholder(PLACEHOLDERS.RECIPIENT_ADDRESS);
      await addressInput.fill(INVALID_ADDRESS_SHORT);

      await expect(addressInput).toHaveClass(/border-destructive/);

      const errorMsg = page.locator(`p:has-text("${TEXT.ADDRESS_INVALID}")`);
      await expect(errorMsg).toBeVisible();
    });

    test('should clear validation error when address becomes valid', async ({ page }) => {
      const addressInput = page.getByPlaceholder(PLACEHOLDERS.RECIPIENT_ADDRESS);

      await addressInput.fill(INVALID_ADDRESS_SHORT);
      await expect(addressInput).toHaveClass(/border-destructive/);
      await expect(page.locator(`p:has-text("${TEXT.ADDRESS_INVALID}")`)).toBeVisible();

      await addressInput.fill(VALID_ADDRESS);
      await expect(addressInput).not.toHaveClass(/border-destructive/);
      await expect(page.locator(`p:has-text("${TEXT.ADDRESS_INVALID}")`)).not.toBeVisible();
    });

    test('should show transfer button when wallet is connected', async ({ page }) => {
      const transferBtn = page.locator(`button:has-text("${TEXT.TRANSFER}")`);
      await expect(transferBtn).toBeVisible();

      const addressInput = page.getByPlaceholder(PLACEHOLDERS.RECIPIENT_ADDRESS);
      await expect(addressInput).toBeVisible();
    });

    test('should disable transfer button for invalid address when connected', async ({ page }) => {
      const addressInput = page.getByPlaceholder(PLACEHOLDERS.RECIPIENT_ADDRESS);
      await addressInput.fill(INVALID_ADDRESS_SHORT);

      const transferBtn = page.locator(`button:has-text("${TEXT.TRANSFER}")`);
      await expect(transferBtn).toBeDisabled();
    });

    test('should enable transfer button for valid address when connected', async ({ page }) => {
      const addressInput = page.getByPlaceholder(PLACEHOLDERS.RECIPIENT_ADDRESS);
      await addressInput.fill(VALID_ADDRESS);

      const transferBtn = page.locator(`button:has-text("${TEXT.TRANSFER}")`);
      await expect(transferBtn).toBeEnabled();
    });

    test('should go back when Go back button is clicked', async ({ page }) => {
      const goBackBtn = page.locator(`button:has-text("${TEXT.GO_BACK}")`);

      await goBackBtn.click();

      await expect(page).toHaveURL(/\/domain\/test\.mpc/);
    });

    test('should show border-destructive immediately on invalid input', async ({ page }) => {
      const addressInput = page.getByPlaceholder(PLACEHOLDERS.RECIPIENT_ADDRESS);

      await addressInput.fill('0x0');
      await expect(addressInput).not.toHaveClass(/(^| )border-destructive( |$)/);

      await addressInput.fill('0x0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2b3c4d');
      await expect(addressInput).toHaveClass(/(^| )border-destructive( |$)/);

      await addressInput.fill('0x0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2b3c4d5');
      await expect(addressInput).not.toHaveClass(/(^| )border-destructive( |$)/);
    });
  });

  test('should hide transfer button when wallet not connected', async ({ page }) => {
    await page.goto(`/domain/${TEST_DOMAIN_NAME}/transfer`);

    const fallbackMessage = page.locator(`text=${TEXT.CONNECT_WALLET_PROMPT}`);
    await expect(fallbackMessage).toBeVisible();

    const transferBtn = page.locator(`button:has-text("${TEXT.TRANSFER}")`);
    await expect(transferBtn).not.toBeVisible();
  });
});
