# Fix ProfilePageClient useEffect Dependency Issue

## 1. Problem Description

**File:** `app/profile/ProfilePageClient.tsx`  
**Lines:** 40-42

The `useEffect` hook has an empty dependency array `[]`, but the effect depends on values that can change:

- `address` (from `useWalletStore`)
- `metaNamesSdk` (from `useSdkStore`)
- `handleLoadDomains` (stable callback via `useEffectEvent`)

### Stale Closure Bug

When the user connects their wallet **after** the component mounts, the effect will not re-run because:

1. The `useEffect` only executes once on mount (due to `[]` deps)
2. `handleLoadDomains()` is called with stale/initial values of `address` (likely `undefined`)
3. The early return `if (!address || !metaNamesSdk) return;` prevents domain loading

**Result:** User connects wallet but sees no domains until they manually refresh the page.

## 2. Current Code

```tsx
// Lines 40-42
useEffect(() => {
  handleLoadDomains();
}, []);
```

The effect is mounted once and never re-runs when `address` or `metaNamesSdk` change.

## 3. Corrected Code

```tsx
// Lines 40-42 - Add handleLoadDomains to dependencies
useEffect(() => {
  handleLoadDomains();
}, [handleLoadDomains]);
```

**Note:** `handleLoadDomains` is created using `useEffectEvent` (line 18), which returns a stable function reference that won't cause the effect to re-run unnecessarily. It will still have access to fresh values of `address` and `metaNamesSdk` via closure.

## 4. Step-by-Step Implementation

1. **Open the file:** `app/profile/ProfilePageClient.tsx`

2. **Locate line 40-42:**

   ```tsx
   useEffect(() => {
     handleLoadDomains();
   }, []);
   ```

3. **Update the dependency array:**
   - Change `[]` to `[handleLoadDomains]`

4. **Verify the complete effect block:**

   ```tsx
   useEffect(() => {
     handleLoadDomains();
   }, [handleLoadDomains]);
   ```

5. **Run linting/type-checking to confirm:**
   ```bash
   npm run lint
   # or
   npx tsc --noEmit
   ```

## 5. Files Requiring Testing

| File                                | Reason               |
| ----------------------------------- | -------------------- |
| `app/profile/ProfilePageClient.tsx` | Primary fix location |

### Test Scenarios

1. **Mount before wallet connection:**
   - Component mounts with no wallet connected
   - Connect wallet
   - Verify domains load automatically

2. **Wallet already connected at mount:**
   - Connect wallet before navigating to profile page
   - Navigate to profile page
   - Verify domains load immediately

3. **Disconnect and reconnect wallet:**
   - Load profile with connected wallet (domains show)
   - Disconnect wallet
   - Reconnect wallet
   - Verify domains reload without page refresh

### Manual Testing Checklist

- [ ] No console errors on page load
- [ ] Domains appear when wallet is connected
- [ ] Loading spinner shows during domain fetch
- [ ] Empty state handled gracefully
