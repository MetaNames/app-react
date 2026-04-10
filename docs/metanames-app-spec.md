# MetaNames Application - Complete Specification

## 1. Project Overview

**Project Name:** MetaNames  
**Type:** Full-stack Web3 Decentralized Domain Name Service  
**Blockchain:** Partisia Blockchain  
**Core TLD:** `.mpc`  
**Domain Format:** `{name}.mpc` (e.g., `alice.mpc`, `subdomain.test.mpc` for subdomains)

---

## 2. Technology Stack

| Layer              | Technology                                                                   |
| ------------------ | ---------------------------------------------------------------------------- |
| Frontend Framework | Next.js 15.x (App Router, Server Components, Server Actions)                 |
| Language           | TypeScript 5.x                                                               |
| UI Library         | shadcn/ui (Radix UI primitives + Tailwind CSS)                               |
| Styling            | Tailwind CSS 4.x with CSS custom properties for theming                      |
| Icons              | Lucide React (shadcn/ui default icon set)                                    |
| Backend            | Next.js Route Handlers (`app/api/**/route.ts`, serverless on Vercel/Node.js) |
| Blockchain SDK     | `@metanames/sdk`                                                             |
| Wallets            | Partisia Wallet, MetaMask (Snap), Ledger (WebUSB)                            |
| Error Tracking     | Sentry (`@sentry/nextjs`)                                                    |
| Testing            | Vitest (unit) + Playwright (e2e)                                             |
| State Management   | Zustand (lightweight store for wallet + SDK state)                           |
| Deployment         | Vercel (native Next.js support)                                              |

---

## 3. User Interactions by Feature

### Feature 1: Domain Search & Validation

#### 1.1 Search for Domain Name

**Page:** `/` (Homepage)  
**Test:** `tests/e2e/domain-search.spec.ts:9-20`

| Step | User Action                                                         | System Response                                                            |
| ---- | ------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1    | User clicks on search input field                                   | Input field receives focus, cursor blinks                                  |
| 2    | User types domain name (e.g., "test") with 50ms delay per character | Text appears in input field character by character                         |
| 3    | After 400ms debounce timer expires                                  | System calls `sdk.domainRepository.find(domainName)` to check availability |
| 4    | Blockchain API responds                                             | System displays result card below search input                             |

**Result States:**

- **Domain Registered:** Badge shows "Registered" (purple), card is clickable `<Link>` to `/domain/{name}`
- **Domain Available:** Badge shows "Available" (green), card is clickable `<Link>` to `/register/{name}`
- **Loading:** `<Loader2>` spinner (lucide-react) shown inside domain card

#### 1.2 Validate Domain Names

**Test:** `tests/e2e/domain-search.spec.ts:22-33`

| Step | User Action                                     | System Response                                              |
| ---- | ----------------------------------------------- | ------------------------------------------------------------ |
| 1    | User types invalid characters (e.g., "test!@#") | Input field shows destructive border (`border-destructive`)  |
| 2    | Validation error appears below input            | `<p>` with `text-destructive` shows validation error message |

**Validation Rules (from `domain-validator.test.ts`):**

- Minimum 3 characters
- No leading/trailing hyphens (`-start`, `end-`)
- No spaces or special characters (`[^a-z0-9-]`)
- Maximum 32 characters
- No double dots (`..`)

#### 1.3 See Domain Availability Status

**Test:** `tests/e2e/domain-search.spec.ts:35-47`

| Step | User Action                                                     | System Response                                                        |
| ---- | --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1    | User types random domain name (e.g., `zzztest{unix_timestamp}`) | After debounce, system checks blockchain                               |
| 2    | System displays availability chip                               | Shows either `.chip.available` or `.chip.registered` within 15 seconds |

---

### Feature 2: Wallet Connection

#### 2.1 Connect Wallet

**Page:** Header navigation bar  
**Test:** `tests/e2e/dev-wallet.spec.ts:26-39, 56-62`

| Step | User Action                                 | System Response                                                                 |
| ---- | ------------------------------------------- | ------------------------------------------------------------------------------- |
| 1    | User clicks Connect button in header navbar | shadcn `DropdownMenu` opens anchored to button                                  |
| 2    | Menu displays wallet options                | Shows: MetaMask Wallet, Partisia Wallet, Ledger, Dev Private Key (testnet only) |
| 3    | User clicks a wallet option                 | System initiates wallet-specific connection flow                                |

**Wallet Connection Flows:**

**MetaMask:**

1. System calls `wallet_requestSnaps` with `npm:@partisiablockchain/snap`
2. System calls `wallet_invokeSnap` with `get_address` method
3. SDK `setSigningStrategy('MetaMask', wallet)` called
4. Address stored in `walletStore.address`

**Partisia Wallet:**

1. System calls `partisiaSdk.connect({ chainId, permissions, dappName })`
2. System extracts address from `sdk.connection.account.address`
3. SDK `setSigningStrategy('partisiaSdk', client)` called
4. Address stored in `walletStore.address`

**Ledger:**

1. System creates WebUSB transport via `TransportWebUSB.create()`
2. System creates `PartisiaLedgerClient(transport)`
3. System calls `client.getAddress()` to retrieve address
4. SDK `setSigningStrategy('Ledger', transport)` called
5. Address stored in `walletStore.address`

**Dev Private Key (testnet only):**

1. User enters 64-character hex private key in `[data-testid="dev-key-input"]` field
2. User clicks `[data-testid="dev-key-connect-button"]` button
3. System calls `privateKeyToAccountAddress(privateKey)` from `partisia-blockchain-applications-crypto`
4. SDK `setSigningStrategy('privateKey', privateKey)` called
5. Address stored in `walletStore.address`

#### 2.2 Dev Private Key Validation

**Test:** `tests/e2e/dev-wallet.spec.ts:41-53, 78-93`

| Step | User Action                                      | System Response                                           |
| ---- | ------------------------------------------------ | --------------------------------------------------------- |
| 1    | User opens wallet menu                           | `.dev-key-connect` button is disabled when input is empty |
| 2    | User enters key with invalid length (< 64 chars) | Button remains disabled                                   |
| 3    | User enters exactly 64 hex characters            | Button becomes enabled                                    |

#### 2.3 Disconnect Wallet

**Test:** `tests/e2e/dev-wallet.spec.ts:64-76`

| Step | User Action                                               | System Response                                                 |
| ---- | --------------------------------------------------------- | --------------------------------------------------------------- |
| 1    | User clicks connected wallet button (shows "0033...8f2c") | Menu opens showing "Disconnect" option                          |
| 2    | User clicks "Disconnect"                                  | SDK `resetSigningStrategy()` called, address cleared from store |
| 3    | Button text changes back to "Connect"                     |                                                                 |

#### 2.4 Wallet Address Display

