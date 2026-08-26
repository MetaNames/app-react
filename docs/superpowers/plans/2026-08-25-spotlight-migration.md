# Spotlight Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close all feature-parity gaps vs `../app-legacy` and transform the UI into the approved "A7 Spotlight" dark-only design (#644BF7 violet, beam motif, balanced motion) without breaking any working flow or test.

**Architecture:** Presentation-layer transformation on the existing Next.js 16 App Router app. Server actions, zustand stores, hooks, API routes, and data layer are untouched. Design system lands first (tokens + utilities + logo), infra parity lands in parallel, then pages are restyled wave-by-wave by parallel agents. All `data-testid`s and structural CSS hooks (`.content.checkout`, `.avatar`, `.domain`, `.records`, `.record-container`, `.add-record`) MUST be preserved — ~142 Playwright e2e tests depend on them.

**Tech Stack:** Next.js 16.2.2 (read bundled docs at `node_modules/next/dist/docs/` before Next-specific code), React 19, Tailwind v4 + shadcn tokens in `app/globals.css`, zustand, vitest + @testing-library/react, Playwright, @sentry/nextjs 10, @vercel/analytics + @vercel/speed-insights.

**Spec:** `docs/superpowers/specs/2026-08-25-spotlight-migration-design.md`

---

## Shared design language (every agent applies this)

**Token values (defined once in Task 1, referenced everywhere):**

