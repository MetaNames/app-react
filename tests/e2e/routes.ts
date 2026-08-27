import { expect, type Page } from "@playwright/test";

/**
 * The seven routes the accessibility gate walks, and the anchor that proves each one arrived on
 * its loaded branch rather than a spinner or an error redirect. The anchor plus the path check is
 * what proves arrival — `networkidle` never fires on pages that poll (the home page's recent-domains
 * ticker keeps a request in flight), so waiting for it only ever bought a 30s timeout.
 */

const unregisteredName = `zzunregistered${Date.now()}`;

export const ROUTES = [
  {
    path: "/",
    name: "home",
    anchor: "input[placeholder='Search for a .mpc domain...']",
  },
  {
    path: "/domain/test.mpc",
    name: "domain",
    anchor: "[data-testid='domain-title']",
  },
  { path: `/register/${unregisteredName}`, name: "register", anchor: "h1" },
  { path: "/profile", name: "profile", anchor: "text=Connect your wallet" },
  { path: "/tld", name: "tld", anchor: "[data-testid='domain-title']" },
  { path: "/domain/test.mpc/renew", name: "renew", anchor: "h1" },
  { path: "/domain/test.mpc/transfer", name: "transfer", anchor: "h1" },
] as const;

export type Route = (typeof ROUTES)[number];

/**
 * Navigate to `route` and return only once the page is provably the one that was asked for: its
 * loaded-branch anchor is visible, and the URL is still the path that was requested (several of
 * these routes redirect away while loading — e.g. /domain/[name] to /register/[name] on a
 * confirmed absence, or /register/[name] to /domain/[name] if it is already taken).
 */
export async function gotoLoaded(page: Page, route: Route) {
  await page.goto(route.path, { waitUntil: "domcontentloaded" });
  await expect(page.locator(route.anchor).first()).toBeVisible({
    timeout: 15000,
  });
  expect(new URL(page.url()).pathname).toBe(route.path);
}