**Test:** `tests/e2e/dev-wallet.spec.ts:56-62`

| State        | Display                                                  |
| ------------ | -------------------------------------------------------- |
| Disconnected | "Connect" (or custom `buttonLabelContent` snippet)       |
| Connected    | Shortened address "0033...8f2c" (first 4 + last 4 chars) |

---

### Feature 3: Domain Registration

#### 3.1 View Registration Page for Available Domain

**Page:** `/register/{name}`  
**Test:** `tests/e2e/domain-registration.spec.ts:5-10, 65-73`

| Step | User Action                                                       | System Response                                              |
| ---- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| 1    | User navigates to `/register/{newdomain}`                         | Page loads with `.content.checkout`                          |
| 2    | System checks domain availability via `/api/domains/{name}/check` |                                                              |
| 3    | If available, system displays DomainPayment component             | Shows year selector, payment token dropdown, price breakdown |
| 4    | If already registered, system redirects to `/domain/{name}`       |                                                              |

#### 3.2 Payment Token Selection

**Test:** `tests/e2e/domain-registration.spec.ts:12-23`

| Step | User Action                                                               | System Response                                                  |
| ---- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1    | User clicks payment token dropdown `[data-testid="payment-token-select"]` | shadcn `Select` opens                                            |
| 2    | User sees available tokens                                                | BTC, ETH, USDT, PARTI, TEST_COIN                                 |
| 3    | User selects a token                                                      | Dropdown closes, selection updated in `useSdkStore.selectedCoin` |
| 4    | System fetches fees for new token                                         | Price breakdown updates via `/api/register/{name}/fees/{coin}`   |

#### 3.3 Year Selector

**Test:** `tests/e2e/domain-registration.spec.ts:25-50`

| Step | User Action                                         | System Response                                |
| ---- | --------------------------------------------------- | ---------------------------------------------- |
| 1    | User views registration page                        | Default year count is 1, displays "1 year"     |
| 2    | User clicks `+` button `[aria-label="add-year"]`    | Year count increments to 2, displays "2 years" |
| 3    | User clicks `-` button `[aria-label="remove-year"]` | Year count decrements back to 1                |
| 4    | System recalculates total fees                      | Total = `feesLabel × years`                    |

**Constraints:**

- Minimum: 1 year (remove button disabled at 1)
- No maximum specified

#### 3.4 Price Breakdown

**Test:** `tests/e2e/domain-registration.spec.ts:65-73`

| Line Item  | Description                                                          |
| ---------- | -------------------------------------------------------------------- |
| Base price | "1 year registration for {n} chars" with `feesLabel` and `symbol`    |
| Total      | "Total (excluding network fees)" = `feesLabel × years` with `symbol` |

#### 3.5 Two-Step Payment Flow

**Test:** `tests/e2e/blockchain-ops.spec.ts:19-55`

| Step | User Action                                                      | System Response                                                                                                          |
| ---- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1    | User clicks "Approve fees" button `[data-testid="approve-fees"]` | System calls `getAccountBalance(address)` to check balance                                                               |
| 2    | If insufficient balance                                          | Throws `InsufficientBalanceError`, snackbar shows "Insufficient balance for {coin}" with "Add funds" action → bridge URL |
| 3    | If sufficient                                                    | System calls `sdk.domainRepository.approveMintFees(domainName, byocSymbol, years)`                                       |
| 4    | Transaction submitted                                            | Snackbar appears: "New Transaction submitted" with "View" button                                                         |
| 5    | Transaction confirmed                                            | "Register domain" button becomes enabled                                                                                 |
| 6    | User clicks "Register domain"                                    | System calls `sdk.domainRepository.register({ domain, to, subscriptionYears, byocSymbol })`                              |
| 7    | Success                                                          | Snackbar: "Domain registered successfully!", redirects to `/domain/{name}` with action "Go to profile"                   |

#### 3.6 Subdomain Registration (FREE)

**Test:** `tests/e2e/domain-registration.spec.ts:52-63`

| Step | User Action                                | System Response                                                                                     |
| ---- | ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 1    | User navigates to `/register/sub.test.mpc` | System checks if parent `test.mpc` exists                                                           |
| 2    | If parent exists                           | Shows `SubdomainRegistration` component instead of `DomainPayment`                                  |
| 3    | System displays                            | Domain title (e.g., "sub.test.mpc"), Parent chip (links to `/domain/test.mpc`), Price shows "FREE"  |
| 4    | User clicks "Register domain"              | System calls `sdk.domainRepository.register({ domain, parentDomain, to, byocSymbol: 'TEST_COIN' })` |

#### 3.7 Connect Wallet Prompt

**Test:** `tests/e2e/domain-registration.spec.ts:83-91`

| State                | UI Behavior                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| Wallet NOT connected | Page body shows "Connect your wallet" message (via `ConnectionRequired`) |
| Wallet connected     | Payment form fully visible, no connect prompt                            |

---

### Feature 4: Domain Management (View)

**Page:** `/domain/{name}`  
**Test:** `tests/e2e/domain-management.spec.ts:12-35`

#### 4.1 View Domain Details

| Element                    | Description                                                | Selector                                   |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| Domain heading             | Shows `domain.name`                                        | `h5.domain` `[data-testid="domain-title"]` |
| Avatar                     | Jdenticon SVG generated from domain name                   | `.avatar svg`                              |
| Profile section            | Shows profile record chips                                 | `h5:has-text("Profile")`                   |
| Short link chip            | Label "link", opens `https://metanam.es/{name}` in new tab | `.chip` with label "link"                  |
| Whois section              | Owner address, expiration date                             | `h5:has-text("Whois")`                     |
| Owner chip                 | Shows truncated owner address, links to explorer           | `button:has-text(/Owner 0/i)`              |
| Expires chip               | Shows formatted expiration date                            | `button:has-text(/Expires/i)`              |
| Parent chip (if subdomain) | Links to parent domain page                                |                                            |

#### 4.2 Non-Owner View

**Test:** `tests/e2e/domain-management.spec.ts:55-61`

| User State              | UI Behavior                                         |
| ----------------------- | --------------------------------------------------- |
| Not wallet connected    | No tabs shown (details tab only implicitly visible) |
| Connected but NOT owner | No tabs shown, read-only view                       |
| Connected AND is owner  | TabBar visible with "details" and "settings" tabs   |

#### 4.3 Owner Tab Navigation

**Test:** `tests/e2e/domain-management.spec.ts:45-53`, `dns-records.spec.ts:92-104`

| Step | User Action                | System Response                                     |
| ---- | -------------------------- | --------------------------------------------------- |
| 1    | Owner logs in              | TabBar appears with "details" and "settings" tabs   |
| 2    | User clicks "details" tab  | Shows Profile, Whois, Social sections               |
| 3    | User clicks "settings" tab | Shows Records editor, Renew button, Transfer button |

