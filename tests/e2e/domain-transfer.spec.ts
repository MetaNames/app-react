import { test, expect } from '@playwright/test';
import { connectWallet, gotoAndRestoreWallet } from './helpers/wallet-helper';

const TEST_DOMAIN = 'test.mpc';
const VALID_ADDRESS = '0x0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2b3c4d5';
const INVALID_ADDRESS = '0x0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2b3c4d'; // 41 chars (invalid)

test.describe('Domain Transfer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await connectWallet(page);
  });

  test('should display transfer page with all elements', async ({ page }) => {
    // Heading
    const heading = page.locator('h2:has-text("Transfer domain")');
    await expect(heading).toBeVisible();

    // Domain name
    const domainName = page.locator('h4:has-text("test.mpc")');
    await expect(domainName).toBeVisible();

    // Warnings (bold text)
    const warningDiv = page.locator('.bg-muted.rounded-lg');
    await expect(warningDiv.locator('strong:has-text("Please note that all transfers are irreversible.")')).toBeVisible();
    await expect(warningDiv.locator('strong:has-text("Verify the address is correct")')).toBeVisible();

    // Recipient address input
    const addressInput = page.getByPlaceholder('Recipient address (42 chars)');
    await expect(addressInput).toBeVisible();

    // Go back button
    const goBackBtn = page.locator('button:has-text("Go back")');
    await expect(goBackBtn).toBeVisible();
    const arrowIcon = goBackBtn.locator('svg');
    await expect(arrowIcon).toBeVisible();
  });

  test('should show validation error for invalid address', async ({ page }) => {
    const addressInput = page.getByPlaceholder('Recipient address (42 chars)');
    await addressInput.fill(INVALID_ADDRESS);

    // Input should have border-destructive class
    await expect(addressInput).toHaveClass(/border-destructive/);

    // Error message should appear
    const errorMsg = page.locator('p.text-destructive:has-text("Address is invalid")');
    await expect(errorMsg).toBeVisible();
  });

  test('should clear validation error when address becomes valid', async ({ page }) => {
    const addressInput = page.getByPlaceholder('Recipient address (42 chars)');

    // First fill invalid address
    await addressInput.fill(INVALID_ADDRESS);
    await expect(addressInput).toHaveClass(/border-destructive/);
    await expect(page.locator('p.text-destructive:has-text("Address is invalid")')).toBeVisible();

    // Fix the address
    await addressInput.fill(VALID_ADDRESS);
    await expect(addressInput).not.toHaveClass(/border-destructive/);
    await expect(page.locator('p.text-destructive:has-text("Address is invalid")')).not.toBeVisible();
  });

  test('should hide transfer button when wallet not connected', async ({ page }) => {
    // When wallet is not connected, ConnectionRequired shows fallback message
    const fallbackMessage = page.locator('text=Connect your wallet to continue');
    await expect(fallbackMessage).toBeVisible();

    // Transfer button should not be visible
    const transferBtn = page.locator('button:has-text("Transfer domain")');
    await expect(transferBtn).not.toBeVisible();
  });

  test('should show transfer button when wallet is connected', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}/transfer`);

    // Transfer button should be visible
    const transferBtn = page.locator('button:has-text("Transfer domain")');
    await expect(transferBtn).toBeVisible();

    // Input field for recipient address should still be visible
    const addressInput = page.getByPlaceholder('Recipient address (42 chars)');
    await expect(addressInput).toBeVisible();
  });

  test('should disable transfer button for invalid address when connected', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}/transfer`);

    const addressInput = page.getByPlaceholder('Recipient address (42 chars)');
    await addressInput.fill(INVALID_ADDRESS);

    const transferBtn = page.locator('button:has-text("Transfer domain")');
    await expect(transferBtn).toBeDisabled();
  });

  test('should enable transfer button for valid address when connected', async ({ page }) => {
    await gotoAndRestoreWallet(page, `/domain/${TEST_DOMAIN}/transfer`);

    const addressInput = page.getByPlaceholder('Recipient address (42 chars)');
    await addressInput.fill(VALID_ADDRESS);

    const transferBtn = page.locator('button:has-text("Transfer domain")');
    await expect(transferBtn).toBeEnabled();
  });

  test('should go back when Go back button is clicked', async ({ page }) => {
    const goBackBtn = page.locator('button:has-text("Go back")');

    // Click go back - should navigate back
    await goBackBtn.click();

    // Should navigate to domain page (since that's the previous page)
    await expect(page).toHaveURL(/\/domain\/test\.mpc/);
  });

  test('should show border-destructive immediately on invalid input', async ({ page }) => {
    const addressInput = page.getByPlaceholder('Recipient address (42 chars)');

    // Type invalid character by character
    await addressInput.fill('0x0');
    await expect(addressInput).not.toHaveClass(/border-destructive/);

    await addressInput.fill('0x0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2b3c4d');
    await expect(addressInput).toHaveClass(/border-destructive/);

    // Add one more character to make it valid (42 chars)
    await addressInput.fill('0x0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2b3c4d5');
    await expect(addressInput).not.toHaveClass(/border-destructive/);
  });
});