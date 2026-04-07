# Implementation Plan: Suspense Boundaries and Streaming Support

## 1. Analysis of Current Loading Patterns

### Overview

The application currently uses manual `useState` boolean flags to handle loading states across **7 components**. This pattern requires boilerplate code in every component and prevents streaming SSR.

### Files Using Manual Loading States

| File                                     | Loading State                                           | Pattern         |
| ---------------------------------------- | ------------------------------------------------------- | --------------- |
| `app/domain/[name]/DomainPageClient.tsx` | `const [loading, setLoading] = useState(true)`          | Full page block |
| `app/tld/TldPageClient.tsx`              | `const [loading, setLoading] = useState(true)`          | Full page block |
| `app/profile/ProfilePageClient.tsx`      | `const [loading, setLoading] = useState(false)`         | Partial section |
| `app/domain/[name]/records/page.tsx`     | `const [loading, setLoading] = useState(true)`          | Full page block |
| `components/domain-search.tsx`           | `const [loading, setLoading] = useState(false)`         | Inline search   |
| `lib/hooks/use-domain-payment.ts`        | `const [loadingFees, setLoadingFees] = useState(false)` | Hook state      |
| `components/loading-button.tsx`          | `const [loading, setLoading] = useState(false)`         | Button state    |

### Common Pattern Analysis

All client components follow this pattern:

```tsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  const controller = new AbortController();
  load(controller.signal);
  return () => controller.abort();
}, [load]);

if (loading) return <Spinner />;
// render content
```

**Problems with this approach:**

- Each component manages its own loading state independently
- No shared loading boundaries between components
- Prevents Next.js streaming SSR (pages must wait for all data)
- Inconsistent loading UI placement
- Manual `AbortController` management in every component

## 2. Where Suspense Boundaries Make Sense

### Recommended Boundary Placement

```
app/
├── domain/[name]/
│   ├── page.tsx                    ← Suspense boundary (streaming page)
│   ├── loading.tsx                ← Already exists (fallback)
│   └── DomainPageClient.tsx       ← Convert to async server component
├── [name]/records/
│   ├── page.tsx                   ← Suspense boundary
│   ├── loading.tsx                ← Already exists
│   └── RecordsPage.tsx            ← Convert to async
├── tld/
│   ├── page.tsx                   ← Suspense boundary
│   ├── loading.tsx                ← Already exists
│   └── TldPageClient.tsx          ← Convert to async
├── profile/
│   ├── page.tsx                   ← Suspense boundary
│   ├── loading.tsx                ← Already exists
│   └── ProfilePageClient.tsx      ← Convert to async
└── register/[name]/
    ├── page.tsx                   ← Suspense boundary
    └── loading.tsx                ← Already exists
```

### Components NOT Suitable for Suspense

| Component                         | Reason                                                 |
| --------------------------------- | ------------------------------------------------------ |
| `components/domain-search.tsx`    | Interactive search with debouncing; needs client state |
| `components/loading-button.tsx`   | Button interaction; not data-fetching boundary         |
| `lib/hooks/use-domain-payment.ts` | Hook pattern; Suspense works at component level        |

## 3. Migration Strategy from useState Loading to Suspense

### Phase 1: Create Data Fetching Utilities

Create async server-side data fetchers that return Promises. These will be used by the server components and wrapped in Suspense.

### Phase 2: Convert Client Components to Server Components

Split each page into:

1. **Server Component** (page.tsx) - fetches data, passes to client
2. **Client Component** (Client.tsx) - receives data, handles interactions

### Phase 3: Add Suspense Boundaries

Wrap dynamic content in `<Suspense>` with existing `loading.tsx` as fallback.

### Phase 4: Remove Manual Loading State

Remove `useState` loading patterns from converted components.

## 4. Step-by-Step Implementation Example

### Example: Migrating Domain Page

#### Step 1: Create Data Fetcher

Create `lib/data/domain.ts`:

