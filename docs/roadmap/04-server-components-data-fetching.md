# Server Components Data Fetching Conversion Plan

## Overview

Converting client-side data fetching to React Server Components for improved SEO (full data in initial HTML) and reduced client-side JavaScript bundle size.

---

## 1. Data Fetching Analysis

### 1.1 Server-Side Fetchable Data

| Page                         | Data                 | Reason to Fetch Server-Side            |
| ---------------------------- | -------------------- | -------------------------------------- |
| `app/domain/[name]/page.tsx` | Domain data by name  | Public, SEO-critical, no auth required |
| `app/tld/page.tsx`           | TLD info (`mpc.mpc`) | Static/public data, same for all users |

### 1.2 Must Remain Client-Side

| Page                           | Data                       | Reason                                          |
| ------------------------------ | -------------------------- | ----------------------------------------------- |
| `app/profile/page.tsx`         | User's domains by owner    | Requires wallet address (user-specific)         |
| `components/domain-search.tsx` | Domain availability search | Interactive search widget, must remain reusable |

### 1.3 Summary

```
SERVER SIDE (can convert):
- DomainPageClient → page.tsx (fetch domain by name from URL param)
- TldPageClient → page.tsx (fetch mpc.mpc domain)

CLIENT SIDE (must remain):
- ProfilePageClient → wallet address required
- DomainSearch → interactive component used globally
```

---

## 2. New Architecture Pattern

### Before (Client Fetching)

```
page.tsx (server) → ClientComponent (client)
                       ↓ useEffect + useState
                       SDK fetch on mount
```

### After (Server Fetching)

```
page.tsx (server)
  ↓ async fetch
  ↓ pass as props
ClientComponent (client) ← receives data via props, no fetch
```

### Key Principles

1. **Server Components fetch data** using a server-side SDK instance
2. **Client Components receive data as props** - they no longer fetch
3. **Keep client components for interactivity** - but data comes pre-loaded
4. **Streaming via Suspense** - wrap slow data in `<Suspense>` boundaries

---

## 3. Implementation: Domain Page (Example)

### Step 1: Create `app/domain/[name]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { getServerSdk } from "@/lib/sdk";
import { normalizeDomain } from "@/lib/domain-validator";
import { DomainPageClient } from "./DomainPageClient";
import type { Domain } from "@/lib/types";

interface PageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  const domainName = decodeURIComponent(name);
  return {
    title: `${domainName} - MetaNames`,
    description: `View domain information for ${domainName}`,
  };
}

export default async function DomainPage({ params }: PageProps) {
  const { name } = await params;
  const domainName = normalizeDomain(decodeURIComponent(name));

  // Fetch on server
  const sdk = getServerSdk();
  const domain = await sdk.domainRepository.find(domainName);

  if (!domain) {
    notFound();
  }

  return <DomainPageClient initialDomain={domain} />;
}
```

### Step 2: Update `DomainPageClient.tsx`

Remove SDK fetching logic, accept data via props:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Domain } from "@/components/domain";
import { type Domain as DomainType } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { normalizeDomain } from "@/lib/domain-validator";

interface DomainPageClientProps {
  initialDomain: DomainType;
}

export function DomainPageClient({ initialDomain }: DomainPageClientProps) {
  const router = useRouter();
  const [domain, setDomain] = useState<DomainType>(initialDomain);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  // Client-side refresh still works but uses SDK from store
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await metaNamesSdk.domainRepository.find(
        normalizeDomain(window.location.pathname.split("/").pop()!),
      );
      startTransition(() => {
        setDomain(d);
        setLoading(false);
      });
    } catch {
      setLoading(false);
    }
  }, []);

  return <Domain domain={domain} onRefresh={load} />;
}
```

> **Note:** Full refresh logic with wallet integration requires additional consideration. See section 5.

---

## 4. Implementation: TLD Page

### Step 1: Update `app/tld/page.tsx`

```tsx
import { getServerSdk } from "@/lib/sdk";
import { TldPageClient } from "./TldPageClient";
import type { Domain } from "@/lib/types";

export const metadata = {
  title: "TLD Information - MetaNames",
  description: "View Top-Level Domain information",
};

export default async function TldPage() {
  const sdk = getServerSdk();
  const domain = await sdk.domainRepository.find("mpc.mpc");

  const tldDomain: Domain = domain ?? {
    name: "mpc",
    nameWithoutTLD: "mpc",
    owner: sdk.config.contractAddress,
    tokenId: 0,
    createdAt: new Date(),
    expiresAt: null,
    parentId: null,
    records: {},
  };

  return <TldPageClient initialDomain={tldDomain} />;
}
```

### Step 2: Update `TldPageClient.tsx`