| Token                     | Value                                           | Use              |
| ------------------------- | ----------------------------------------------- | ---------------- |
| `--background`            | `hsl(240 22% 3%)` (#060609)                     | page canvas      |
| `--card` / surfaces       | `hsl(240 20% 8%)` (#101018)                     | cards, dropdowns |
| `--border`                | `hsl(240 10% 16%)`                              | hairlines        |
| `--foreground`            | `hsl(240 20% 94%)` (#ECECF4)                    | text             |
| `--muted-foreground`      | `hsl(240 11% 60%)` (#8F8FA6)                    | secondary text   |
| `--primary`               | `hsl(249 91% 63%)` (#644BF7)                    | brand CTA        |
| `--primary-glow`          | `hsl(249 100% 74%)` (#8B78FF)                   | glows, links     |
| `--ring`                  | primary                                         | focus rings      |
| `--chip-available-bg/fg`  | `hsl(142 69% 58% / 0.12)` / `hsl(142 69% 58%)`  | available state  |
| `--chip-registered-bg/fg` | `hsl(249 91% 63% / 0.16)` / `hsl(248 100% 86%)` | taken state      |
| `--radius`                | `0.75rem`                                       | base radius      |

**Utility classes (defined once in Task 1):**

- `.spotlight-beam` — radial violet light from top-center (`::before`, `pointer-events:none`, behind content)
- `.glass-panel` — `bg white/5 + border white/10 + backdrop-blur(12px)`
- `.animate-fade-up` — fade + 12px rise on mount; `.animate-beam` — slow 8s opacity pulse
- `prefers-reduced-motion` media query zeroes all animation/transition durations (content must remain visible)

**Hard constraints for every restyle task:**

1. Keep every `data-testid` and the structural classes listed in Architecture.
2. Keep all imports/logic/state identical — change classNames and wrapper markup only, unless the task says otherwise.
3. Run `npm run test:run` (vitest) after each task; run `npm run lint` before committing.
4. Commit after each task with a conventional message.

---

## WAVE 0 — Foundation (Tasks 1–6, agents may run 1–3 and 4–6 in parallel)

### Task 1: Spotlight design tokens + utilities in globals.css

**Files:**

- Modify: `app/globals.css` (full rewrite of `:root`, delete `.dark` block, add utilities)

- [ ] **Step 1: Rewrite token blocks.** Replace `:root {...}` and remove the entire `.dark {...}` block. New `:root`:

```css
:root {
  --background: hsl(240 22% 3%);
  --foreground: hsl(240 20% 94%);
  --card: hsl(240 20% 8%);
  --card-foreground: hsl(240 20% 94%);
  --popover: hsl(240 20% 6%);
  --popover-foreground: hsl(240 20% 94%);
  --primary: hsl(249 91% 63%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(240 14% 12%);
  --secondary-foreground: hsl(240 20% 94%);
  --muted: hsl(240 14% 10%);
  --muted-foreground: hsl(240 11% 60%);
  --accent: hsl(249 91% 63% / 0.15);
  --accent-foreground: hsl(248 100% 86%);
  --destructive: hsl(0 72% 51%);
  --destructive-foreground: hsl(0 0% 100%);
  --border: hsl(240 10% 16%);
  --input: hsl(240 10% 16%);
  --ring: hsl(249 91% 63%);
  --chart-1: hsl(249 91% 63%);
  --chart-2: hsl(249 100% 74%);
  --chart-3: hsl(240 11% 60%);
  --chart-4: hsl(240 14% 30%);
  --chart-5: hsl(240 14% 20%);
  --radius: 0.75rem;
  --sidebar: hsl(240 20% 6%);
  --sidebar-foreground: hsl(240 20% 94%);
  --sidebar-primary: hsl(249 91% 63%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(240 14% 12%);
  --sidebar-accent-foreground: hsl(240 20% 94%);
  --sidebar-border: hsl(240 10% 16%);
  --sidebar-ring: hsl(249 91% 63%);
  --link: hsl(249 100% 74%);
  --link-visited: hsl(249 80% 64%);
  --chip-available-bg: hsl(142 69% 58% / 0.12);
  --chip-available-fg: hsl(142 69% 58%);
  --chip-registered-bg: hsl(249 91% 63% / 0.16);
  --chip-registered-fg: hsl(248 100% 86%);
  --glow: hsl(249 91% 63% / 0.45);
}
```

- [ ] **Step 2: Append utilities + motion after the existing `@layer base` block:**

```css
@layer utilities {
  .spotlight-beam {
    position: relative;
  }
  .spotlight-beam::before {
    content: "";
    position: absolute;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
    width: min(120vw, 960px);
    height: 480px;
    background: radial-gradient(
      50% 60% at 50% 0%,
      var(--glow) 0%,
      transparent 72%
    );
    pointer-events: none;
    z-index: 0;
    animation: beam-pulse 8s ease-in-out infinite;
  }
  .glass-panel {
    background: hsl(0 0% 100% / 0.05);
    border: 1px solid hsl(0 0% 100% / 0.1);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .text-glow {
    text-shadow: 0 0 24px var(--glow);
  }
  .animate-fade-up {
    animation: fade-up 0.5s ease-out both;
  }
}

@keyframes beam-pulse {
  0%,
  100% {
    opacity: 0.85;
  }
  50% {
    opacity: 1;
  }
}
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Update `@layer base` link colors** to keep `a { color: hsl(var(--link)) }` working — change the two `--link` vars usage to `a { color: var(--link); }` / `a:visited { color: var(--link-visited); }` since values are no longer bare HSL triples.

- [ ] **Step 4: Verify:** `npm run test:run` passes (no component asserts `.dark` classes); `npm run lint` passes.
- [ ] **Step 5: Commit** `feat: spotlight design tokens and motion utilities`

### Task 2: Real logo component + favicon + metadata

**Files:**

- Modify: `components/logo.tsx` (full rewrite)
- Modify: `components/__tests__/logo.test.tsx` (update assertions)
- Create: `app/icon.png` (copied from legacy)
- Modify: `app/layout.tsx` metadata (done in Task 6, coordinate: only metadata fields here)

- [ ] **Step 1: Copy brand assets from legacy:**

```bash
cp ../app-legacy/static/favicon.png app/icon.png
cp ../app-legacy/static/images/logo.svg public/logo.svg
```

- [ ] **Step 2: Update the failing test first** — in `components/__tests__/logo.test.tsx`, change assertions to expect the accessible name `metanames` (lowercase) and an `svg` with `viewBox "275 35 250 430"`:

```tsx
it("renders the link mark and wordmark", () => {
  render(<Logo />);
  const link = screen.getByRole("link", { name: /metanames/i });
  expect(link).toHaveAttribute("href", "/");
  expect(link.querySelector("svg")).toHaveAttribute(
    "viewBox",
    "275 35 250 430",
  );
});
```

Run `npx vitest run components/__tests__/logo.test.tsx` → expect FAIL (current logo is an "M" box).

- [ ] **Step 3: Rewrite `components/logo.tsx`:**

```tsx
import Link from "next/link";

export function LogoMark({
  size = 26,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={(size * 250) / 430}
      height={size}
      viewBox="275 35 250 430"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M400,46.88c-65.52,0-118.63,53.11-118.63,118.63v72.81c25.72,0,46.58-20.85,46.58-46.58v-29.28c0-39.48,32-71.48,71.48-71.48h1.14c39.48,0,71.48,32,71.48,71.48v7.85c0,11.55-4.3,22.7-12.06,31.25l-92.93,102.46c-17.28,19.05-15.85,48.51,3.21,65.79l120.6-132.55c17.86-19.63,27.76-45.22,27.76-71.77C518.63,99.99,465.52,46.88,400,46.88z"
      />
      <path
        fill="currentColor"
        d="M400,452.99c65.52,0,118.63-53.11,118.63-118.63v-72.81c-25.72,0-46.58,20.85-46.58,46.58v29.28c0,39.48-32,71.48-71.48,71.48h-1.14c-39.48,0-71.48-32-71.48-71.48v-7.85c0-11.55,4.3-22.7,12.06-31.25l92.93-102.46c17.28-19.05,15.85-48.51-3.21-65.79L309.14,262.6c-17.86,19.63-27.76,45.22-27.76,71.77C281.37,399.88,334.48,452.99,400,452.99z"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 font-extrabold text-lg tracking-tight text-foreground"
    >
      <LogoMark
        size={30}
        className="text-primary drop-shadow-[0_0_10px_var(--glow)]"
      />
      metanames
    </Link>
  );
}
```

- [ ] **Step 4: Verify:** `npx vitest run components/__tests__/logo.test.tsx` → PASS. `npm run test:run` → PASS.
- [ ] **Step 5: Commit** `feat: real MetaNames logo mark, favicon, wordmark`

### Task 3: Dark-only providers + layout chrome

**Files:**

- Modify: `components/providers.tsx` (remove next-themes)
- Modify: `app/layout.tsx` (metadata, html attrs, banner styling)
- Modify: `package.json` via `npm uninstall next-themes`

- [ ] **Step 1:** `npm uninstall next-themes`
- [ ] **Step 2: providers.tsx** — delete the `ThemeProvider` import and wrapper; `Providers` returns:

```tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <SdkInitializer />
      <AlertWatcher />
      {children}
      <Toaster />
    </div>
  );
}
```

- [ ] **Step 3: layout.tsx** — replace `metadata` with:

```tsx
const websiteUrl = config.websiteUrl ?? "https://app.metanames.app/";

export const metadata: Metadata = {
  metadataBase: new URL(websiteUrl),
  title: {
    default: "MetaNames – .mpc Domain Name Service",
    template: "%s | MetaNames",
  },
  description: "Register and manage .mpc domains on Partisia Blockchain",
  openGraph: {
    title: "MetaNames – .mpc Domain Name Service",
    description: "Register and manage .mpc domains on Partisia Blockchain",
    url: websiteUrl,
    siteName: "MetaNames",
    type: "website",
  },
};
```

(Read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` first — metadataBase is required to avoid build errors on relative OG URLs.) Check `lib/config.ts` for the exact `websiteUrl` property name; if absent, add `websiteUrl` to `lib/config.ts` reading `process.env.NEXT_PUBLIC_WEBSITE_URL` with the fallback above, following the file's existing pattern.

- [ ] **Step 4: layout.tsx** — on `<html>` remove `suppressHydrationWarning` if only used for next-themes; add `className={`${geistSans.variable} ${geistMono.variable}`}` (keep). Restyle the contract-disabled banner: replace `bg-yellow-50 dark:bg-yellow-900/20` with `bg-destructive/15 text-foreground border-destructive/40`.
- [ ] **Step 5: Verify:** `npm run test:run`, `npm run lint`, then `npm run build` must succeed (metadataBase errors surface here).
- [ ] **Step 6: Commit** `feat: dark-only theming, metadata base, brand banner`

### Task 4: Sentry runtime wiring

**Files:**

- Create: `instrumentation.ts` (project root, NOT in app/)
- Create: `instrumentation-client.ts` (project root)
- Create: `app/global-error.tsx`
- Modify: `.env.local.example` (document `NEXT_PUBLIC_SENTRY_DSN`)

Read first: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md` and the error.md Global Error section.

- [ ] **Step 1: `instrumentation.ts`:**

```ts
import * as Sentry from "@sentry/nextjs";

export async function register() {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  const environment = process.env.NEXT_PUBLIC_ENV === "prod" ? "prod" : "test";
  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === "prod" ? 0.1 : 1.0,
  });
}

export const onRequestError = Sentry.captureRequestError;
```

- [ ] **Step 2: `instrumentation-client.ts`:**

```ts
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_ENV === "prod" ? "prod" : "test",
    tracesSampleRate: process.env.NEXT_PUBLIC_ENV === "prod" ? 0.1 : 1.0,
  });
}
```

- [ ] **Step 3: `app/global-error.tsx`** (must render its own html/body; inline dark styles because root layout is replaced):

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          background: "#060609",
          color: "#ECECF4",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
        }}
      >
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Something went wrong
          </h2>
          <p style={{ color: "#8F8FA6" }}>{error.message}</p>
          <button
            onClick={() => unstable_retry()}
            style={{
              background: "#644BF7",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "10px 20px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 4:** append to `.env.local.example`:

```bash
# Sentry (server + client). Client capture requires the NEXT_PUBLIC_ variant.
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