```typescript
import { metaNamesSdk } from "@/lib/sdk";

export async function getDomainData(name: string) {
  "use server";
  const domainName = decodeURIComponent(name);
  const domain = await metaNamesSdk.domainRepository.find(domainName);
  return domain;
}
```

#### Step 2: Convert page.tsx to Server Component with Suspense

**Before** (`app/domain/[name]/page.tsx`):

```tsx
import { DomainPageClient } from "./DomainPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return {
    title: `${decodeURIComponent(name)} - MetaNames`,
  };
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return <DomainPageClient name={name} />;
}
```

**After**:

```tsx
import { Suspense } from "react";
import { DomainPageClient } from "./DomainPageClient";
import { DomainPageData } from "./DomainPageData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return {
    title: `${decodeURIComponent(name)} - MetaNames`,
  };
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return (
    <Suspense fallback={<DomainLoading />}>
      <DomainPageData name={name}>
        {(domain) => <DomainPageClient domain={domain} />}
      </DomainPageData>
    </Suspense>
  );
}
```

#### Step 3: Create DomainPageData Component

Create `app/domain/[name]/DomainPageData.tsx`:

```tsx
import { getDomainData } from "@/lib/data/domain";

interface DomainPageDataProps {
  name: string;
  children: (domain: Domain | null) => React.ReactNode;
}

export async function DomainPageData({ name, children }: DomainPageDataProps) {
  const domain = await getDomainData(name);
  return <>{children(domain)}</>;
}
```

#### Step 4: Simplify DomainPageClient

**Before** (`DomainPageClient.tsx`):

```tsx
"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Domain } from "@/components/domain";
import { type Domain as DomainType } from "@/lib/types";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { normalizeDomain } from "@/lib/domain-validator";

export function DomainPageClient({ name }: { name: string }) {
  const router = useRouter();
  const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);
  const lastRefreshed = useWalletStore((s) => s.lastRefreshed);
  const [domain, setDomain] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const load = useCallback(async () => {
    if (!metaNamesSdk) return;
    setLoading((prev) => (prev ? prev : true));
    try {
      const domainName = normalizeDomain(decodeURIComponent(name));
      const d = await metaNamesSdk.domainRepository.find(domainName);
      if (!d) {
        toast.error("Domain not found. Register it now!");
        router.replace(`/register/${domainName.replace(/\.mpc$/, "")}`);
        setLoading(false);
        return;
      }
      startTransition(() => {
        setDomain(d);
        setLoading(false);
      });
    } catch {
      setLoading(false);
    }
  }, [metaNamesSdk, name, router]);

  useEffect(() => {
    load();
  }, [load, lastRefreshed]);

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (!domain) return null;
  return <Domain domain={domain as DomainType} onRefresh={load} />;
}
```

**After**:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { Domain } from "@/components/domain";
import { type Domain as DomainType } from "@/lib/types";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { toast } from "sonner";

interface DomainPageClientProps {
  domain: DomainType | null;
}

