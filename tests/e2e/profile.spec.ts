import { test, expect, type Page } from "@playwright/test";
import { SELECTORS, TEXT, TEST_DOMAIN_NAME } from "./constants";
import { connectWallet } from "./helpers/wallet-helper";
import { waitForDomainsLoaded } from "./fixtures/shared";

test.describe("User Profile", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("domcontentloaded");
  });

  test.describe("Disconnected State", () => {
    test('should show "Connect your wallet to see your domains" message', async ({
      page,
    }) => {
      const message = page.locator(`text=${TEXT.CONNECT_TO_SEE_DOMAINS}`);
      await expect(message).toBeVisible();
    });

    test("Profile heading is present but visually hidden when disconnected", async ({
      page,
    }) => {
      const profileHeading = page.locator(
        `h1:has-text("${TEXT.PROFILE_HEADING}")`,
      );
      // Design intentionally renders an sr-only <h1> landmark for screen readers
      // even in the disconnected state; it must stay visually hidden.
      await expect(profileHeading).toHaveClass(/sr-only/);
    });

    test("should not show Domains heading when disconnected", async ({
      page,
    }) => {
      const domainsHeading = page.locator(
        `h2:has-text("${TEXT.DOMAINS_HEADING}")`,
      );
      await expect(domainsHeading).not.toBeVisible();
    });

    test("should not show search bar when disconnected", async ({ page }) => {
      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).not.toBeVisible();
    });

    test("should not show domains table when disconnected", async ({
      page,
    }) => {
      const table = page.locator("table");
      await expect(table).not.toBeVisible();
    });
  });

  test.describe("Connected State", () => {
    test("should show Profile heading after connecting", async ({ page }) => {
      await connectWallet(page);

      const profileHeading = page.locator(
        `h1:has-text("${TEXT.PROFILE_HEADING}")`,
      );
      await expect(profileHeading).toBeVisible();
    });

    test("should show address chip after connecting", async ({ page }) => {
      await connectWallet(page);

      const addressChip = page.locator("text=address");
      await expect(addressChip).toBeVisible();
    });

    test("should show Domains heading after connecting", async ({ page }) => {
      await connectWallet(page);

      const domainsHeading = page.locator(
        `h2:has-text("${TEXT.DOMAINS_HEADING}")`,
      );
      await expect(domainsHeading).toBeVisible();
    });

    test("should show domains table with correct columns", async ({ page }) => {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const tableRows = page.locator("tbody tr");
      await expect(tableRows.first()).toBeVisible({ timeout: 30000 });
    });

    test("should show name.mpc domain in table", async ({ page }) => {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const testDomain = page.locator(`text=${TEST_DOMAIN_NAME}`);
      await expect(testDomain).toBeVisible({ timeout: 10000 });
    });

    test("should show pagination after domains load", async ({ page }) => {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const paginationInfo = page.locator("text=/\\d+ of \\d+/");
      await expect(paginationInfo).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Domain Search/Filter", () => {
    test("should show search bar when connected", async ({ page }) => {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).toBeVisible({ timeout: 30000 });
    });

    test("should filter domains by exact prefix match", async ({ page }) => {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).toBeVisible({ timeout: 30000 });

      await searchBar.fill("name");

      const testDomain = page.locator(`text=${TEST_DOMAIN_NAME}`).first();
      await expect(testDomain).toBeVisible({ timeout: 10000 });
    });

    test("should filter domains by fuzzy match (contains)", async ({
      page,
    }) => {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).toBeVisible({ timeout: 30000 });

      await searchBar.fill("ame.m");

      const testDomain = page.locator(`text=${TEST_DOMAIN_NAME}`).first();
      await expect(testDomain).toBeVisible({ timeout: 10000 });
    });

    test("should show no results message for non-matching search", async ({
      page,
    }) => {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).toBeVisible({ timeout: 30000 });

      await searchBar.fill("nonexistentdomain12345");

      const noResults = page.locator(`text=${TEXT.NO_DOMAINS_FOUND}`);
      await expect(noResults).toBeVisible({ timeout: 10000 });
    });

    test("should clear search with X button", async ({ page }) => {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      const searchBar = page.locator(SELECTORS.SEARCH_BAR);
      await expect(searchBar).toBeVisible({ timeout: 30000 });

      await searchBar.fill("test");

      const clearBtn = page.locator('[data-testid="search-bar"] + button');
      await expect(clearBtn).toBeVisible({ timeout: 5000 });
      await clearBtn.click();

      await expect(searchBar).toHaveValue("");
    });
  });

  test.describe("Table Sorting", () => {
    /**
     * These used to click a header and sleep. Sorting that silently stopped
     * working would still have passed, so each test now asserts that the
     * visible page is actually ordered afterwards.
     *
     * Comparing "before" against "after" is not enough: a column that is
     * already sorted (Token ID) or entirely tied (Parent, on an account with
     * no subdomains) never changes on the first click. And with more rows
     * than fit one page, descending is not the reverse of ascending — it is
     * a different slice of the data — so each direction is checked on its own.
     */
    async function columnValues(page: Page, index: number): Promise<string[]> {
      return page
        .locator(`tbody tr td:nth-child(${index + 1})`)
        .allInnerTexts();
    }

    function compareValues(a: string, b: string): number {
      const [na, nb] = [Number(a), Number(b)];
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    }

    function isOrdered(values: string[], direction: 1 | -1): boolean {
      return values.every(
        (value, i) =>
          i === 0 || compareValues(values[i - 1], value) * direction <= 0,
      );
    }

    async function expectSortToggles(page: Page, columnIndex: number) {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      const header = page.locator("thead th").nth(columnIndex);
      await expect(header).toBeVisible();

      // Only sortable columns carry a header button; clicking the cell itself
      // lands on padding as often as not, which reads as "sorting is broken"
      // when nothing was ever wired to that click.
      const toggle = header.getByRole("button");
      test.skip(
        (await toggle.count()) === 0,
        "Column has no sort control to toggle",
      );

      const rowCount = (await columnValues(page, columnIndex)).length;
      test.skip(
        rowCount < 2,
        "Sorting needs at least two rows to be observable",
      );

      // Which direction a first click produces is TanStack's call, not ours —
      // numeric columns default to descending-first. What matters is that the
      // page comes back ordered, and that a second click flips it.
      await toggle.click();
      await expect
        .poll(async () => {
          const values = await columnValues(page, columnIndex);
          return isOrdered(values, 1) || isOrdered(values, -1);
        })
        .toBe(true);
      const firstDirection = isOrdered(await columnValues(page, columnIndex), 1)
        ? 1
        : -1;

      await toggle.click();
      await expect
        .poll(async () =>
          isOrdered(
            await columnValues(page, columnIndex),
            (firstDirection * -1) as 1 | -1,
          ),
        )
        .toBe(true);

      // Sorting reorders rows; it must never drop or duplicate them.
      expect(await columnValues(page, columnIndex)).toHaveLength(rowCount);
    }

    test("should toggle sort on Token ID column", async ({ page }) => {
      await expectSortToggles(page, 0);
    });

    test("should toggle sort on Domain Name column", async ({ page }) => {
      await expectSortToggles(page, 1);
    });

    test("should toggle sort on Parent column", async ({ page }) => {
      await expectSortToggles(page, 2);
    });
  });

  test.describe("Pagination", () => {
    const pageInfo = (page: Page) => page.getByTestId("pagination-info");

    test("should show rows per page selector", async ({ page }) => {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      await expect(
        page.getByRole("combobox", { name: "Rows per page" }),
      ).toBeVisible();
    });

    test("should show pagination navigation arrows", async ({ page }) => {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      for (const name of [
        "First page",
        "Previous page",
        "Next page",
        "Last page",
      ]) {
        await expect(page.getByRole("button", { name })).toBeVisible();
      }
    });

    test("should show correct pagination format", async ({ page }) => {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      await expect(pageInfo(page)).toHaveText(/^\d+-\d+ of \d+$/);
    });

    test("should change page size to 5", async ({ page }) => {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      await page.getByRole("combobox", { name: "Rows per page" }).click();
      await page.getByRole("option", { name: "5", exact: true }).click();

      // The size change must actually cap the rendered rows, not just the label.
      await expect
        .poll(() => page.locator("tbody tr").count())
        .toBeLessThanOrEqual(5);
      await expect(pageInfo(page)).toHaveText(/^1-\d+ of \d+$/);
    });

    test("should navigate forward and back through pages", async ({ page }) => {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      // Force a page size the fixture wallet can actually overflow.
      await page.getByRole("combobox", { name: "Rows per page" }).click();
      await page.getByRole("option", { name: "5", exact: true }).click();

      const nextBtn = page.getByRole("button", { name: "Next page" });
      test.skip(
        await nextBtn.isDisabled(),
        "Wallet owns a single page of domains",
      );

      const firstPage = await pageInfo(page).innerText();
      await nextBtn.click();
      await expect(pageInfo(page)).not.toHaveText(firstPage);

      await page.getByRole("button", { name: "Previous page" }).click();
      await expect(pageInfo(page)).toHaveText(firstPage);
    });

    test("should jump to the last page and back to the first", async ({
      page,
    }) => {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      await page.getByRole("combobox", { name: "Rows per page" }).click();
      await page.getByRole("option", { name: "5", exact: true }).click();

      const lastBtn = page.getByRole("button", { name: "Last page" });
      test.skip(
        await lastBtn.isDisabled(),
        "Wallet owns a single page of domains",
      );

      const firstPage = await pageInfo(page).innerText();
      await lastBtn.click();
      await expect(pageInfo(page)).not.toHaveText(firstPage);
      await expect(lastBtn).toBeDisabled();

      await page.getByRole("button", { name: "First page" }).click();
      await expect(pageInfo(page)).toHaveText(firstPage);
      await expect(
        page.getByRole("button", { name: "First page" }),
      ).toBeDisabled();
    });
  });

  test.describe("Navigate to Domain", () => {
    test("should navigate to /domain/name.mpc when clicking domain name link", async ({
      page,
    }) => {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const domainLink = page.locator(`a[href="/domain/${TEST_DOMAIN_NAME}"]`);
      await expect(domainLink).toBeVisible({ timeout: 10000 });

      await domainLink.click();

      await expect(page).toHaveURL(/\/domain\/name\.mpc/, { timeout: 10000 });
    });

    test("should navigate to domain page with correct content", async ({
      page,
    }) => {
      await connectWallet(page);
      await waitForDomainsLoaded(page);

      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 30000 });

      const domainLink = page.locator(`a[href="/domain/${TEST_DOMAIN_NAME}"]`);
      await expect(domainLink).toBeVisible({ timeout: 10000 });

      await domainLink.click();

      await expect(page.locator(SELECTORS.DOMAIN_TITLE)).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
