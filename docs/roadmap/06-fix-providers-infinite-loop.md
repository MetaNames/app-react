# Fix Providers Infinite Loop

## 1. Current Code Analysis

### SdkInitializer (lines 10-16)

```tsx
function SdkInitializer() {
  const { metaNamesSdk, setMetaNamesSdk } = useSdkStore();
  useEffect(() => {
    if (!metaNamesSdk) setMetaNamesSdk(metaNamesSdkFactory());
  }, [metaNamesSdk, setMetaNamesSdk]);
  return null;
}
```

### AlertWatcher (lines 18-41)

```tsx
function AlertWatcher() {
  const alertMessage = useWalletStore((s) => s.alertMessage);
  const setAlertMessage = useWalletStore((s) => s.setAlertMessage);

  useEffect(() => {
    if (!alertMessage) return;
    if (typeof alertMessage === "string") {
      toast(alertMessage, { duration: 5000 });
    } else if (alertMessage?.message) {
      toast(alertMessage.message, {
        duration: 5000,
        action: alertMessage.action
          ? {
              label: alertMessage.action.label,
              onClick: alertMessage.action.onClick,
            }
          : undefined,
      });
    }
    setAlertMessage(undefined);
  }, [alertMessage, setAlertMessage]);

  return null;
}
```

---

## 2. Problem Explanation

### SdkInitializer Infinite Loop

The `useEffect` on line 12-14 has `metaNamesSdk` in its dependency array. The effect itself sets `metaNamesSdk` via `setMetaNamesSdk(metaNamesSdkFactory())`. This creates a potential render loop:

1. `metaNamesSdk` is `null` → effect runs → `setMetaNamesSdk(...)` is called
2. `metaNamesSdk` gets a new value → component re-renders
3. `metaNamesSdk` is now truthy → effect does NOT run
4. (If `setMetaNamesSdk` creates a new reference each time, the loop continues)

The root cause: `metaNamesSdk` is being used both as a condition to trigger initialization AND as a dependency. This is a circular dependency where the effect modifies its own trigger.

### AlertWatcher Missing Dependency

The `useEffect` on line 22-37 calls `setAlertMessage(undefined)` but `setAlertMessage` is missing from the dependency array at line 38. While React may not warn about this in strict mode (due to the linter rule being disabled or store behavior), it's technically a missing dependency that could cause stale closures.

---

## 3. Corrected Implementation

### SdkInitializer Fix

Remove `metaNamesSdk` from the dependency array. The initialization should only run once on mount when `metaNamesSdk` is not yet set. Since `setMetaNamesSdk` from `useSdkStore` should be stable, we can safely omit `metaNamesSdk` from deps.

```tsx
function SdkInitializer() {
  const { metaNamesSdk, setMetaNamesSdk } = useSdkStore();
  useEffect(() => {
    if (!metaNamesSdk) setMetaNamesSdk(metaNamesSdkFactory());
  }, [setMetaNamesSdk]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
```

**Alternative approach (preferred):** Use a ref to track initialization state, avoiding dependency on `metaNamesSdk`:

```tsx
function SdkInitializer() {
  const { metaNamesSdk, setMetaNamesSdk } = useSdkStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && !metaNamesSdk) {
      initialized.current = true;
      setMetaNamesSdk(metaNamesSdkFactory());
    }
  }, [metaNamesSdk, setMetaNamesSdk]);

  return null;
}
```

### AlertWatcher Fix

`setAlertMessage` is already in the dependency array at line 38. The current code is correct. However, if the linter still warns, adding the eslint disable comment would suppress it.

---

## 4. Corrected Code

```tsx
"use client";
import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { metaNamesSdkFactory } from "@/lib/sdk";

function SdkInitializer() {
  const { metaNamesSdk, setMetaNamesSdk } = useSdkStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && !metaNamesSdk) {
      initialized.current = true;
      setMetaNamesSdk(metaNamesSdkFactory());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaNamesSdk, setMetaNamesSdk]);

  return null;
}

function AlertWatcher() {
  const alertMessage = useWalletStore((s) => s.alertMessage);
  const setAlertMessage = useWalletStore((s) => s.setAlertMessage);

  useEffect(() => {
    if (!alertMessage) return;
    if (typeof alertMessage === "string") {
      toast(alertMessage, { duration: 5000 });
    } else if (alertMessage?.message) {
      toast(alertMessage.message, {
        duration: 5000,
        action: alertMessage.action
          ? {
              label: alertMessage.action.label,
              onClick: alertMessage.action.onClick,
            }
          : undefined,
      });
    }
    setAlertMessage(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertMessage, setAlertMessage]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex flex-col min-h-screen">
        <SdkInitializer />
        <AlertWatcher />
        {children}
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
```

**Note:** Need to add `useRef` import from React.

---

## 5. Files to Test

1. **`/Users/marco/Documents/code/metanames/app/components/providers.tsx`** - Main file with fixes applied
2. **`/Users/marco/Documents/code/metanames/app/lib/stores/sdk-store.ts`** - Verify `setMetaNamesSdk` is stable (not recreated on each render)
3. **`/Users/marco/Documents/code/metanames/app/lib/stores/wallet-store.ts`** - Verify `setAlertMessage` is stable
4. **Any page that uses `Providers`** - Test that SDK initializes correctly and alerts display

### Testing Checklist

- [ ] No infinite re-renders on page load
- [ ] SDK initializes exactly once
- [ ] Alerts display correctly when triggered
- [ ] Console has no React hook warnings
- [ ] Application loads without errors