export function DomainPageClient({ domain }: DomainPageClientProps) {
  const router = useRouter();
  const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);
  const lastRefreshed = useWalletStore((s) => s.lastRefreshed);

  const handleRefresh = async () => {
    if (!metaNamesSdk || !domain) return;
    // Refresh logic remains client-side for interactive updates
    const d = await metaNamesSdk.domainRepository.find(domain.name);
    if (!d) {
      toast.error("Domain not found.");
      router.replace(`/register/${domain.name.replace(/\.mpc$/, "")}`);
    }
  };

  if (!domain) return null;
  return <Domain domain={domain} onRefresh={handleRefresh} />;
}
```

## 5. Integration with loading.tsx Files

### Existing loading.tsx Files

All four routes already have `loading.tsx`:

| Route              | File                              |
| ------------------ | --------------------------------- |
| `/domain/[name]`   | `app/domain/[name]/loading.tsx`   |
| `/tld`             | `app/tld/loading.tsx`             |
| `/profile`         | `app/profile/loading.tsx`         |
| `/register/[name]` | `app/register/[name]/loading.tsx` |

### How They Work with Suspense

```tsx
// app/domain/[name]/page.tsx
export default function DomainPage({ params }) {
  return (
    <Suspense fallback={<Loading />}>
      <DomainPageData name={name}>
        {(domain) => <DomainPageClient domain={domain} />}
      </DomainPageData>
    </Suspense>
  );
}
```

The existing `Loading` component from `loading.tsx` serves as the Suspense fallback. When the server streams content, the fallback displays until data resolves.

### Streaming SSR Behavior

1. Initial request: Server renders `loading.tsx` immediately
2. Data fetch begins: `DomainPageData` suspends
3. Data resolves: Server streams rendered content
4. Client hydrates: Full page becomes interactive

## 6. Files to Modify

### Phase 1: Infrastructure

| File                  | Action | Description                   |
| --------------------- | ------ | ----------------------------- |
| `lib/data/domain.ts`  | Create | Async domain fetcher          |
| `lib/data/records.ts` | Create | Async records fetcher         |
| `lib/data/tld.ts`     | Create | Async TLD fetcher             |
| `lib/data/profile.ts` | Create | Async profile domains fetcher |

### Phase 2: Domain Page

| File                                     | Action                           |
| ---------------------------------------- | -------------------------------- |
| `app/domain/[name]/page.tsx`             | Modify - add Suspense            |
| `app/domain/[name]/DomainPageData.tsx`   | Create - data fetching component |
| `app/domain/[name]/DomainPageClient.tsx` | Modify - remove loading state    |

### Phase 3: Records Page

| File                                              | Action                           |
| ------------------------------------------------- | -------------------------------- |
| `app/domain/[name]/records/page.tsx`              | Modify - add Suspense            |
| `app/domain/[name]/records/RecordsPageData.tsx`   | Create - data fetching component |
| `app/domain/[name]/records/RecordsPageClient.tsx` | Create - interactive parts       |

### Phase 4: TLD Page

| File                        | Action                           |
| --------------------------- | -------------------------------- |
| `app/tld/page.tsx`          | Modify - add Suspense            |
| `app/tld/TldPageData.tsx`   | Create - data fetching component |
| `app/tld/TldPageClient.tsx` | Modify - remove loading state    |

### Phase 5: Profile Page

| File                                | Action                           |
| ----------------------------------- | -------------------------------- |
| `app/profile/page.tsx`              | Modify - add Suspense            |
| `app/profile/ProfilePageData.tsx`   | Create - data fetching component |
| `app/profile/ProfilePageClient.tsx` | Modify - remove loading state    |

### Files Unchanged

| File                              | Reason                                        |
| --------------------------------- | --------------------------------------------- |
| `components/domain-search.tsx`    | Interactive search; not suitable for Suspense |
| `components/loading-button.tsx`   | Button state; not data boundary               |
| `lib/hooks/use-domain-payment.ts` | Hook; Suspense applies at component level     |
| `app/*/loading.tsx`               | Reused as Suspense fallbacks                  |

### Optional: Create Reusable Suspense Wrapper

To reduce boilerplate, create `components/suspense-data.tsx`:

```tsx
"use client";

interface SuspenseDataProps<T> {
  data: T;
  loading?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}

export function SuspenseData<T>({
  data,
  loading,
  children,
}: SuspenseDataProps<T>) {
  if (!data) {
    return (
      loading ?? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    );
  }
  return <>{children(data)}</>;
}
```

## Summary

This migration enables:

- **Streaming SSR**: Pages send content incrementally
- **Better UX**: Faster initial page renders with progressive loading
- **Less Boilerplate**: No more manual loading states
- **Consistent Patterns**: Single Suspense boundary per route

Start with the Domain page as the reference implementation, then apply the same pattern to remaining routes.