#### 4.4 Profile Records Display

**Test:** `tests/e2e/domain-management.spec.ts:12-35`

| Record Type | Display Format                                         |
| ----------- | ------------------------------------------------------ |
| Bio         | Label + value text                                     |
| Email       | Label + value text                                     |
| Uri         | Label + value as clickable URL chip (opens in new tab) |
| Wallet      | Label + value text                                     |
| Price       | Label + value + "$" suffix                             |
| Avatar      | Label + value text                                     |
| Main        | Label + value text                                     |

#### 4.5 Social Records Display

**Test:** `dns-records.spec.ts:57-71`

| Record Type | Display       |
| ----------- | ------------- |
| Twitter     | Label + value |
| Discord     | Label + value |

#### 4.6 Non-Existent Domain Redirect

**Test:** `tests/e2e/domain-management.spec.ts:37-43`

| Step | User Action                                      | System Response                                           |
| ---- | ------------------------------------------------ | --------------------------------------------------------- |
| 1    | User navigates to `/domain/nonexistent12345.mpc` | System calls `sdk.domainRepository.find()`                |
| 2    | Domain not found (returns null)                  | Snackbar: "Domain not found. Register it now!"            |
| 3    | System redirects                                 | To `/register/nonexistent12345` with `replaceState: true` |

---

### Feature 5: Domain Renewal

**Page:** `/domain/{name}/renew`  
**Test:** `tests/e2e/domain-renewal.spec.ts:5-33`

#### 5.1 View Renewal Page

| Step | User Action                                | System Response                                |
| ---- | ------------------------------------------ | ---------------------------------------------- |
| 1    | User navigates to `/domain/test.mpc/renew` | Page loads with heading "Renew domain"         |
| 2    | System analyzes domain name                | Extracts TLD, prepares DomainPayment component |
| 3    | Page displays                              | Year selector (+/- buttons), Go back button    |

#### 5.2 Renewal Payment Flow

| Step | User Action                  | System Response                                                                             |
| ---- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| 1    | User logs in                 | Payment token section and price breakdown become visible                                    |
| 2    | User selects years and token | Price breakdown updates                                                                     |
| 3    | User clicks "Approve fees"   | System calls `sdk.domainRepository.approveMintFees()`                                       |
| 4    | User clicks "Renew domain"   | System calls `sdk.domainRepository.renew({ domain, payer, byocSymbol, subscriptionYears })` |
| 5    | Success                      | Snackbar: "Domain renewed successfully!", redirects to `/domain/{name}`                     |

#### 5.3 URL Validation

**Test:** `tests/e2e/domain-renewal.spec.ts:16-19`

| Step | User Action                          | System Response                                  |
| ---- | ------------------------------------ | ------------------------------------------------ |
| 1    | Navigate to `/domain/test.mpc/renew` | URL matches regex `/\/domain\/test\.mpc\/renew/` |

---

### Feature 6: Domain Transfer

**Page:** `/domain/{name}/transfer`  
**Test:** `tests/e2e/domain-transfer.spec.ts:5-55`

#### 6.1 View Transfer Page

| Element        | Content                                                   |
| -------------- | --------------------------------------------------------- |
| Heading        | "Transfer domain" (`h2`)                                  |
| Domain name    | e.g., "test.mpc" (`h4`)                                   |
| Warning        | "Please note that all transfers are irreversible." (bold) |
| Warning        | "Verify the address is correct" (bold)                    |
| Input          | Recipient address text field                              |
| Go back button |                                                           |

#### 6.2 Address Input Validation

**Test:** `tests/e2e/domain-transfer.spec.ts:47-54`

| Step | User Action                                              | System Response                                             |
| ---- | -------------------------------------------------------- | ----------------------------------------------------------- |
| 1    | User types invalid address (e.g., "not-a-valid-address") | Input field shows destructive border (`border-destructive`) |
| 2    | Validation error displayed                               | "Address is invalid" helper text appears                    |

**Validation Rule (from `utils.test.ts:71-88`):**

- Must be exactly 42 characters
- Must be alphanumeric

#### 6.3 Transfer Button Access

**Test:** `tests/e2e/domain-transfer.spec.ts:29-45`

| State                | Button Visibility                                          |
| -------------------- | ---------------------------------------------------------- |
| Wallet NOT connected | "Transfer domain" button hidden (via `ConnectionRequired`) |
| Wallet connected     | "Transfer domain" button visible                           |

#### 6.4 Execute Transfer

| Step | User Action                         | System Response                                                            |
| ---- | ----------------------------------- | -------------------------------------------------------------------------- |
| 1    | User enters valid recipient address | Transfer button becomes enabled                                            |
| 2    | User clicks "Transfer domain"       | System calls `sdk.domainRepository.transfer({ domain, from, to })`         |
| 3    | Success                             | Snackbar: "Domain transferred successfully", redirects to `/domain/{name}` |

---

### Feature 7: DNS Records Management (CRUD)

**Page:** `/domain/{name}` (Settings tab) or `/domain/{name}/records` (dedicated page)  
**Test:** `tests/e2e/dns-records.spec.ts`, `tests/e2e/blockchain-ops.spec.ts:57-197`

#### 7.1 Record Types

| Category | Types                                        |
| -------- | -------------------------------------------- |
| Profile  | Bio, Email, Uri, Wallet, Price, Avatar, Main |
| Social   | Twitter, Discord                             |

#### 7.2 View Records (Settings Tab)

**Test:** `dns-records.spec.ts:36-41`

| Step | User Action                      | System Response                                                          |
| ---- | -------------------------------- | ------------------------------------------------------------------------ |
| 1    | User navigates to domain page    |                                                                          |
| 2    | User logs in as owner            | TabBar appears with "settings" tab                                       |
| 3    | User clicks "settings" tab       | Shows `.records` container and `.add-record` form                        |
| 4    | System displays existing records | Each record shows `.record-container` with value and edit/delete buttons |

#### 7.3 Add New Record

**Test:** `blockchain-ops.spec.ts:57-106`

| Step | User Action                                                                | System Response                                                                |
| ---- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1    | User clicks record type dropdown in `.add-record` section                  | shadcn `Select` opens                                                          |
| 2    | User selects record type (e.g., "Bio") `[data-testid="select-option-Bio"]` | Dropdown closes, selection set                                                 |
| 3    | User types record value in textarea                                        | Value appears in input field                                                   |
| 4    | User clicks "Add record" button                                            | System validates input using `getValidator(klass)`                             |
| 5    | If invalid                                                                 | Error message shown, button remains disabled                                   |
| 6    | If valid                                                                   | System calls `repository.create({ class: recordClass, data: newRecordValue })` |
| 7    | Transaction submitted                                                      | Snackbar: "New Transaction submitted"                                          |
| 8    | Transaction confirmed                                                      | Record appears in list, form resets                                            |