- [ ] **Step 5: Verify:** `npm run build` succeeds with and without `SENTRY_DSN` set.
- [ ] **Step 6: Commit** `feat: runtime Sentry (server, client, global-error)`

### Task 5: SEO routes (robots + sitemap) and CSP fix

**Files:**

- Create: `app/robots.ts`
- Create: `app/sitemap.ts`
- Modify: `next.config.ts` (remove broken CSP)

Read first: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md` and `sitemap.md`.

- [ ] **Step 1: `app/robots.ts`:**

```ts
import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${config.websiteUrl}sitemap.xml`,
  };
}
```

- [ ] **Step 2: `app/sitemap.ts`:**

```ts
import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: config.websiteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
```

- [ ] **Step 3: next.config.ts** — delete the entire `Content-Security-Policy` header entry (the value is corrupted — `"https://*. RPC endpoints"` — and legacy deliberately shipped no CSP because wallet extensions, Sentry and Vercel make a correct policy brittle). Keep the three security headers untouched.
- [ ] **Step 4:** ensure `config.websiteUrl` exists in `lib/config.ts` (see Task 3 Step 3) with trailing slash preserved, e.g. `"https://app.metanames.app/"`.
- [ ] **Step 5: Verify:** `npm run build`, then `npm run start` (or dev) and `curl localhost:3000/robots.txt` and `curl localhost:3000/sitemap.xml` return expected content.
- [ ] **Step 6: Commit** `feat: robots.txt and sitemap.xml, drop broken CSP`

### Task 6: Vercel Analytics + Speed Insights + conversion events

**Files:**

- Modify: `package.json` (`npm i @vercel/analytics @vercel/speed-insights`)
- Modify: `app/layout.tsx` (mount components)
- Modify: `lib/hooks/use-domain-payment.ts` (track register/renew success)
- Modify: `app/domain/[name]/transfer/page.tsx` (track transfer success)

- [ ] **Step 1:** `npm i @vercel/analytics @vercel/speed-insights`
- [ ] **Step 2: layout.tsx** — import and mount inside `<body>` (after `<Footer />`):

