# Convert Unnecessary 'use client' Components to Server Components

## Overview

Three components are marked `'use client'` but only read the `address` from the Zustand store. Since they don't handle any events, state mutations, or side effects, they can be converted to Server Components by passing `address` as a prop from parent components.

## Component Analysis

### 1. `components/connection-required.tsx`

**Current Behavior:**

- Reads `address` from `useWalletStore`
- If no address, renders a fallback UI or a "Connect your wallet" message
- If address exists, renders children

**Props Required:**

```typescript
interface ConnectionRequiredProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  address: string | undefined;
}
```

**Migration:**

1. Remove `"use client"` directive
2. Remove `useWalletStore` import
3. Add `address` to props
4. Update all parent components to pass `address`

**Usage in codebase:**

- `app/domain/[name]/records/page.tsx` (line 50)
- `app/domain/[name]/transfer/page.tsx` (line 76)

---

### 2. `components/require-wallet-connection.tsx`

**Current Behavior:**

- Reads `address` from `useWalletStore`
- If no address, renders `WalletConnectButton`
- If address exists, renders children

**Props Required:**

```typescript
interface RequireWalletConnectionProps {
  children: React.ReactNode;
  address: string | undefined;
}
```

**Migration:**

1. Remove `"use client"` directive
2. Remove `useWalletStore` import
3. Add `address` to props
4. Import `WalletConnectButton` remains (it's already a client component due to its own `'use client'`)

**Usage in codebase:**

- `components/domain-payment.tsx` (line 119)

---

### 3. `components/wallet-connect-status.tsx`

**Current Behavior:**

- Reads `address` from `useWalletStore`
- If no address, returns `null`
- If address exists, renders wallet icon + shortened address

**Props Required:**

```typescript
interface WalletConnectStatusProps {
  address: string | undefined;
}
```

**Migration:**

1. Remove `"use client"` directive
2. Remove `useWalletStore` import
3. Add `address` to props

**Note:** This component is likely used in header/layout areas and may be wrapped by a parent that already has access to `address`.

**Usage in codebase:**

- Referenced in `docs/metanames-app-spec.md` (line 1173) but grep shows no active imports - may be unused or used via layout

---

## Migration Path

### Step 1: Convert Components

**`components/connection-required.tsx`**

```tsx
// Before
"use client";
import { useWalletStore } from "@/lib/stores/wallet-store";

export function ConnectionRequired({ children, fallback }) {
  const address = useWalletStore((s) => s.address);
  if (!address) return fallback ? <>{fallback}</> : <DefaultUI />;
  return <>{children}</>;
}

// After
import { Wallet } from "lucide-react"; // if keeping default fallback

interface ConnectionRequiredProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  address: string | undefined;
}

export function ConnectionRequired({
  children,
  fallback,
  address,
}: ConnectionRequiredProps) {
  if (!address)
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <p className="text-muted-foreground text-lg">
          Connect your wallet to continue
        </p>
      </div>
    );
  return <>{children}</>;
}
```

**`components/require-wallet-connection.tsx`**

```tsx
// Before
"use client";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { WalletConnectButton } from "@/components/wallet-connect-button";

export function RequireWalletConnection({ children }) {
  const address = useWalletStore((s) => s.address);
  if (!address) return <WalletConnectButton />;
  return <>{children}</>;
}

// After
import { WalletConnectButton } from "@/components/wallet-connect-button";

interface RequireWalletConnectionProps {
  children: React.ReactNode;
  address: string | undefined;
}

export function RequireWalletConnection({
  children,
  address,
}: RequireWalletConnectionProps) {
  if (!address) {
    return (
      <div className="flex flex-col gap-3">
        <WalletConnectButton />
      </div>
    );
  }
  return <>{children}</>;
}
```

**`components/wallet-connect-status.tsx`**

```tsx
// Before
"use client";
import { Wallet } from "lucide-react";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { shortenAddress } from "@/lib/wallet";

export function WalletConnectStatus() {
  const address = useWalletStore((s) => s.address);
  if (!address) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Wallet className="h-4 w-4" />
      <span>{shortenAddress(address)}</span>
    </div>
  );
}

// After
import { Wallet } from "lucide-react";
import { shortenAddress } from "@/lib/wallet";

interface WalletConnectStatusProps {
  address: string | undefined;
}

export function WalletConnectStatus({ address }: WalletConnectStatusProps) {
  if (!address) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Wallet className="h-4 w-4" />
      <span>{shortenAddress(address)}</span>
    </div>
  );
}
```

### Step 2: Update Parent Components to Pass `address`

**`app/domain/[name]/records/page.tsx`**

- Already a Client Component (has `useCallback`, `useEffect`, `useState`)
- Has `useWalletStore` on line 19
- Pass `address` to `ConnectionRequired`

**`app/domain/[name]/transfer/page.tsx`**

- Already a Client Component
- Has `useWalletStore` on line 19
- Pass `address` to `ConnectionRequired`

**`components/domain-payment.tsx`**

- Already a Client Component
- Gets `address` from `useDomainPayment` hook (line 30)
- Pass `address` to `RequireWalletConnection`

### Step 3: Add Server Component Wrapper Pattern (If Needed)

For cases where these components need to be used in a Server Component context without an existing parent client component, create a wrapper:

```tsx
// components/providers/wallet-context.tsx
"use client";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { ConnectionRequired } from "@/components/connection-required";

interface WalletConnectionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function WalletConnectionGate({
  children,
  fallback,
}: WalletConnectionGateProps) {
  const address = useWalletStore((s) => s.address);
  return (
    <ConnectionRequired address={address} fallback={fallback}>
      {children}
    </ConnectionRequired>
  );
}
```

---

## Files to Modify

| File                                       | Action                                           |
| ------------------------------------------ | ------------------------------------------------ |
| `components/connection-required.tsx`       | Remove `'use client'`, add `address` prop        |
| `components/require-wallet-connection.tsx` | Remove `'use client'`, add `address` prop        |
| `components/wallet-connect-status.tsx`     | Remove `'use client'`, add `address` prop        |
| `app/domain/[name]/records/page.tsx`       | Pass `address` prop to `ConnectionRequired`      |
| `app/domain/[name]/transfer/page.tsx`      | Pass `address` prop to `ConnectionRequired`      |
| `components/domain-payment.tsx`            | Pass `address` prop to `RequireWalletConnection` |

---

## Testing Considerations

- Update `components/__tests__/connection-required.test.tsx` to pass `address` prop instead of mocking `useWalletStore`
- Verify all render paths work correctly with both `address` and `undefined`

---

## Dependencies

None - this migration doesn't require any new dependencies. All three components can be converted without additional libraries.

---

## Risk Assessment

- **Low Risk**: These components only render UI based on a boolean check; no side effects
- **Backward Compatible**: Existing parent components can continue working with minimal changes
- **Test Coverage**: Update existing tests to match new prop-based API