**Constraints:**

- Max length from `validator.rules.maxLength` (default 64)
- Record type dropdown only shows unused record types

#### 7.4 Edit Record

**Test:** `dns-records.spec.ts:73-90`, `blockchain-ops.spec.ts:108-152`

| Step | User Action                                                       | System Response                                                                            |
| ---- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1    | User clicks edit button `[data-testid="edit-record"]` on a record | Record enters edit mode                                                                    |
| 2    | Textarea becomes editable with character counter                  | Save `[data-testid="save-record"]` and Cancel `[data-testid="cancel-edit"]` buttons appear |
| 3    | User modifies value in textarea                                   | Real-time validation occurs                                                                |
| 4    | User clicks Save                                                  | System calls `repository.update({ class: recordClass, data: newValue })`                   |
| 5    | Transaction confirmed                                             | Record exits edit mode, new value displayed                                                |
| 6    | OR: User clicks Cancel                                            | Record exits edit mode, original value restored                                            |

#### 7.5 Delete Record

**Test:** `dns-records.spec.ts:73-90`, `blockchain-ops.spec.ts:154-197`

| Step | User Action                                                                 | System Response                                             |
| ---- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1    | User clicks delete button `[data-testid="delete-record"]`                   | Confirmation dialog opens                                   |
| 2    | Dialog shows: "Confirm action" / "Do you really want to remove the record?" |                                                             |
| 3    | User clicks "No"                                                            | Dialog closes, no action                                    |
| 4    | OR: User clicks "Yes"                                                       | System calls `repository.delete(recordClass)`               |
| 5    | Transaction confirmed                                                       | Record removed from list, "No records found" shows if empty |

#### 7.6 Record Validation

**Test:** `dns-records.spec.ts:73-90`

| Field        | Validation                                            |
| ------------ | ----------------------------------------------------- |
| Record type  | Required (must select from dropdown)                  |
| Record value | Must pass `validator.validate()` for the record class |
| Max length   | Default 64, or from `validator.rules.maxLength`       |

---

### Feature 8: User Profile

**Page:** `/profile`  
**Test:** `tests/e2e/profile.spec.ts:5-63`

#### 8.1 Disconnected State

**Test:** `tests/e2e/profile.spec.ts:5-20`

| Step | User Action                                 | System Response                                         |
| ---- | ------------------------------------------- | ------------------------------------------------------- |
| 1    | User navigates to `/profile` without wallet | Shows "Connect your wallet to see your domains"         |
| 2    | No table, search bar, or pagination shown   | Search input, Table, and pagination controls all hidden |

#### 8.2 Connected State

**Test:** `tests/e2e/profile.spec.ts:22-63`

| Step | User Action            | System Response                                                  |
| ---- | ---------------------- | ---------------------------------------------------------------- |
| 1    | User logs in           | Address chip displayed, "Domains" heading shown                  |
| 2    | System fetches domains | Calls `sdk.domainRepository.findByOwner(address)`                |
| 3    | Domains table renders  | Shows `test.mpc` with Token ID, Domain Name, Parent Name columns |

#### 8.3 Domain Search/Filter

**Test:** `tests/e2e/profile.spec.ts:45-48`

| Step | User Action                                           | System Response                                                            |
| ---- | ----------------------------------------------------- | -------------------------------------------------------------------------- |
| 1    | User types in search bar `[data-testid="search-bar"]` | Table filters to matching domains                                          |
| 2    | Match logic                                           | Fuzzy match: domain starts with OR contains search term (case-insensitive) |
| 3    | User clicks clear icon                                | Search cleared, all domains shown                                          |

#### 8.4 Table Sorting

**Test:** `profile/DomainsTable.svelte:41-50`

| Step | User Action                         | System Response                          |
| ---- | ----------------------------------- | ---------------------------------------- |
| 1    | User clicks column header sort icon | Table sorts by that column               |
| 2    | Sort direction toggles              | Ascending ↔ Descending                   |
| 3    | Sort columns                        | Token ID (numeric), Domain Name (string) |

#### 8.5 Pagination

**Test:** `profile/DomainsTable.svelte:110-160`

| Step | User Action                   | System Response                     |
| ---- | ----------------------------- | ----------------------------------- |
| 1    | User changes rows per page    | Select from: 5, 10, 20, Max         |
| 2    | User clicks navigation arrows | First, Prev, Next, Last page        |
| 3    | Display format                | "1-5 of 12" showing range and total |

#### 8.6 Navigate to Domain

**Test:** `tests/e2e/profile.spec.ts:50-62`

| Step | User Action                           | System Response                        |
| ---- | ------------------------------------- | -------------------------------------- |
| 1    | User clicks domain name link in table | Navigate to `/domain/{name}`           |
| 2    | Domain page loads                     | `[data-testid="domain-title"]` visible |

---

### Feature 9: TLD Page

**Page:** `/tld`  
**Test:** `tests/e2e/tld.spec.ts:4-33`

#### 9.1 View TLD Information

| Element      | Content                      |
| ------------ | ---------------------------- |
| Domain card  | Shows TLD name (e.g., "mpc") |
| Avatar       | Jdenticon for TLD            |
| Owner chip   | Shows contract address       |
| Settings tab | NOT shown (`isTld=true`)     |

---

### Feature 10: Global UI Elements

#### 10.1 Contract Disabled Banner

**Page:** All pages (when `NEXT_PUBLIC_CONTRACT_DISABLED=true`)  
**Component:** Root layout (`app/layout.tsx`)

| Element       | Content                                        |
| ------------- | ---------------------------------------------- |
| Banner        | "Contract is temporarily disabled for updates" |
| Icon          | system-update                                  |
| Action button | "Check status" → links to Telegram             |

#### 10.2 TESTNET Badge

**Page:** Header (when `NEXT_PUBLIC_ENV=test`)  
**Component:** Root layout (`app/layout.tsx`)

| Condition                       | Display                      |
| ------------------------------- | ---------------------------- |
| `config.environment === 'test'` | "TESTNET" badge next to logo |
| Production                      | No badge                     |

#### 10.3 Transaction Toast (Sonner)

**Page:** All pages (after blockchain transaction)

| Step | System Response                                                     |
| ---- | ------------------------------------------------------------------- |
| 1    | Shows "New Transaction submitted" via `toast()` from Sonner         |
| 2    | "View" action button → opens `${browserUrl}/transactions/${txHash}` |
| 3    | Auto-dismiss after 10 seconds (`duration: 10000`)                   |
| 4    | Manual dismiss via close icon                                       |

#### 10.4 Alert Toast (Sonner)