```tsx
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
...
        <Analytics />
        <SpeedInsights />
```

- [ ] **Step 3: use-domain-payment.ts** — in the register success path and renew success path (after the success toast), add:

```ts
import { track } from "@vercel/analytics";
...
track(mode === "register" ? "domain_registered" : "domain_renewed");
```

- [ ] **Step 4: transfer page** — after successful transfer (same spot as the success toast): `track("domain_transferred");`
- [ ] **Step 5: Verify:** `npm run test:run` (hooks tests must still pass — `track` is a client call; if a unit test executes those paths, `vi.mock("@vercel/analytics", () => ({ track: vi.fn() }))` in the affected test file), `npm run build`.
- [ ] **Step 6: Commit** `feat: vercel analytics, speed insights, conversion events`

---

## WAVE 1 — Pages & components (Tasks 7–12, four agents in parallel after Wave 0)

### Task 7: Homepage — beam hero, ticker, stats, how-it-works (agent C)

**Files:**

- Modify: `app/page.tsx` (full rewrite)
- Create: `components/recent-domains-ticker.tsx` + `components/__tests__/recent-domains-ticker.test.tsx`
- Create: `components/domain-stats.tsx` + `components/__tests__/domain-stats.test.tsx`
- Create: `components/how-it-works.tsx`

- [ ] **Step 1: failing tests first.** `recent-domains-ticker.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RecentDomainsTicker } from "../recent-domains-ticker";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("RecentDomainsTicker", () => {
  beforeEach(() => mockFetch.mockReset());

  it("renders nothing while loading", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<RecentDomainsTicker />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders fetched domain pills", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ name: "alice.mpc" }, { name: "bob.mpc" }],
    });
    render(<RecentDomainsTicker />);
    await waitFor(() =>
      expect(screen.getByText("alice.mpc")).toBeInTheDocument(),
    );
    expect(screen.getByText("bob.mpc")).toBeInTheDocument();
  });

  it("renders nothing on fetch error", async () => {
    mockFetch.mockRejectedValue(new Error("network"));
    const { container } = render(<RecentDomainsTicker />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
```

`domain-stats.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DomainStats } from "../domain-stats";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("DomainStats", () => {
  beforeEach(() => mockFetch.mockReset());

  it("renders counts from the stats API", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        domainCount: 1204,
        ownerCount: 486,
        recentDomains: [],
      }),
    });
    render(<DomainStats />);
    await waitFor(() => expect(screen.getByText(/1,204/)).toBeInTheDocument());
    expect(screen.getByText(/486/)).toBeInTheDocument();
    expect(screen.getByText("DOMAINS")).toBeInTheDocument();
    expect(screen.getByText("OWNERS")).toBeInTheDocument();
  });

  it("renders nothing on error", async () => {
    mockFetch.mockRejectedValue(new Error("network"));
    const { container } = render(<DomainStats />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
```

