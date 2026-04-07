# Add generateMetadata to Profile and TLD Pages

## 1. Current Metadata Pattern Analysis

### Reference Pattern (Dynamic Metadata)

Both `app/register/[name]/page.tsx` and `app/domain/[name]/page.tsx` use the same pattern:

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const domainName = decodeURIComponent(name);
  return {
    title: `${domainName} - MetaNames`,
    description: `Register ${domainName} domain on MetaNames`,
  };
}
```

**Key characteristics:**

- Async function
- `params` is a `Promise<{ name: string }>` (Next.js 15+ async params pattern)
- Uses `decodeURIComponent()` to handle URL-encoded names
- Returns metadata object with `title` and `description`

### Pages Missing Dynamic Metadata

| Page                   | Current Metadata                        | Issue                                |
| ---------------------- | --------------------------------------- | ------------------------------------ |
| `app/profile/page.tsx` | Static: `"Profile - MetaNames"`         | Cannot reflect user's wallet address |
| `app/tld/page.tsx`     | Static: `"TLD Information - MetaNames"` | Cannot show actual TLD name          |

---

## 2. What Metadata Should Be Dynamic for Each Page

### `app/profile/page.tsx`

**Current:**

```typescript
export const metadata = {
  title: "Profile - MetaNames",
  description: "View your domain portfolio",
};
```

**Proposed Dynamic:**

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ address?: string }>;
}) {
  const { address } = await params;
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Profile";
  return {
    title: `${displayAddress} - MetaNames`,
    description: address
      ? `View domain portfolio for ${displayAddress}`
      : "View your domain portfolio",
  };
}
```

**Rationale:**

- Profile pages are typically accessed via `/profile/{address}`
- Dynamic address in title helps users identify whose profile they're viewing
- Falls back to generic "Profile" if no address provided

### `app/tld/page.tsx`

**Current:**

```typescript
export const metadata = {
  title: "TLD Information - MetaNames",
  description: "View Top-Level Domain information",
};
```

**Proposed Dynamic:**

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ name?: string }>;
}) {
  const { name } = await params;
  const tldName = decodeURIComponent(name || "mpc");
  return {
    title: `${tldName}. - MetaNames`,
    description: `View Top-Level Domain information for ${tldName}.`,
  };
}
```

**Rationale:**

- TLD pages may support multiple TLDs (e.g., `/tld/mpc`, `/tld/eth`)
- Dynamic title reflects the actual TLD being viewed
- Default to "mpc" if no name provided (current hardcoded TLD)

---

## 3. Step-by-Step Implementation

### Step 1: Update `app/profile/page.tsx`

1. Remove static `metadata` export
2. Add `generateMetadata` async function
3. Convert page component to async
4. Handle optional address parameter

**Before:**

```typescript
import { ProfilePageClient } from "./ProfilePageClient";

export const metadata = {
  title: "Profile - MetaNames",
  description: "View your domain portfolio",
};

export default function ProfilePage() {
  return <ProfilePageClient />;
}
```

**After:**

```typescript
import { ProfilePageClient } from "./ProfilePageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address?: string }>;
}) {
  const { address } = await params;
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Profile";
  return {
    title: `${displayAddress} - MetaNames`,
    description: address
      ? `View domain portfolio for ${displayAddress}`
      : "View your domain portfolio",
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ address?: string }>;
}) {
  return <ProfilePageClient />;
}
```

### Step 2: Update `app/tld/page.tsx`

1. Remove static `metadata` export
2. Add `generateMetadata` async function
3. Convert page component to async
4. Handle optional name parameter with default

**Before:**

```typescript
import { TldPageClient } from "./TldPageClient";

export const metadata = {
  title: "TLD Information - MetaNames",
  description: "View Top-Level Domain information",
};

export default function TldPage() {
  return <TldPageClient />;
}
```

**After:**

```typescript
import { TldPageClient } from "./TldPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name?: string }>;
}) {
  const { name } = await params;
  const tldName = decodeURIComponent(name || "mpc");
  return {
    title: `${tldName}. - MetaNames`,
    description: `View Top-Level Domain information for ${tldName}.`,
  };
}

export default async function TldPage({
  params,
}: {
  params: Promise<{ name?: string }>;
}) {
  return <TldPageClient />;
}
```

---

## 4. TypeScript Typing Requirements

### Next.js 15+ Metadata Types

The `generateMetadata` function uses the same typing pattern as existing dynamic route pages:

```typescript
// For profile page with optional address parameter
params: Promise<{ address?: string }>;

// For tld page with optional name parameter
params: Promise<{ name?: string }>;
```

### Return Type

The return type is inferred automatically, but can be explicitly typed:

```typescript
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address?: string }>;
}): Promise<Metadata> {
  // ...
}
```

### Parameter Decoding

Use `decodeURIComponent()` for URL-safe parameters:

```typescript
const tldName = decodeURIComponent(name || "mpc");
```

---

## 5. Files to Modify

| File                   | Change Type | Description                                                             |
| ---------------------- | ----------- | ----------------------------------------------------------------------- |
| `app/profile/page.tsx` | Modify      | Replace static `metadata` with `generateMetadata`; make component async |
| `app/tld/page.tsx`     | Modify      | Replace static `metadata` with `generateMetadata`; make component async |

### No Changes Required To:

- `app/profile/ProfilePageClient.tsx` - Client component unchanged
- `app/tld/TldPageClient.tsx` - Client component unchanged

---

## 6. Testing Checklist

After implementation:

- [ ] Navigate to `/profile` - should show "Profile - MetaNames"
- [ ] Navigate to `/profile/0x1234567890abcdef1234567890abcdef12345678` - should show "0x1234...5678 - MetaNames"
- [ ] Navigate to `/tld` - should show "mpc. - MetaNames"
- [ ] Navigate to `/tld/eth` - should show "eth. - MetaNames"
- [ ] Verify no TypeScript errors
- [ ] Run `npm run build` to confirm no build errors