| Step | System Response                                             |
| ---- | ----------------------------------------------------------- |
| 1    | Shows alert message via `toast()` from Sonner               |
| 2    | Optional action button (e.g., "Add funds", "Go to profile") |
| 3    | Auto-dismiss after 5 seconds (`duration: 5000`)             |

**Implementation:** Add `<Toaster />` from `sonner` in root `app/layout.tsx`.

#### 10.5 Footer Links

**Page:** All pages

| Link     | URL                          |
| -------- | ---------------------------- |
| Landing  | `config.landingUrl`          |
| Docs     | https://docs.metanames.app   |
| Telegram | https://t.me/mpc_metanames   |
| Twitter  | https://x.com/metanames_     |
| GitHub   | https://github.com/metanames |

---

## 4. API Endpoints

| Endpoint                           | Method | Params               | Response                                             | Cache  |
| ---------------------------------- | ------ | -------------------- | ---------------------------------------------------- | ------ |
| `/api/domains/{name}`              | GET    | `name` - domain name | `{ domain: Domain \| null }`                         | None   |
| `/api/domains/{name}/check`        | GET    | `name` - domain name | `{ domainPresent: boolean, parentPresent: boolean }` | None   |
| `/api/domains/stats`               | GET    | None                 | `{ domainCount, ownerCount, recentDomains }`         | 10 min |
| `/api/domains/recent`              | GET    | None                 | `Array<{ name: string, createdAt: Date }>`           | 10 min |
| `/api/register/{name}/fees/{coin}` | GET    | `name`, `coin`       | `{ feesLabel, fees, symbol, address }`               | None   |

---

## 5. Data Models

### Domain Model

```typescript
interface Domain {
  name: string; // "example.mpc"
  nameWithoutTLD: string; // "example"
  owner: string; // "0x..."
  tokenId: number;
  createdAt: Date;
  expiresAt: Date | null;
  parentId: string | null; // "test.mpc" for "sub.test.mpc"
  records: Record<string, any>;
  getRecordRepository(sdk): RecordRepository;
}
```

### RecordRepository

```typescript
interface RecordRepository {
  create(params: { class: string; data: string }): Promise<ITransactionIntent>;
  update(params: { class: string; data: string }): Promise<ITransactionIntent>;
  delete(recordClass: string): Promise<ITransactionIntent>;
}
```

### State Stores (Zustand)

Use Zustand for lightweight, React-friendly global state. These replace the Svelte 5 rune-based stores.

```typescript
// lib/stores/wallet-store.ts
import { create } from "zustand";

interface WalletStore {
  address: string | undefined;
  alertMessage: string | AlertMessage | undefined;
  alertTransaction: string | undefined;
  refresh: boolean;
  setAddress: (address: string | undefined) => void;
  setAlertMessage: (message: string | AlertMessage | undefined) => void;
  setAlertTransaction: (txHash: string | undefined) => void;
  setRefresh: (value: boolean) => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  address: undefined,
  alertMessage: undefined,
  alertTransaction: undefined,
  refresh: false,
  setAddress: (address) => set({ address }),
  setAlertMessage: (alertMessage) => set({ alertMessage }),
  setAlertTransaction: (alertTransaction) => set({ alertTransaction }),
  setRefresh: (refresh) => set({ refresh }),
}));
```

```typescript
// lib/stores/sdk-store.ts
import { create } from "zustand";

interface SdkStore {
  metaNamesSdk: MetaNamesSdk;
  selectedCoin: BYOCSymbol;
  setMetaNamesSdk: (sdk: MetaNamesSdk) => void;
  setSelectedCoin: (coin: BYOCSymbol) => void;
}

export const useSdkStore = create<SdkStore>((set) => ({
  metaNamesSdk: metaNamesSdkFactory(),
  selectedCoin: initialByoc,
  setMetaNamesSdk: (metaNamesSdk) => set({ metaNamesSdk }),
  setSelectedCoin: (selectedCoin) => set({ selectedCoin }),
}));
```

**Migration Notes:**

- Svelte `$state()` / `$derived()` / `$effect()` → Zustand `create()` + React `useMemo` / `useEffect`
- Svelte `$effect()` → React `useEffect()` hooks in components
- Svelte `$derived()` → React `useMemo()` or derived selectors in Zustand
- Svelte stores are auto-reactive; Zustand requires `useStore(selector)` pattern for optimal re-renders

---

## 6. Record Type Specifications

| Type    | Category | Max Length | Validation         |
| ------- | -------- | ---------- | ------------------ |
| Bio     | Profile  | 64         | Text               |
| Email   | Profile  | 64         | Text               |
| Uri     | Profile  | 64         | Valid URL          |
| Wallet  | Profile  | 64         | Blockchain address |
| Price   | Profile  | 64         | Number + "$"       |
| Avatar  | Profile  | 64         | URL                |
| Main    | Profile  | 64         | Text               |
| Twitter | Social   | 64         | Text               |
| Discord | Social   | 64         | Text               |

---

## 7. Validation Summary

| Field             | Rule                                                                                   | Error Message                               |
| ----------------- | -------------------------------------------------------------------------------------- | ------------------------------------------- |
| Domain name       | ≥3 chars, ≤32 chars, alphanumeric + hyphen, no leading/trailing hyphen, no double dots | "Domain name must be at least 3 characters" |
| Recipient address | Exactly 42 alphanumeric chars                                                          | "Address is invalid"                        |
| Record value      | Type-specific validator                                                                | Validation errors shown per record          |
| Private key (dev) | Exactly 64 hex characters                                                              | Button disabled until valid                 |
| Year selector     | ≥1                                                                                     | Remove button disabled at 1                 |

---

## 8. Test Data

### Test Wallet

- **Private Key:** Set `TESTNET_PRIVATE_KEY` in `.env.local` (never commit this value)
- **Address:** `0x0333...8f2c` (derived from key)

### Known Domains (Testnet)

- `test.mpc` - owned by test wallet, has Bio and Price records

### Test Domain Pattern

- `e2ereg{unix_timestamp}` - for registration tests
- `zzztest{unix_timestamp}` - for search availability tests

---

## 9. Design System - Colors

### 9.1 Primary Color Palette

| Color Name     | Light Mode | Dark Mode            | Usage                                  |
| -------------- | ---------- | -------------------- | -------------------------------------- |
| **Primary**    | `#6849fe`  | `#6849fe`            | Buttons, links, active states, accents |
| **Secondary**  | `#676778`  | `#d0c7ff`            | Secondary text, borders, icons         |
| **Surface**    | `#fff`     | `grey-900 + blue +4` | Card backgrounds, inputs               |
| **Background** | `#f0f0f0`  | `#363535`            | Page background                        |
| **Error**      | `red-900`  | `red-700`            | Error states, validation               |

### 9.2 Link Colors

