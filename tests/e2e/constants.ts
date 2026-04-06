/**
 * Shared constants for E2E tests.
 * Centralizes all magic strings, timeouts, and test data to improve maintainability.
 */

import { TEST_DOMAIN } from './helpers/wallet-helper';

// ============== Test Data ==============
export const TEST_DOMAIN_NAME = TEST_DOMAIN;
export const TEST_SUBDOMAIN = 'sub.test.mpc';
export const TLD_NAME = 'mpc';

// Valid and invalid test addresses
export const VALID_ADDRESS = '0x0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2b3c4d5';
export const INVALID_ADDRESS_SHORT = '0x0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2b3c4d'; // 41 chars (invalid)
export const INVALID_ADDRESS_TOO_SHORT = '0x0';

// ============== Timeouts (ms) ==============
export const DEBOUNCE_MS = 600;
export const SPINNER_TIMEOUT_MS = 10000;
export const LONG_API_TIMEOUT_MS = 15000;
export const SDK_INIT_TIMEOUT_MS = 3000;
export const WALLET_CONNECT_TIMEOUT_MS = 5000;
export const VISIBILITY_TIMEOUT_MS = 2000;
export const DROPWDOWN_TIMEOUT_MS = 5000;
export const PAGINATION_WAIT_MS = 300;

// ============== Selectors ==============
// Test IDs
export const SELECTORS = {
  // Wallet
  WALLET_CONNECT_BUTTON: '[data-testid="wallet-connect-button"]',
  WALLET_CONNECTED: '[data-testid="wallet-connected"]',
  
  // Domain
  DOMAIN_TITLE: '[data-testid="domain-title"]',
  TAB_SETTINGS: '[data-testid="tab-settings"]',
  TAB_DETAILS: 'role=tab[name="details"]',
  
  // Registration
  PAYMENT_TOKEN_SELECT: '[data-testid="payment-token-select"]',
  APPROVE_FEES: '[data-testid="approve-fees"]',
  
  // Records
  RECORDS_CONTAINER: '[data-testid="records-container"]',
  ADD_RECORD_FORM: '[data-testid="add-record-form"]',
  ADD_RECORD_BUTTON: '[data-testid="add-record-button"]',
  EDIT_RECORD: '[data-testid="edit-record"]',
  SAVE_RECORD: '[data-testid="save-record"]',
  CANCEL_EDIT: '[data-testid="cancel-edit"]',
  DELETE_RECORD: '[data-testid="delete-record"]',
  
  // Profile
  SEARCH_BAR: '[data-testid="search-bar"]',
} as const;

// ============== UI Text ==============
export const TEXT = {
  // Common
  CONNECT_WALLET_PROMPT: 'Connect your wallet to continue',
  GO_BACK: 'Go back',
  RENEW: 'Renew',
  TRANSFER: 'Transfer',
  
  // Sections
  PROFILE: 'Profile',
  WHOIS: 'Whois',
  SOCIAL: 'Social',
  
  // Registration
  REGISTER_DOMAIN: 'Register domain',
  REGISTER_HEADING: 'Register',
  CHECKOUT: 'content.checkout',
  PAYMENT_TOKEN_PLACEHOLDER: 'Select payment token',
  
  // Year selector
  ADD_YEAR: 'add-year',
  REMOVE_YEAR: 'remove-year',
  
  // Profile
  DOMAINS_HEADING: 'Domains',
  PROFILE_HEADING: 'Profile',
  CONNECT_TO_SEE_DOMAINS: 'Connect your wallet to see your domains',
  NO_DOMAINS_FOUND: 'No domains found',
  
  // Transfer
  TRANSFER_HEADING: 'Transfer domain',
  ADDRESS_INVALID: 'Address is invalid',
  RECIPIENT_ADDRESS_PLACEHOLDER: 'Recipient address (42 chars)',
  
  // Renewal
  RENEW_HEADING: 'Renew domain',
  YEAR: 'year',
  YEARS: 'years',
  
  // Wallet
  DISCONNECT: 'Disconnect',
  DEV_KEY_CONNECT: 'Dev Key',
  
  // Errors
  SDK_NOT_READY: 'SDK not ready',
  INVALID_URL: 'Must be a valid URL',
  INVALID_EMAIL: 'Must be a valid email',
  
  // Transaction
  TRANSACTION_SUBMITTED: 'New Transaction submitted',
  RECORD_ADDED: 'Record added successfully',
  RECORD_UPDATED: 'Record updated successfully',
  RECORD_DELETED: 'Record deleted successfully',
} as const;

// ============== Record Types ==============
export const RECORD_TYPES = ['bio', 'url', 'email'] as const;
export const PAYMENT_TOKENS = ['BTC', 'ETH', 'USDT', 'TEST_COIN'] as const;

// ============== Validation Messages ==============
export const VALIDATION_MESSAGES = {
  ONLY_LOWERCASE: 'Only lowercase letters, numbers, and hyphens allowed',
  NO_LEADING_HYPHEN: 'Cannot start or end with a hyphen',
  ADDRESS_INVALID: 'Address is invalid',
  INVALID_URL: 'Must be a valid URL',
  INVALID_EMAIL: 'Must be a valid email',
} as const;

// ============== Placeholders ==============
export const PLACEHOLDERS = {
  SEARCH_DOMAIN: 'Search for a .mpc domain...',
  RECIPIENT_ADDRESS: 'Recipient address (42 chars)',
} as const;

// ============== CSS Classes (avoid using, prefer data-testid) ==============
export const CSS_CLASSES = {
  AVATAR: '.avatar svg',
  ANIMATE_SPIN: '.animate-spin',
  CONTENT_CHECKOUT: '.content.checkout',
  WARNING_DIV: '.bg-muted.rounded-lg',
  RECORD_CONTAINER: '.record-container',
  PROFILE_CHIPS: '.flex.flex-wrap.gap-2',
  RECORDS_SECTION: '.records',
  BORDER_DESTRUCTIVE: 'border-destructive',
  TEXT_DESTRUCTIVE: 'text-destructive',
  YEAR_DISPLAY: 'span.w-20.text-center.font-medium',
} as const;

// ============== URL Patterns ==============
export const URL_PATTERNS = {
  REGISTER: /\/register\//,
  DOMAIN: /\/domain\//,
  RENEW: /\/renew/,
  TRANSFER: /\/transfer/,
  RECORDS: /\/records/,
  CONTRACTS: /\/contracts\//,
} as const;