# Metanames App - Implementation Roadmap

This document reconciles all feature implementation plans from the `docs/roadmap/` directory.

## Priority Order

| #   | Feature                                    | Priority  | Est. Impact           |
| --- | ------------------------------------------ | --------- | --------------------- |
| 1   | Fix profile useEffect deps                 | 🔴 HIGH   | Reliability           |
| 2   | Fix providers infinite loop                | 🔴 HIGH   | Reliability           |
| 3   | Resolve prop drilling                      | 🟡 MEDIUM | Maintainability       |
| 4   | Implement Server Actions                   | 🔴 HIGH   | Security, Bundle Size |
| 5   | Server Components data fetching            | 🟡 MEDIUM | SEO, Performance      |
| 6   | Convert to Server Components               | 🟢 LOW    | Bundle Size           |
| 7   | Split large components                     | 🟢 LOW    | Maintainability       |
| 8   | Add generateMetadata                       | 🟢 LOW    | SEO                   |
| 9   | Next.js optimizations (image/font/dynamic) | 🟢 LOW    | Performance           |
| 10  | Add Suspense boundaries                    | 🟡 MEDIUM | Performance           |

---

## Phase 1: Critical Bug Fixes

### 1. Fix Profile useEffect Deps

**File:** `app/profile/ProfilePageClient.tsx:40-42`

Empty deps `[]` causes stale closure — domains won't load if wallet connects after mount.

**One-line fix:**

```tsx
// Before
}, []);

// After
}, [handleLoadDomains]);
```

**Files to test:** `app/profile/ProfilePageClient.tsx`

---

### 2. Fix Providers Infinite Loop

**File:** `components/providers.tsx:12-14`

Adding `useRef` guard to prevent re-running when `metaNamesSdk` changes after initialization.

**Files to test:** `components/providers.tsx`, any component using SDK

---

## Phase 2: Architecture Improvements

### 3. Resolve Prop Drilling

**Files:** `domain.tsx`, `records.tsx`, `record.tsx`

`repository` and `onUpdate` passed through 3 levels. Solution: Zustand store.

**New file:** `lib/stores/record-store.ts`

**Steps:**

1. Create `record-store.ts` with `repository` and `refreshRecord` state
2. Update `domain.tsx` to set store values instead of passing props
3. Update `records.tsx` to consume from store
4. Update `record.tsx` to consume from store
5. Update `useRecordManagement` hook for compatibility

---

### 4. Implement Server Actions

**Files:** New `app/actions/` directory, modify `use-domain-payment.ts`, etc.

**New files to create:**

- `app/actions/domain/register.ts` - registration action
- `app/actions/domain/transfer.ts` - transfer action
- `app/actions/domain/renew.ts` - renewal action
- `app/actions/records/crud.ts` - record operations
- `lib/actions/sdk.ts` - server-side SDK helper

**Pattern:**

```tsx
"use server";

export async function registerDomain(formData: FormData) {
  // Validate, call SDK, revalidate
}
```

---

### 5. Server Components Data Fetching

**Files:** `app/domain/[name]/page.tsx`, `app/tld/page.tsx`

Fetch domain/TLD data in server component, pass to client.

**Before:** Client fetches via useEffect
**After:** Server fetches, passes as props

**New pattern for `app/domain/[name]/page.tsx`:**

```tsx
export default async function DomainPage({ params }) {
  const domain = await getServerSdk().domainRepository.find(params.name);
  return <DomainPageClient domain={domain} />;
}
```

---

## Phase 3: Incremental Improvements

### 6. Convert to Server Components

**Files:** `connection-required.tsx`, `require-wallet-connection.tsx`, `wallet-connect-status.tsx`

Remove `use client`, add `address` prop, update parent to pass address.

---

### 7. Split Large Components

**Files:** `domains-table.tsx`, `domain.tsx`, `select.tsx`, `records.tsx`, `record.tsx`

Extract logical sections into separate components. Start with `domains-table.tsx` (243 lines).

**New files:**

- `components/domains-table-columns.tsx`
- `components/domains-table-search.tsx`
- `components/domains-table-pagination.tsx`

---

### 8. Add generateMetadata

**Files:** `app/profile/page.tsx`, `app/tld/page.tsx`

Convert from static to dynamic metadata using `generateMetadata`.

---

### 9. Next.js Optimizations

**Files:** `app/layout.tsx`, `next.config.ts`

- Remove unused `chart.js` packages
- Add `next/font` configuration
- Add `next/image` for any future images

---

### 10. Add Suspense Boundaries

**Files:** All client data-fetching components

Migrate from `useState` loading booleans to `<Suspense>` + streaming SSR.

---

## File Inventory

| Roadmap File                            | Status      |
| --------------------------------------- | ----------- |
| `01-fix-profile-useeffect-deps.md`      | ✅ Complete |
| `02-resolve-prop-drilling.md`           | ✅ Complete |
| `03-implement-server-actions.md`        | ✅ Complete |
| `04-server-components-data-fetching.md` | ✅ Complete |
| `05-convert-to-server-components.md`    | ✅ Complete |
| `06-fix-providers-infinite-loop.md`     | ✅ Complete |
| `07-split-large-components.md`          | ✅ Complete |
| `08-add-generate-metadata.md`           | ✅ Complete |
| `09-nextjs-optimizations.md`            | ✅ Complete |
| `10-add-suspense-boundaries.md`         | ✅ Complete |

---

## Execution Order

1. **Phase 1** (do first): Quick bug fixes with minimal risk
2. **Phase 2** (do second): Architectural changes that enable other improvements
3. **Phase 3** (do last): Incremental polish features

Each phase can be worked on independently, but Phase 2 should be completed before Phase 3 for some features (e.g., Server Actions before Suspense streaming).