| State       | Light Mode                     | Dark Mode                    |
| ----------- | ------------------------------ | ---------------------------- |
| **Default** | `#866efe` (scaled + lightness) | `text-color + 20% lightness` |
| **Visited** | `#866efe - 35% lightness`      | `text-color + 10% lightness` |

### 9.3 Text Colors

| Element        | Light Mode          | Dark Mode           |
| -------------- | ------------------- | ------------------- |
| **On Surface** | `theme.$on-surface` | `theme.$on-surface` |
| **Text Color** | N/A                 | `#d5ccff`           |

### 9.4 Chip Colors (Domain Search)

| Chip Type      | Background                        | Text Color                |
| -------------- | --------------------------------- | ------------------------- |
| **Available**  | `light-green-400 + 50% whiteness` | `light-green-900`         |
| **Registered** | `primary + 60% whiteness`         | `primary - 20% lightness` |
| **Default**    | `grey-300`                        | `grey-700`                |

### 9.5 Tailwind CSS Theme Variables (shadcn/ui)

shadcn/ui uses CSS custom properties for theming. Define these in `app/globals.css`:

```css
@layer base {
  :root {
    /* Core palette */
    --background: 0 0% 94%; /* #f0f0f0 */
    --foreground: 0 0% 10%;
    --card: 0 0% 100%; /* #fff */
    --card-foreground: 0 0% 10%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 10%;
    --primary: 253 98% 64%; /* #6849fe */
    --primary-foreground: 0 0% 100%;
    --secondary: 240 7% 44%; /* #676778 */
    --secondary-foreground: 0 0% 100%;
    --muted: 0 0% 90%;
    --muted-foreground: 240 7% 44%;
    --accent: 253 98% 64%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 72% 30%; /* red-900 */
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 80%;
    --input: 0 0% 80%;
    --ring: 253 98% 64%; /* primary */

    /* Custom app tokens */
    --link: 253 97% 71%; /* #866efe */
    --link-visited: 253 97% 46%; /* #866efe -35% lightness */
    --chip-available-bg: 88 50% 67%; /* light-green-400 + whiteness */
    --chip-available-fg: 88 50% 25%; /* light-green-900 */
    --chip-registered-bg: 253 98% 85%; /* primary + 60% whiteness */
    --chip-registered-fg: 253 98% 51%; /* primary - 20% lightness */
  }

  .dark {
    --background: 0 0% 21%; /* #363535 */
    --foreground: 253 100% 90%; /* #d5ccff */
    --card: 240 6% 12%; /* grey-900 + blue +4 */
    --card-foreground: 253 100% 90%;
    --popover: 240 6% 12%;
    --popover-foreground: 253 100% 90%;
    --primary: 253 98% 64%; /* #6849fe (same) */
    --primary-foreground: 0 0% 100%;
    --secondary: 253 100% 87%; /* #d0c7ff */
    --secondary-foreground: 0 0% 10%;
    --muted: 0 0% 25%;
    --muted-foreground: 253 100% 87%;
    --destructive: 0 65% 45%; /* red-700 */
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 30%;
    --input: 0 0% 30%;
    --ring: 253 98% 64%;

    --link: 253 100% 94%; /* text-color + 20% lightness */
    --link-visited: 253 100% 90%; /* text-color + 10% lightness */
  }
}
```

### 9.6 Semantic Color Usage

| Element             | Tailwind Class                        | CSS Variable           |
| ------------------- | ------------------------------------- | ---------------------- |
| Primary buttons     | `bg-primary text-primary-foreground`  | `--primary`            |
| Links               | `text-[hsl(var(--link))]`             | `--link`               |
| Error text          | `text-destructive`                    | `--destructive`        |
| Disabled text       | `text-muted-foreground`               | `--muted-foreground`   |
| Success (available) | `bg-[hsl(var(--chip-available-bg))]`  | `--chip-available-bg`  |
| Registered chip     | `bg-[hsl(var(--chip-registered-bg))]` | `--chip-registered-bg` |
| Cards               | `bg-card text-card-foreground`        | `--card`               |
| Page background     | `bg-background`                       | `--background`         |

---

## 10. Page Routes (Next.js App Router)

| Route                     | File                                  | Rendering | Purpose                         |
| ------------------------- | ------------------------------------- | --------- | ------------------------------- |
| `/`                       | `app/page.tsx`                        | Server    | Home page with domain search    |
| `/domain/[name]`          | `app/domain/[name]/page.tsx`          | Client    | Domain detail view with tabs    |
| `/domain/[name]/records`  | `app/domain/[name]/records/page.tsx`  | Client    | **DEDICATED RECORDS PAGE**      |
| `/domain/[name]/renew`    | `app/domain/[name]/renew/page.tsx`    | Client    | Domain renewal                  |
| `/domain/[name]/transfer` | `app/domain/[name]/transfer/page.tsx` | Client    | Domain transfer                 |
| `/register/[name]`        | `app/register/[name]/page.tsx`        | Client    | Domain registration             |
| `/profile`                | `app/profile/page.tsx`                | Client    | User profile with owned domains |
| `/tld`                    | `app/tld/page.tsx`                    | Client    | TLD information page            |
| `/not-found`              | `app/not-found.tsx`                   | Server    | 404 page                        |
| `/error`                  | `app/error.tsx` (`'use client'`)      | Client    | Error boundary                  |
| (layout)                  | `app/layout.tsx`                      | Server    | Root layout with nav/footer     |

### Route Handlers (API)

| Endpoint                               | File                                           |
| -------------------------------------- | ---------------------------------------------- |
| `GET /api/domains/[name]`              | `app/api/domains/[name]/route.ts`              |
| `GET /api/domains/[name]/check`        | `app/api/domains/[name]/check/route.ts`        |
| `GET /api/domains/stats`               | `app/api/domains/stats/route.ts`               |
| `GET /api/domains/recent`              | `app/api/domains/recent/route.ts`              |
| `GET /api/register/[name]/fees/[coin]` | `app/api/register/[name]/fees/[coin]/route.ts` |

### Project Structure