```tsx
"use client";
import { Domain } from "@/components/domain";
import type { Domain as DomainType } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface TldPageClientProps {
  initialDomain: DomainType;
}

export function TldPageClient({ initialDomain }: TldPageClientProps) {
  // No fetching - data comes from server
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">TLD Information</h1>
      <Domain domain={initialDomain} isTld={true} />
    </div>
  );
}
```

---

## 5. Handling Wallet-Dependent Data

### Profile Page (Must Remain Client-Side)

The `ProfilePageClient` requires wallet connection - it cannot be server-rendered because:

1. Wallet address is unknown until user connects
2. Data is user-specific based on connected wallet
3. Server cannot access user's wallet session

**Solution:** Keep as client component, but optimize structure:

```tsx
// app/profile/page.tsx - server wrapper for Suspense
import { Suspense } from "react";
import { ProfilePageClient } from "./ProfilePageClient";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Profile - MetaNames",
  description: "View your domain portfolio",
};

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ProfilePageClient />
    </Suspense>
  );
}
```

### Domain Refresh Button

The `Domain` component has an `onRefresh` callback that triggers SDK fetching. This remains client-side because:

1. It may refresh with updated wallet-authenticated data
2. It's a user interaction, not initial data load
3. Server already provides initial data - refresh is optimization

**Pattern:** Server provides initial data, client handles refreshes.

---

## 6. Streaming/Suspense Integration Plan

### For Domain Page

Wrap slow server fetches in `<Suspense>` to enable streaming HTML:

```tsx
// app/domain/[name]/page.tsx
import { Suspense } from "react";
import { DomainPageLoading } from "./loading"; // skeleton component

export default async function DomainPage({ params }: PageProps) {
  const domainName = /* ... */;

  return (
    <Suspense fallback={<DomainPageLoading />}>
      <DomainPageContent domainName={domainName} />
    </Suspense>
  );
}

async function DomainPageContent({ domainName }: { domainName: string }) {
  // This fetches and streams
  const sdk = getServerSdk();
  const domain = await sdk.domainRepository.find(domainName);
  return <DomainPageClient initialDomain={domain} />;
}
```

### Create `app/domain/[name]/loading.tsx`

```tsx
import { Loader2 } from "lucide-react";

export default function DomainPageLoading() {
  return (
    <div className="flex justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
```

### Streaming Benefits

1. **Faster TTFB** - Server sends shell HTML immediately
2. **Progressive enhancement** - Content streams in as data resolves
3. **Better UX** - Loading skeleton appears instantly, data follows

---

## 7. Files to Modify

### New Files

| File                            | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `app/domain/[name]/page.tsx`    | Server component with data fetch         |
| `app/domain/[name]/loading.tsx` | Streaming fallback UI                    |
| `app/tld/page.tsx`              | Updated server component with data fetch |

### Modified Files

| File                                     | Changes                                             |
| ---------------------------------------- | --------------------------------------------------- |
| `app/domain/[name]/DomainPageClient.tsx` | Remove useEffect fetch, accept `initialDomain` prop |
| `app/tld/TldPageClient.tsx`              | Remove useEffect fetch, accept `initialDomain` prop |
| `app/tld/page.tsx`                       | Add server-side data fetch                          |

### No Changes Required

| File                                | Reason                                       |
| ----------------------------------- | -------------------------------------------- |
| `app/profile/ProfilePageClient.tsx` | Wallet-dependent, keep client-side           |
| `app/profile/page.tsx`              | Already has correct Suspense wrapper pattern |
| `components/domain-search.tsx`      | Interactive search, must remain client       |

---

## 8. Order of Implementation

1. **Phase 1: TLD Page** (simpler, no URL params)
   - Update `app/tld/page.tsx` with server fetch
   - Update `TldPageClient.tsx` to accept props

2. **Phase 2: Domain Page** (needs routing attention)
   - Create `app/domain/[name]/page.tsx`
   - Create `app/domain/[name]/loading.tsx`
   - Update `DomainPageClient.tsx`

3. **Phase 3: Add Suspense streaming**
   - Wrap fetches in Suspense boundaries
   - Add loading.tsx files for each route

---

## 9. SDK Factory Usage

```tsx
// Server-side (in page.tsx)
import { getServerSdk } from "@/lib/sdk";
const sdk = getServerSdk();
const domain = await sdk.domainRepository.find(name);

// Client-side (in ClientComponent via store)
import { useSdkStore } from "@/lib/stores/sdk-store";
const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);
```

Server SDK uses `process.env.NEXT_PUBLIC_ENV` to determine environment. Client SDK is initialized in providers with wallet-aware configuration.

---

## 10. SEO Benefits

| Before                             | After                               |
| ---------------------------------- | ----------------------------------- |
| HTML shell only, data loads via JS | Full page content in initial HTML   |
| Search engines see loading states  | Search engines see complete content |
| Requires JS for any content        | Works without JS execution          |
| Poor Core Web Vitals               | Improved FCP, LCP                   |
