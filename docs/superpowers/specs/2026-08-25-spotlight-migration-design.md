# MetaNames Spotlight — Migration Completion & UI/UX Overhaul Design

Date: 2026-08-25
Status: Approved (user approved in conversation; user declined spec review gate — wants to review final result only)

## Context

The Next.js app (`/app`) is a functionally far-along migration of the legacy SvelteKit app (`/app-legacy`). Core flows work: domain search, registration, renewal, transfer, records CRUD, profile, wallet connect (Partisia / MetaMask Snap / Ledger / dev key), server actions, zustand stores, API routes, vitest + Playwright suites.

Two workstreams remain:

1. **Feature parity gaps** vs legacy: runtime Sentry, robots.txt/sitemap.xml, security headers, Vercel analytics events + Speed Insights, real logo/favicon, axe a11y suite, node-compat shim verification.
2. **UI/UX overhaul**: transform the presentation layer into a distinctive, professional, engaging design — user picked **A7 "Spotlight"** (dark web3, violet beam), **dark-only**, **balanced & alive motion**.

## Design direction (locked)

- **Theme:** A7 Spotlight. Near-black canvas with a violet light beam staging the page's focal content. Everything else quiet and dark.
- **Brand:** logo-exact violet `#644BF7` as primary; light violet `#8B78FF` for glows/links. Real interlocking-link mark (from `app-legacy/static/images/logo.svg`) + wordmark + favicon.
- **Mode:** dark-only. Remove light theme + next-themes toggle; `:root` carries dark values.
- **Motion:** "balanced & alive" — fade-up on load, beam pulse (8s), animated availability state, count-up stats, button micro-feedback. All gated behind `prefers-reduced-motion`.

## 1 · Design tokens

- Canvas `#060609`; surfaces `#101018`; borders `white/8` hairlines; text `#ECECF4`, muted `#83839A`.
- `--primary: hsl(249 91% 63%)` (#644BF7); `--primary-light: #8B78FF`; availability green `#4ADE80`; destructive red for errors/irreversible actions.
- `.spotlight-beam` utility: radial violet gradient from top-center (hero + page headers).
- Typography: Geist Sans (display 800, tight tracking) + Geist Mono (addresses, hashes, tx data, labels).
- Radius base 0.75rem (echoes link-mark roundness).
- Implementation: rewrite `app/globals.css` token blocks; drop `.dark` block; remove next-themes provider + toggle entirely (dark-only, drop the dependency).

## 2 · Global chrome

- Header: real mark + wordmark, outlined TESTNET pill, Connect Wallet button (violet glow hover); sticky, blur-on-scroll.
- Footer: simplified, mono accents; landing/explorer/metanam.es links preserved.
- Logo: React component with `currentColor` fill (glow-able); favicon.png ported to `public/` + metadata icons.

## 3 · Component treatments (logic untouched)

- DomainSearch: glass input inside beam; animated availability chip (spinner → available/taken color morph); Enter-to-search preserved.
- WalletConnectButton/Status: dropdown with 3 wallets + dev-key (testnet-only); connected = violet-ringed address chip.
- Domain card: glass surface, jdenticon avatar with violet ring, tab transitions, records editor smooth expand/collapse.
- DomainPayment: clearer fee breakdown, token select w/ balance, approve→pay flow, insufficient-balance destructive states.
- DomainsTable: dark rows, hover states; tanstack logic unchanged.
- Toasts: dark glass sonner styling; tx-hash links to explorer.
- LoadingButton, Chip, ConnectionRequired, GoBackButton: restyled to system.

## 4 · Pages

- `/`: beam hero, glass search + availability preview, recent-mints ticker (existing `/api/domains/recent`), count-up stats (existing `/api/domains/stats`), 3-step how-it-works strip. (Ticker/stats/strip are NEW — legacy APIs existed but had no UI consumer.)
- `/domain/[name]`: avatar + name header under beam; glass card; owner-gated tabs (details/records); renew/transfer CTAs.
- `/register/[name]`: steps — availability confirm → years stepper + token select → fee breakdown → approve → pay; subtle success celebration.
- `/domain/[name]/renew`: same payment component, renewal copy.
- `/domain/[name]/transfer`: validated recipient, destructive "irreversible" warning styling.
- `/profile`: connection gate, address chip + copy, filter, restyled table, designed empty state.
- `/tld`: `.mpc` root domain as "root of the namespace".
- `not-found` / `error` / contract-disabled banner: on-brand, beam-lit, recovery actions.

## 5 · Infra parity

1. Sentry runtime: `instrumentation.ts`, `global-error.tsx`, client config; DSN-gated; source maps via existing `withSentryConfig`.
2. SEO: `app/robots.ts` + `app/sitemap.ts` from `NEXT_PUBLIC_WEBSITE_URL`.
3. Security headers in `next.config.ts` (exact legacy values): `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`.
4. Analytics: `@vercel/analytics` + `@vercel/speed-insights`; events `domain_registered` / `domain_renewed` / `domain_transferred`.
5. Brand: logo component, favicon, metadata/OG refresh.
6. A11y: port axe WCAG e2e suite (per-route, single-h1, focus outlines, reduced motion, live regions).
7. Verify node-compat shims necessity via wallet e2e; port only if needed.

## 6 · Testing & execution plan

- Suites stay green; component tests updated with restyles; new tests: ticker, stats, availability states, robots/sitemap.
- Verification gate each wave: `npm run lint` (tsc+prettier+eslint) + `npm run test:run` + `npm run build` + targeted e2e.
- Agent waves (max 5 parallel, per user request):
  - Wave 0: ① foundation (tokens/beam/motion/logo/favicon) ∥ ② infra parity (items 1–5)
  - Wave 1 (after foundation): ③ home+tld ∥ ④ domain+records ∥ ⑤ register/renew/transfer ∥ ⑥ profile+404/error+chrome
  - Wave 2: ⑦ axe suite + full e2e + polish sweep

## Non-goals

- No architecture changes (server actions, stores, hooks, API routes, data layer stay).
- No light mode. No i18n. No new backend endpoints. No coverage-threshold introduction.