```
app/
├── layout.tsx                         # Root layout (header, footer, providers)
├── page.tsx                           # Homepage (domain search)
├── not-found.tsx                      # 404 page
├── error.tsx                          # Error boundary ('use client')
├── globals.css                        # Tailwind + shadcn/ui CSS variables
│
├── domain/[name]/
│   ├── page.tsx                       # Domain detail view
│   ├── records/page.tsx               # Records management
│   ├── renew/page.tsx                 # Domain renewal
│   └── transfer/page.tsx              # Domain transfer
│
├── register/[name]/
│   └── page.tsx                       # Domain registration
│
├── profile/
│   └── page.tsx                       # User profile
│
├── tld/
│   └── page.tsx                       # TLD info
│
├── api/                               # Route Handlers
│   ├── domains/
│   │   ├── [name]/
│   │   │   ├── route.ts               # GET domain by name
│   │   │   └── check/route.ts         # GET domain availability
│   │   ├── stats/route.ts             # GET domain stats
│   │   └── recent/route.ts            # GET recent domains
│   └── register/
│       └── [name]/fees/[coin]/route.ts # GET registration fees
│
components/                            # Reusable React components
├── ui/                                # shadcn/ui components (auto-generated)
├── domain.tsx
├── domain-payment.tsx
├── domain-search.tsx
├── record.tsx
├── records.tsx
├── chip.tsx
├── connection-required.tsx
├── loading-button.tsx
├── wallet-connect-button.tsx
├── wallet-connect-status.tsx
├── domains-table.tsx
├── subdomain-registration.tsx
├── footer.tsx
├── logo.tsx
└── go-back-button.tsx

lib/                                   # Business logic
├── config.ts
├── sdk.ts
├── wallet.ts
├── api.ts
├── url.ts
├── utils.ts
├── error.ts
├── types.ts
└── stores/                            # Zustand stores
    ├── wallet-store.ts
    └── sdk-store.ts
```

---

## 11. Configuration

### Environment Variables

```bash
# Client-side (exposed to browser via NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_ENV=test|prod
NEXT_PUBLIC_LANDING_URL=<url>
NEXT_PUBLIC_WEBSITE_URL=<url>
NEXT_PUBLIC_CONTRACT_DISABLED=true|false

# Server-side only (NOT prefixed, only available in Route Handlers / Server Components)
TESTNET_PRIVATE_KEY=<key>
PROPOSALS_WALLET_PRIVATE_KEY=<key>
SENTRY_DSN=<dsn>
```

### Config Derived Values

- `browserUrl`: `https://browser[.testnet].partisiablockchain.com`
- `chainId`: `Partisia Blockchain[ Testnet]`
- `sdkEnvironment`: testnet or mainnet based on `NEXT_PUBLIC_ENV`
- `tldMigrationProposalContractAddress`: Different for mainnet vs testnet

### Next.js-Specific Notes

- Client components that access env vars must use `process.env.NEXT_PUBLIC_*`
- Server-only env vars (`TESTNET_PRIVATE_KEY`, etc.) are accessed via `process.env.*` in Route Handlers and Server Components only
- Use `next.config.ts` for build-time configuration (redirects, headers, etc.)

---

## 12. External URLs

| Service                     | URL                                                                      |
| --------------------------- | ------------------------------------------------------------------------ |
| Partisia Blockchain Browser | `https://browser[.testnet].partisiablockchain.com`                       |
| Backend GraphQL             | `https://backend.browser[.testnet].partisiablockchain.com/graphql/query` |
| Bridge                      | `{browserUrl}/bridge`                                                    |
| Explorer Transaction        | `{browserUrl}/transactions/{txId}`                                       |
| Explorer Address            | `{browserUrl}/accounts/{address}/assets` or `/contracts/{address}`       |
| Short Link                  | `https://metanam.es/{domain}`                                            |
| Docs                        | `https://docs.metanames.app`                                             |
| Telegram                    | `https://t.me/mpc_metanames`                                             |
| Twitter                     | `https://x.com/metanames_`                                               |
| GitHub                      | `https://github.com/metanames`                                           |

---

## 13. Supported Cryptocurrencies (BYOC)

| Symbol    | Name          |
| --------- | ------------- |
| PARTI     | Partisia Coin |
| BTC       | Bitcoin       |
| ETH       | Ethereum      |
| USDT      | Tether        |
| TEST_COIN | Test token    |

---

## 14. External Libraries & SDKs

### 14.1 MetaNames SDK

**Package:** `@metanames/sdk` (npm)  
**Repository:** https://github.com/metanames/sdk  
**Documentation:** https://metanames.github.io/sdk/  
**Version:** ^6.3.1

**Provides:**

- `MetaNamesSdk` - Main SDK class for blockchain interactions
- `DomainValidator` - Domain name validation
- `RecordClassEnum` - Record type enumerations
- `getRecordValidator()` - Record value validation
- `Enviroment` - Environment enum (testnet/mainnet)
- `BYOCSymbol` - Payment token symbol types

### 14.2 Partisia Blockchain SDKs

**partisia-blockchain-applications-sdk** (npm)  
**Repository:** https://gitlab.com/partisiablockchain/partisia-blockchain-applications-sdk  
**Version:** ^0.1.4

**Provides:**

- `PartisiaSdk` - Wallet connection and signing
- `connect()` - Connect to Partisia Wallet
- `setSigningStrategy()` - Set signing strategy (MetaMask, Ledger, privateKey)

**partisia-blockchain-applications-crypto** (npm)  
**Provides:**

- `privateKeyToAccountAddress()` - Derive address from private key

**@partisiablockchain/abi-client** (npm)  
**Repository:** https://gitlab.com/partisiablockchain/abi-client  
**Version:** ^6.62.0 (used: 6.93.0 latest)

**Provides:**

- ABI (Application Binary Interface) client for smart contract interaction
- Type-safe contract method calls

**@partisiablockchain/blockchain-api-transaction-client** (npm)  
**Repository:** https://gitlab.com/partisiablockchain/blockchain-api-transaction-client  
**Version:** ^6.51.0 (used: 6.71.0 latest)

**Provides:**

- Three clients for Partisia Blockchain interaction:
  - Transaction client
  - Account client
  - Contract client

**@secata-public/bitmanipulation-ts** (npm)  
**Repository:** https://github.com/partisiablockchain/bitmanipulation-ts (likely private)  
**Version:** ^3.4.0 (used: ^3.2.0)

**Provides:**

- Cryptographic utilities for Partisia Blockchain

**@ledgerhq/hw-transport-webusb** (npm)  
**Repository:** https://github.com/LedgerHQ/ledgerjs  
**Version:** ^6.33.0

**Provides:**

- `TransportWebUSB` - Ledger hardware wallet transport

**@partisiablockchain/snap** (MetaMask Snap)  
**Package ID:** `npm:@partisiablockchain/snap`

**Provides:**

- MetaMask Snap integration for Partisia Blockchain
- `wallet_requestSnaps` - Request Partisia Snap
- `wallet_invokeSnap` - Invoke snap methods (get_address)

### 14.3 Other Dependencies