Run both → FAIL (files don't exist).

- [ ] **Step 2: implement `components/recent-domains-ticker.tsx`:**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RecentDomain {
  name: string;
  createdAt: string;
}

export function RecentDomainsTicker() {
  const [domains, setDomains] = useState<RecentDomain[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/domains/recent")
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("bad status")),
      )
      .then((data: RecentDomain[]) => {
        if (!cancelled) setDomains(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (domains.length === 0) return null;

  return (
    <div
      className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto animate-fade-up"
      aria-label="Recently registered domains"
    >
      {domains.slice(0, 6).map((d) => (
        <Link
          key={d.name}
          href={`/domain/${d.name}`}
          className="text-xs px-3 py-1.5 rounded-full glass-panel text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
        >
          <span aria-hidden="true" className="text-primary mr-1">
            ✦
          </span>
          {d.name}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: implement `components/domain-stats.tsx`:**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface Stats {
  domainCount: number;
  ownerCount: number;
}

function useCountUp(target: number | null, duration = 900): number {
  const [value, setValue] = useState(0);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  useEffect(() => {
    if (target == null) return;
    if (reducedMotion.current) {
      setValue(target);
      return;
    }
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

const formatCount = (n: number) => n.toLocaleString("en-US");

export function DomainStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/domains/stats")
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("bad status")),
      )
      .then((data: Stats) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const domains = useCountUp(stats?.domainCount ?? null);
  const owners = useCountUp(stats?.ownerCount ?? null);

  if (!stats) return null;

  return (
    <div
      className="flex justify-center gap-12 animate-fade-up"
      aria-label="Network statistics"
    >
      <div className="text-center">
        <div className="text-2xl font-extrabold text-primary">
          {formatCount(domains)}
        </div>
        <div className="text-[10px] tracking-[0.2em] text-muted-foreground">
          DOMAINS
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-extrabold text-primary">
          {formatCount(owners)}
        </div>
        <div className="text-[10px] tracking-[0.2em] text-muted-foreground">
          OWNERS
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: implement `components/how-it-works.tsx`** (server component):

```tsx
const steps = [
  { icon: "🔍", title: "Search", body: "Find your perfect .mpc name" },
  {
    icon: "⛓️",
    title: "Register",
    body: "Pay in your favorite token, minted on-chain",
  },
  { icon: "🔗", title: "Link", body: "Add social profiles, avatars & records" },
];

export function HowItWorks() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto w-full px-4">
      {steps.map((s) => (
        <div key={s.title} className="glass-panel rounded-2xl p-5 text-center">
          <div className="text-2xl mb-2" aria-hidden="true">
            {s.icon}
          </div>
          <div className="font-bold text-sm mb-1">{s.title}</div>
          <div className="text-xs text-muted-foreground leading-relaxed">
            {s.body}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: rewrite `app/page.tsx`:**

```tsx
import { DomainSearch } from "@/components/domain-search";
import { RecentDomainsTicker } from "@/components/recent-domains-ticker";
import { DomainStats } from "@/components/domain-stats";
import { HowItWorks } from "@/components/how-it-works";

export default function HomePage() {
  return (
    <div className="spotlight-beam flex flex-col items-center justify-center flex-1 gap-10 py-16 w-full">
      <div className="relative z-10 text-center flex flex-col gap-3 max-w-2xl mx-auto px-4 animate-fade-up">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-balance">
          Own your name on the Partisia Blockchain
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          One identity for everything you do on-chain
        </p>
      </div>
      <div className="relative z-10 w-full max-w-xl px-4">
        <DomainSearch />
      </div>
      <div className="relative z-10 w-full">
        <RecentDomainsTicker />
      </div>
      <div className="relative z-10">
        <DomainStats />
      </div>
      <div className="relative z-10 mt-4">
        <HowItWorks />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify:** `npx vitest run components/__tests__/recent-domains-ticker.test.tsx components/__tests__/domain-stats.test.tsx` → PASS; `npm run test:run`; `npm run lint`.
- [ ] **Step 7: Commit** `feat: spotlight homepage with ticker, stats, how-it-works`

### Task 8: DomainSearch spotlight restyle + a11y live region (agent C)

**Files:**

- Modify: `components/domain-search.tsx` (className/markup changes only + one a11y wrapper)
- Test: `components/__tests__/domain-search.test.tsx` (must pass unchanged)

- [ ] **Step 1: Restyle the search container.** Replace the outer `<div className="w-full max-w-xl mx-auto flex flex-col gap-3">` with:

```tsx
<div className="w-full max-w-xl mx-auto flex flex-col gap-3">
  <div className="glass-panel rounded-2xl p-1.5 flex items-center gap-2 shadow-[0_0_50px_var(--glow)] border-primary/30 focus-within:border-primary/60 transition-colors">
```

Remove the old `relative` + `Search` icon absolute wrapper; instead put `<Search className="ml-3 h-4 w-4 text-muted-foreground shrink-0" />` inline before the Input. Change Input to `className={`pl-2 text-lg h-12 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${error ? "text-destructive" : ""}`}`.

- [ ] **Step 2: Restyle the Search button.** Replace the Input-only layout: wrap Input and a submit affordance — keep the existing Input + Enter behavior, and add a styled button after the Input:

```tsx
<button
  type="button"
  onClick={triggerSearch}
  className="bg-primary text-primary-foreground rounded-xl px-5 h-10 text-sm font-bold hover:bg-primary/90 transition-colors shrink-0"
>
  Search
</button>
```

(`triggerSearch` already exists in the component.)

- [ ] **Step 3: a11y live region.** Wrap the result card block (`{loading || result ? ... }`) in:

```tsx
<div role="status" aria-live="polite">
  {/* existing Link + Card result block, restyled below */}
</div>
```

Restyle the result `Card` → `<Card className="glass-panel border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">` and the availability Badge classes to `bg-[hsl(var(--chip-available-bg))] text-[hsl(var(--chip-available-fg))]` / registered equivalents (they already use these vars — keep).

- [ ] **Step 4: Verify:** `npx vitest run components/__tests__/domain-search.test.tsx` → ALL PASS unchanged (testids/text unchanged).
- [ ] **Step 5: Commit** `feat: spotlight search bar with live region`

### Task 9: Domain detail, records, avatar restyle (agent D)

**Files:**

- Modify: `components/domain.tsx`, `components/domain-details.tsx`, `components/domain-avatar.tsx`, `components/records.tsx`, `components/record.tsx`, `components/records-add-form.tsx`

- [ ] **Step 1: `domain.tsx`** — wrap the whole component return in the beam + glass: root div becomes `className="spotlight-beam flex flex-col gap-6 w-full max-w-2xl relative z-10 animate-fade-up"`. Header row: avatar wrapper `<div className="avatar p-1 rounded-2xl ring-2 ring-primary/40 shadow-[0_0_24px_var(--glow)]">`. Keep `data-testid="domain-title"` h5 (bump to `text-3xl font-extrabold tracking-tight`). Tabs: `<TabsList className="glass-panel rounded-xl p-1 bg-transparent">`, triggers keep testids. Settings action row: `Renew`/`Transfer` become `<Button variant="outline" className="border-primary/40 hover:border-primary hover:bg-primary/10">`.
- [ ] **Step 2: `domain-avatar.tsx`** — change svg className from `rounded-lg` to `rounded-xl` (keep logic).
- [ ] **Step 3: `domain-details.tsx`** — section headings `h5` → `className="font-semibold mb-3 text-xs uppercase tracking-[0.15em] text-muted-foreground"`. Wrap each section's chip group in `className="flex flex-wrap gap-2"`. Keep all Chips and hrefs identical.
- [ ] **Step 4: `records.tsx` / `record.tsx` / `records-add-form.tsx`** — keep ALL testids and `.records`/`.record-container`/`.add-record` classes. `records.tsx` root: add `glass-panel rounded-2xl p-4` alongside existing classes. `record.tsx` row: `py-3 border-b border-border/60 last:border-0`. `records-add-form.tsx`: Card gets `className="add-record glass-panel border-border/60"`; keep everything else.
- [ ] **Step 5: Verify:** `npm run test:run` (records + record tests must pass unchanged); `npm run lint`.
- [ ] **Step 6: Commit** `feat: spotlight domain detail and records styling`

### Task 10: Register / renew / transfer checkout restyle + years stepper fix (agent E)

**Files:**

- Modify: `components/domain-payment.tsx`
- Modify: `app/register/[name]/RegisterPageClient.tsx`, `app/register/[name]/page.tsx` (wrapper only)
- Modify: `app/domain/[name]/renew/page.tsx`, `app/domain/[name]/transfer/page.tsx`
- Modify: `components/subdomain-registration.tsx`

- [ ] **Step 1: VERIFY the years stepper first.** Read `components/domain-payment.tsx`. The hook returns `years`/`setYears` and e2e tests (`tests/e2e/domain-registration.spec.ts`, `RegisterPage` POM `addYearButton`/`removeYearButton`/`yearDisplay`) require add/remove year buttons rendering "1 year"/"2 years". If the buttons are NOT in the JSX, insert this block between `CardHeader` and the fee breakdown (keep `data-testid`s from `tests/e2e/constants.ts` SELECTORS — read that file and match exactly, expected: `add-year-button`, `remove-year-button`, `year-display` or per constants):

```tsx
<div className="flex items-center justify-between">
  <span className="font-medium">Years</span>
  <div className="flex items-center gap-3">
    <Button
      variant="outline"
      size="icon"
      data-testid="remove-year-button"
      aria-label="Remove year"
      disabled={years <= 1}
      onClick={() => setYears((y) => Math.max(1, y - 1))}
    >
      <Minus className="h-4 w-4" />
    </Button>
    <span
      data-testid="year-display"
      className="min-w-16 text-center font-semibold"
    >
      {years} {years === 1 ? "year" : "years"}
    </span>
    <Button
      variant="outline"
      size="icon"
      data-testid="add-year-button"
      aria-label="Add year"
      onClick={() => setYears((y) => Math.min(10, y + 1))}
    >
      <Plus className="h-4 w-4" />
    </Button>
  </div>
</div>
```

Match the exact testids to `tests/e2e/constants.ts` — if constants differ (e.g. `year-add`), use those. If the stepper IS already rendered, restyle only.

- [ ] **Step 2: `domain-payment.tsx` restyle.** Card: `className="w-full max-w-lg content checkout glass-panel border-primary/20 shadow-[0_0_60px_rgba(100,75,247,0.15)]"`. CardTitle: `Register {domain}` → wrap domain in `<span className="text-primary">{domain}</span>`. Fee breakdown box: `className="flex flex-col gap-2 py-3 border-t border-b border-border/60 rounded-none"` with the total row `text-base font-bold`. Approve button keeps `data-testid="approve-fees"`. Submit button: add `className="w-full shadow-[0_0_24px_var(--glow)]"` (merging with existing).
- [ ] **Step 3: `RegisterPageClient.tsx`** — root div: `className="spotlight-beam flex flex-col items-center gap-6 content checkout max-w-2xl mx-auto px-4 w-full relative z-10 animate-fade-up"`; h2 → `text-3xl font-extrabold tracking-tight`. Keep loading spinner but wrap: `<div className="flex justify-center py-24" role="status" aria-label="Loading the registration form">`.
- [ ] **Step 4: `subdomain-registration.tsx`** — Card gets `glass-panel border-primary/20`; FREE price keeps `--chip-available-fg` var; keep testids.
- [ ] **Step 5: renew page** — root: `className="flex flex-col gap-6 max-w-lg w-full mx-auto animate-fade-up"`; h2 → `text-3xl font-extrabold tracking-tight`. Keep GoBackButton + DomainPayment.
- [ ] **Step 6: transfer page** — root: add `spotlight-beam relative z-10 animate-fade-up` + `w-full`; warning box: replace `bg-muted rounded-lg` with `glass-panel rounded-2xl border-destructive/30 bg-destructive/5 p-4` (keep both `<strong>` lines + copy). Keep `recipient-input` id/testids and the `border-destructive` validation class (e2e asserts it).
- [ ] **Step 7: Verify:** `npm run test:run`; `npm run lint`. Then targeted e2e if `TESTNET_PRIVATE_KEY` is available: `npx playwright test tests/e2e/domain-registration.spec.ts` — year-button tests must pass.
- [ ] **Step 8: Commit** `feat: spotlight checkout flows, restore years stepper`

### Task 11: Header, footer, wallet button, toasts (agent F)

**Files:**

- Modify: `components/header.tsx`, `components/footer.tsx`, `components/wallet-connect-button.tsx`, `components/providers.tsx` (Toaster theme only)

- [ ] **Step 1: `header.tsx`** — header element: `className="border-b border-border/60 sticky top-0 z-50 bg-background/70 backdrop-blur-xl"`; TESTNET Badge → `<Badge variant="outline" className="text-[10px] tracking-[0.15em] text-muted-foreground border-border">TESTNET</Badge>` (keep `config.isTestnet` logic); nav links add `hover:text-primary transition-colors`.
- [ ] **Step 2: `wallet-connect-button.tsx`** — disconnected trigger: `className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2 text-sm font-semibold shadow-[0_0_20px_var(--glow)] hover:shadow-[0_0_32px_var(--glow)] transition-shadow"` (keep `data-testid="wallet-connect-button"`). Connected trigger: `className="gap-2 border border-primary/40 bg-primary/10 hover:bg-primary/20 text-foreground rounded-xl px-3 py-2 text-sm font-medium transition-colors"` (keep `data-testid="wallet-connected"`). DropdownMenuContent: add `className="glass-panel border-border/60"` (keep all menu items/testids).
- [ ] **Step 3: `footer.tsx`** — footer: `className="border-t border-border/60 mt-auto py-6 relative z-10"`; links: `text-xs text-muted-foreground hover:text-primary transition-colors tracking-wide`; add mono style to the link row: `font-mono` on the container.
- [ ] **Step 4: `providers.tsx`** — `<Toaster />` → `<Toaster theme="dark" toastOptions={{ style: { background: "hsl(240 20% 8%)", border: "1px solid hsl(240 10% 16%)", color: "hsl(240 20% 94%)" } }} />`.
- [ ] **Step 5: Verify:** `npm run test:run` (footer + any header tests), `npm run lint`.
- [ ] **Step 6: Commit** `feat: spotlight chrome — header, footer, wallet button, toasts`

### Task 12: Profile, TLD, error pages, chips, misc components (agent F)

**Files:**

- Modify: `app/profile/page.tsx` (wrapper), `app/profile/ProfilePageClient.tsx`, `components/domains-table.tsx` (+search/pagination/columns className tweaks), `app/tld/TldPageClient.tsx`, `app/error.tsx`, `app/not-found.tsx`, `components/chip.tsx`, `components/connection-required.tsx`, `components/loading-button.tsx`, `components/go-back-button.tsx`, `app/domain/[name]/loading.tsx` (if exists) and other `loading.tsx` files

- [ ] **Step 1: `ProfilePageClient.tsx`** — root: `className="spotlight-beam flex flex-col gap-8 w-full relative z-10 animate-fade-up"`; h1 `Profile` → `text-4xl font-extrabold tracking-tight`; keep the disconnected state text + `role="status"` exactly (e2e asserts "Connect your wallet to see your domains").
- [ ] **Step 2: `domains-table.tsx`** — scroll container: `className="overflow-x-auto rounded-2xl border border-border/60 glass-panel"`; empty-state cell keeps text. `domains-table-search.tsx`: Input container unchanged, keep `data-testid="search-bar"`. Pagination buttons `variant="outline"` → add `border-border/60`.
- [ ] **Step 3: `TldPageClient.tsx`** — root: `className="spotlight-beam flex flex-col gap-6 relative z-10 animate-fade-up"`; h1 → `text-3xl font-extrabold tracking-tight`; add subtitle `<p className="text-muted-foreground">The root of the .mpc namespace</p>`.
- [ ] **Step 4: `not-found.tsx`** — root: `className="spotlight-beam flex flex-col items-center justify-center gap-6 py-24 text-center relative z-10 w-full"`; `404` h1: `className="text-7xl font-extrabold text-primary text-glow"`; keep copy + Go home button.
- [ ] **Step 5: `error.tsx`** — same beam treatment; keep `console.error` effect and `reset` button; button gets `shadow-[0_0_24px_var(--glow)]`.
- [ ] **Step 6: `chip.tsx`** — keep variant map + all testids/behavior. Base pill classes → `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-90 transition-all border border-transparent`, and add a copy announcement: next to the Check/Copy icon add `{copied && <span role="status" className="sr-only">Copied to the clipboard</span>}` (uses existing `copied` state).
- [ ] **Step 7: `connection-required.tsx`** — default fallback: add an icon + button styling but KEEP the exact text "Connect your wallet to continue" and classes `text-muted-foreground text-lg` (a component test asserts these classes). Only add `animate-fade-up` to the container (test asserts container classes `flex flex-col items-center justify-center py-12 text-center gap-4` — keep all of them, append `animate-fade-up`).
- [ ] **Step 8: `loading-button.tsx`** — no structural change; ensure spinner keeps `animate-spin`.
- [ ] **Step 9: all `loading.tsx` route files** — restyle spinner wrappers to `flex justify-center py-24` with `<Loader2 className="h-8 w-8 animate-spin text-primary" />` and wrap in `<div role="status" aria-label="Loading">` (a11y parity with legacy).
- [ ] **Step 10: Verify:** `npm run test:run` (chip + connection-required tests MUST pass — they assert exact classes), `npm run lint`.
- [ ] **Step 11: Commit** `feat: spotlight profile, tld, error pages and chip polish`

---

## WAVE 2 — Verification & a11y (Tasks 13–15, sequential-ish)

### Task 13: Accessibility e2e suite (port of legacy a11y.spec.ts)

**Files:**

- Create: `tests/e2e/a11y.spec.ts`
- Create: `tests/e2e/routes.ts`

- [ ] **Step 1:** `npm i -D axe-core` (test-only dep).
- [ ] **Step 2: create `tests/e2e/routes.ts`** — port of legacy helper with new-app anchors (loaded-branch proof + path assertion):

```ts
import { expect, type Page } from "@playwright/test";

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
  { path: `/register/${unregisteredName}`, name: "register", anchor: "h2" },
  { path: "/profile", name: "profile", anchor: "text=Connect your wallet" },
  { path: "/tld", name: "tld", anchor: "[data-testid='domain-title']" },
  { path: "/domain/test.mpc/renew", name: "renew", anchor: "h2" },
  { path: "/domain/test.mpc/transfer", name: "transfer", anchor: "h2" },
] as const;

export type Route = (typeof ROUTES)[number];

export async function gotoLoaded(page: Page, route: Route) {
  await page.goto(route.path, { waitUntil: "networkidle" });
  await expect(page.locator(route.anchor).first()).toBeVisible({
    timeout: 15000,
  });
  expect(new URL(page.url()).pathname).toBe(route.path);
}
```

- [ ] **Step 3: create `tests/e2e/a11y.spec.ts`** — port legacy structure verbatim with these adaptations: inject `axe-core/axe.min.js` via `createRequire` (same as legacy); scan with TAGS `['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']`; per-route "has no violations" + "exactly one h1" loops using `gotoLoaded`. Replace legacy MDC selectors: search-result live region check → fill `input[placeholder='Search for a .mpc domain...']` with "test", expect the `role="status"` wrapper (from Task 8) to contain a link; register loading announcement → `div[role="status"][aria-label="Loading the registration form"]`; chip copy announcement → click a chip button containing "link" on `/domain/test.mpc`, expect `[role="status"]` sr-only text; focus-ring luminance helper ported verbatim, selectors: `header a` (logo), `[data-testid='wallet-connect-button']`, and a chip `button` on `/domain/test.mpc`; reduced-motion test → with `reducedMotion: 'reduce'` context, assert `getComputedStyle` transitionDuration < 0.05s on the wallet button AND that clicking it still opens the dropdown menu (content visible, motion suppressed). Skip legacy snackbar-ring and 400%-zoom variants (MDC-specific); keep the 320px focus-ring pass only if selectors hold.
- [ ] **Step 4: run** `npx playwright test tests/e2e/a11y.spec.ts` — fix violations it finds (expected candidates: contrast on muted text, missing alt/aria-labels, focus indicators) — violations are real bugs: fix them in components, not by weakening the scan.
- [ ] **Step 5: Commit** `test: axe WCAG 2.2 A+AA e2e suite`

### Task 14: Node-compat shim verification + API security-headers test

**Files:**

- Create: `tests/e2e/security-headers.spec.ts` (port of legacy api test, simplified)
- No shims unless proven needed

- [ ] **Step 1: Verify wallet flows without shims:** with `TESTNET_PRIVATE_KEY` present in `.env.local`, run `npx playwright test tests/e2e/dev-wallet.spec.ts`. If it passes, the SDK needs no node-compat shims in Next 16 — record the outcome in the commit message. If it fails with node-core module errors (crypto/stream/buffer), STOP and report back — porting the shim layer is a separate task requiring the legacy `src/lib/node-compat/` files and next.config aliasing.
- [ ] **Step 2: `tests/e2e/security-headers.spec.ts`:**

```ts
import { expect, test } from "@playwright/test";

test("security headers are present", async ({ request }) => {
  const res = await request.get("/");
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  expect(res.headers()["referrer-policy"]).toBe(
    "strict-origin-when-cross-origin",
  );
  expect(res.headers()["x-frame-options"]).toBe("DENY");
});

test("robots.txt and sitemap.xml are served", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Sitemap:");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("<urlset");
});
```

- [ ] **Step 3:** run `npx playwright test tests/e2e/security-headers.spec.ts` → PASS.
- [ ] **Step 4: Commit** `test: security headers + seo route e2e, verify no node shims needed`

### Task 15: Full verification sweep + polish

- [ ] **Step 1:** `npm run lint` (tsc + prettier + eslint) → clean.
- [ ] **Step 2:** `npm run test:run` → all unit/component tests pass.
- [ ] **Step 3:** `npm run build` → succeeds.
- [ ] **Step 4:** `npm run test:e2e` → full Playwright suite passes (blockchain-ops/record-crud-lifecycle require `TESTNET_PRIVATE_KEY`; if unavailable, run all read-only specs and note the skip).
- [ ] **Step 5:** Manual smoke via `npm run dev`: home (beam, ticker, stats, search), /domain/test.mpc, /register flow UI, /profile disconnected, /tld, 404. Fix any visual defects found (spacing, contrast, overflow at 320px).
- [ ] **Step 6:** Commit any polish as `fix: spotlight polish from verification sweep`.

---

## Self-review notes

- Spec coverage: tokens/T1, logo+favicon/T2, dark-only/T3, Sentry/T4, SEO+headers/T5, analytics/T6, homepage additions/T7, search+live-region/T8, domain+records/T9, checkout+stepper/T10, chrome/T11, profile+tld+error+chips/T12, a11y suite/T13, shims verification + header tests/T14, full gates/T15. Node-compat: handled as verify-then-conditional-port (T14) per spec item 7. ✓
- Placeholders: none — all code blocks complete; T10 stepper testids explicitly resolved from `tests/e2e/constants.ts` at execution time (file is the source of truth).
- Type consistency: `config.websiteUrl` addition specified once (T3) and reused (T5). Component props untouched everywhere. ✓