| Original (Svelte)             | Next.js Replacement            | Purpose                                   |
| ----------------------------- | ------------------------------ | ----------------------------------------- |
| `@sentry/sveltekit`           | `@sentry/nextjs`               | Error tracking and performance monitoring |
| `chart.js` + `svelte-chartjs` | `chart.js` + `react-chartjs-2` | Data visualization                        |
| `date-fns`                    | `date-fns` (same)              | Date formatting                           |
| `jdenticon`                   | `jdenticon` (same)             | Avatar generation from strings            |
| `@iconify/svelte`             | `lucide-react`                 | Icon library (shadcn/ui default)          |
| `@smui/*` (8.x)               | `shadcn/ui` + `@radix-ui/*`    | UI component primitives                   |
| N/A                           | `zustand`                      | Global state management                   |
| N/A                           | `tailwindcss` (4.x)            | Utility-first CSS framework               |
| N/A                           | `@tanstack/react-table`        | Headless table (for DomainsTable)         |
| N/A                           | `sonner`                       | Toast notifications (shadcn/ui default)   |
| N/A                           | `next-themes`                  | Dark mode theme switching                 |

---

## 15. UI Components

### 15.1 shadcn/ui Components Required

Install these via `npx shadcn@latest add <component>`:

| shadcn/ui Component | Install Command                       | Replaces (SMUI)               | Used For                                        |
| ------------------- | ------------------------------------- | ----------------------------- | ----------------------------------------------- |
| `button`            | `npx shadcn@latest add button`        | `@smui/button`                | All buttons, action triggers                    |
| `card`              | `npx shadcn@latest add card`          | `@smui/card`                  | Domain cards, payment cards, record containers  |
| `dialog`            | `npx shadcn@latest add dialog`        | `@smui/dialog`                | Delete confirmation, wallet selection           |
| `input`             | `npx shadcn@latest add input`         | `@smui/textfield`             | Search input, address input, record value input |
| `textarea`          | `npx shadcn@latest add textarea`      | `@smui/textfield` (textarea)  | Record value editing                            |
| `select`            | `npx shadcn@latest add select`        | `@smui/select`                | Payment token selector, record type selector    |
| `table`             | `npx shadcn@latest add table`         | `@smui/data-table`            | Domains table on profile page                   |
| `tabs`              | `npx shadcn@latest add tabs`          | `@smui/tab` + `@smui/tab-bar` | Domain details/settings tabs                    |
| `badge`             | `npx shadcn@latest add badge`         | Custom chips                  | Available/Registered status, TESTNET badge      |
| `sonner`            | `npx shadcn@latest add sonner`        | `@smui/snackbar`              | Transaction alerts, success/error notifications |
| `dropdown-menu`     | `npx shadcn@latest add dropdown-menu` | `@smui/menu`                  | Wallet connect menu, pagination rows-per-page   |
| `alert-banner`      | `npx shadcn@latest add alert`         | `@smui/banner`                | Contract disabled banner                        |
| `progress`          | `npx shadcn@latest add progress`      | `@smui/linear-progress`       | Table loading indicator                         |
| `spinner`           | (custom or `lucide-react` Loader2)    | `@smui/circular-progress`     | Loading states                                  |
| `label`             | `npx shadcn@latest add label`         | SMUI Label                    | Form labels                                     |
| `tooltip`           | `npx shadcn@latest add tooltip`       | N/A                           | Icon button tooltips                            |
| `separator`         | `npx shadcn@latest add separator`     | `@smui/list` Separator        | Menu dividers                                   |
| `popover`           | `npx shadcn@latest add popover`       | `@smui/menu-surface`          | Wallet menu popover                             |

### 15.2 Custom Application Components

All are React client components (`'use client'`):

| Component               | File                                    | Purpose                                                    |
| ----------------------- | --------------------------------------- | ---------------------------------------------------------- |
| `Chip`                  | `components/chip.tsx`                   | Label:value display, clickable (copy to clipboard or link) |
| `ConnectionRequired`    | `components/connection-required.tsx`    | Guard content behind wallet connection                     |
| `Domain`                | `components/domain.tsx`                 | Full domain display with tabs (details/settings)           |
| `DomainPayment`         | `components/domain-payment.tsx`         | Payment flow (approve + pay)                               |
| `DomainSearch`          | `components/domain-search.tsx`          | Domain search with availability results                    |
| `GoBackButton`          | `components/go-back-button.tsx`         | Navigate back via `router.back()`                          |
| `LoadingButton`         | `components/loading-button.tsx`         | Async button with loading/success/error states             |
| `Record`                | `components/record.tsx`                 | Single record display/edit inline                          |
| `Records`               | `components/records.tsx`                | Records list with add form                                 |
| `DomainsTable`          | `components/domains-table.tsx`          | Sortable paginated domains table (`@tanstack/react-table`) |
| `SubdomainRegistration` | `components/subdomain-registration.tsx` | Free subdomain registration                                |
| `WalletConnectButton`   | `components/wallet-connect-button.tsx`  | Wallet connection dropdown menu                            |
| `WalletConnectStatus`   | `components/wallet-connect-status.tsx`  | Connection status display in header                        |
| `Footer`                | `components/footer.tsx`                 | Site footer with links                                     |
| `Logo`                  | `components/logo.tsx`                   | SVG logo (light/dark variants)                             |

### 15.3 Key Component Migration Notes

**Snackbar → Sonner Toast:**

```tsx
// Original (SMUI Snackbar) pattern:
// walletStore.alertTransaction = txHash → snackbar.open()

// Next.js (Sonner) pattern:
import { toast } from "sonner";

toast("New Transaction submitted", {
  action: {
    label: "View",
    onClick: () => window.open(explorerTransactionUrl(txHash), "_blank"),
  },
  duration: 10000,
});
```

**TabBar → shadcn Tabs:**

```tsx
// Original (SMUI TabBar):
// <TabBar tabs={[DomainTab.details, DomainTab.settings]} bind:active={activeTab}>

// Next.js (shadcn Tabs):
<Tabs defaultValue="details">
  <TabsList>
    <TabsTrigger value="details">details</TabsTrigger>
    <TabsTrigger value="settings">settings</TabsTrigger>
  </TabsList>
  <TabsContent value="details">...</TabsContent>
  <TabsContent value="settings">...</TabsContent>
</Tabs>
```

**DataTable → @tanstack/react-table + shadcn Table:**

```tsx
// Use @tanstack/react-table for sorting, pagination, filtering
// Render with shadcn/ui Table, TableHeader, TableBody, TableRow, TableCell
// Pagination with shadcn Button + Select for rows-per-page
```

**Navigation:**

```tsx
// Original: import { goto } from '$app/navigation';  goto('/path')
// Next.js:  import { useRouter } from 'next/navigation'; router.push('/path')
// For replaceState: router.replace('/path')
// For back: router.back()
```

**Dynamic Imports (Wallet SDKs):**

```tsx
// Original: const { connectPartisia } = await import('$lib/wallet');
// Next.js:  const { connectPartisia } = await import('@/lib/wallet');
// Dynamic imports work the same in Next.js for code splitting
```
