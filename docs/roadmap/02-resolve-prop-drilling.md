# Resolve Prop Drilling in Domain/Records/Record Component Chain

## 1. Problem Description

The `repository` and `onUpdate` props are passed through multiple component levels without being used at intermediate levels, causing unnecessary prop drilling.

### Prop Drilling Chain

| File                                     | Line    | Prop                     | Used Here?       |
| ---------------------------------------- | ------- | ------------------------ | ---------------- |
| `app/domain/[name]/DomainPageClient.tsx` | 54      | `domain`, `onRefresh`    | No (passed down) |
| `components/domain.tsx`                  | 164-168 | `repository`, `onUpdate` | No (passed down) |
| `components/records.tsx`                 | 86-92   | `repository`, `onUpdate` | No (passed down) |
| `components/record.tsx`                  | 23      | `repository`, `onUpdate` | **Yes**          |

### Specific Code References

**DomainPageClient.tsx:54**

```tsx
return <Domain domain={domain as DomainType} onRefresh={load} />;
```

**domain.tsx:164-168**

```tsx
<Records
  records={domain.records ?? {}}
  repository={repository}
  onUpdate={onRefresh ?? (() => {})}
/>
```

**records.tsx:86-92**

```tsx
<Record
  key={type}
  type={type}
  value={records[type]}
  repository={repository}
  onUpdate={onUpdate}
/>
```

**record.tsx:38** (consumed by `useRecordManagement`)

```tsx
} = useRecordManagement({ type, value, repository, onUpdate });
```

---

## 2. Analysis of Current Architecture

### Component Hierarchy

```
DomainPageClient
  └── Domain
        └── Records
              └── Record (×n)
                    └── useRecordManagement (hook)
```

### Data Flow

1. `DomainPageClient` fetches domain data via SDK and creates `repository` from `metaNamesSdk`
2. `repository` is passed to `Domain` → `Records` → `Record` without intermediate use
3. `onUpdate` (refresh callback) propagates down to trigger domain refresh after record mutations
4. Both props are **only consumed at the leaf component** (`Record` via `useRecordManagement`)

### Why This Is Problematic

- **Coupling**: Intermediate components (`Domain`, `Records`) must know about props they don't use
- **Maintenance**: Adding/removing props requires changes at every level
- **Testing**: Difficult to test leaf components in isolation
- **Refactoring risk**: Changes to record logic ripple through all parent components

---

## 3. Solution Approach

### Recommended: Zustand Store

**Rationale:**

1. Already established pattern in codebase (`useSdkStore`, `useWalletStore`)
2. `repository` is derived from SDK which is already in a store
3. `onUpdate` is a simple callback that doesn't need context-specific behavior
4. Minimal boilerplate compared to React Context
5. Better TypeScript inference than useContext

### Alternative Considered: React Context

**Drawbacks:**

- Requires provider component wrapping
- More boilerplate for simple key-value state
- Less familiar pattern in this codebase

### Store Design

```typescript
interface RecordStore {
  repository: RecordRepository | null;
  onUpdate: (() => void) | null;
  setRepository: (repo: RecordRepository) => void;
  setOnUpdate: (fn: () => void) => void;
}
```

---

## 4. Step-by-Step Implementation

### Step 1: Create Record Store

**File:** `lib/stores/record-store.ts`

```typescript
import { create } from "zustand";
import type { RecordRepository } from "@/lib/types";

interface RecordStore {
  repository: RecordRepository | null;
  onUpdate: (() => void) | null;
  setRepository: (repository: RecordRepository) => void;
  setOnUpdate: (onUpdate: () => void) => void;
  clear: () => void;
}

export const useRecordStore = create<RecordStore>((set) => ({
  repository: null,
  onUpdate: null,
  setRepository: (repository) => set({ repository }),
  setOnUpdate: (onUpdate) => set({ onUpdate }),
  clear: () => set({ repository: null, onUpdate: null }),
}));
```

### Step 2: Update `domain.tsx` - Set Store Values

**File:** `components/domain.tsx`

```tsx
// Add import
import { useRecordStore } from "@/lib/stores/record-store";

export function Domain({ domain, isTld = false, onRefresh }: DomainProps) {
  const // ... existing code
  const repository = metaNamesSdk ? createRecordRepository(metaNamesSdk) : null;

  // NEW: Set store values instead of passing as props
  const setRepository = useRecordStore((s) => s.setRepository);
  const setOnUpdate = useRecordStore((s) => s.setOnUpdate);

  // Set values in store when repository is available
  useEffect(() => {
    if (repository) {
      setRepository(repository);
      setOnUpdate(onRefresh ?? (() => {}));
    }
  }, [repository, onRefresh, setRepository, setOnUpdate]);

  // ... existing code
```

Then update the JSX:

```tsx
<TabsContent value="settings" className="mt-4 flex flex-col gap-4">
  <Records records={domain.records ?? {}} />
  {/* ... rest */}
</TabsContent>
```

### Step 3: Update `records.tsx` - Remove Prop Drilling

**File:** `components/records.tsx`

```tsx
interface RecordsProps {
  records: Record<string, string>;
  // REMOVE: repository: RecordRepository;
  // REMOVE: onUpdate: () => void;
}

export function Records({ records }: RecordsProps) {
  // ... existing code for add record functionality

  // Update Record component usage
  {
    usedTypes.map((type) => (
      <Record
        key={type}
        type={type}
        value={records[type]}
        // REMOVE: repository={repository}
        // REMOVE: onUpdate={onUpdate}
      />
    ));
  }
}
```

### Step 4: Update `record.tsx` - Consume from Store

**File:** `components/record.tsx`

```tsx
import { useRecordStore } from "@/lib/stores/record-store";

interface RecordProps {
  type: RecordClass;
  value: string;
  // REMOVE: repository: RecordRepository;
  // REMOVE: onUpdate: () => void;
}

export function Record({ type, value }: RecordProps) {
  // Get from store instead of props
  const repository = useRecordStore((s) => s.repository);
  const onUpdate = useRecordStore((s) => s.onUpdate);

  const {
    // ... rest unchanged
  } = useRecordManagement({
    type,
    value,
    repository: repository!,
    onUpdate: onUpdate!,
  });
}
```

**Note:** The `!` assertions are safe because the store will be set by the parent `Domain` component before `Record` components render.

### Step 5: Update `useRecordManagement` Hook

**File:** `lib/hooks/use-record-management.ts`

```tsx
interface UseRecordManagementProps {
  type: RecordClass;
  value: string;
  // Props below can now come from store, but we still accept them for flexibility
  repository?: RecordRepository;
  onUpdate?: () => void;
}

export function useRecordManagement({
  type,
  value,
  repository: propRepository,
  onUpdate: propOnUpdate,
}: UseRecordManagementProps) {
  const storeRepository = useRecordStore((s) => s.repository);
  const storeOnUpdate = useRecordStore((s) => s.onUpdate);

  // Allow prop override but fall back to store
  const repository = propRepository ?? storeRepository;
  const onUpdate = propOnUpdate ?? storeOnUpdate;

  // ... rest unchanged
```

---

## 5. Migration Strategy (Avoid Breaking Changes)

### Phase 1: Add Store (Non-Breaking)

1. Create `record-store.ts`
2. Update `useRecordManagement` to accept props OR fall back to store
3. **No changes to components yet** - everything still works via props

### Phase 2: Introduce Store in `domain.tsx`

1. Set store values in `domain.tsx` alongside existing prop passing
2. `Records` and `Record` still receive props (no behavior change)

### Phase 3: Update `records.tsx`

1. Remove prop requirements but keep them optional
2. Read from store for internal logic
3. Pass props to `Record` for backward compatibility

### Phase 4: Update `record.tsx`

1. Remove prop requirements
2. Read exclusively from store

### Phase 5: Cleanup

1. Remove optional props from interfaces
2. Remove prop passing from parent components
3. Clean up `useRecordManagement` if no longer needed for override flexibility

### Temporary Backward Compatibility

During migration, use TypeScript optional props with deprecation:

```typescript
// records.tsx
interface RecordsProps {
  records: Record<string, string>;
  /** @deprecated Use RecordStore instead */
  repository?: RecordRepository;
  /** @deprecated Use RecordStore instead */
  onUpdate?: () => void;
}
```

---

## 6. Files to Modify

| File                                 | Change Type | Description                               |
| ------------------------------------ | ----------- | ----------------------------------------- |
| `lib/stores/record-store.ts`         | **CREATE**  | New Zustand store for repository/onUpdate |
| `lib/hooks/use-record-management.ts` | MODIFY      | Support store fallback                    |
| `components/domain.tsx`              | MODIFY      | Set store values, remove prop passing     |
| `components/records.tsx`             | MODIFY      | Remove prop drilling                      |
| `components/record.tsx`              | MODIFY      | Consume from store                        |
| `components/domain.tsx`              | MODIFY      | Remove prop passing to Records            |
| `components/records.tsx`             | MODIFY      | Remove props from Record usage            |
| `components/record.tsx`              | MODIFY      | Remove props from RecordProps             |

### Files with Line References to Update

| File                   | Current Line | Change                                   |
| ---------------------- | ------------ | ---------------------------------------- |
| `DomainPageClient.tsx` | 54           | No change needed (already correct)       |
| `domain.tsx`           | 164-168      | Remove `repository` and `onUpdate` props |
| `records.tsx`          | 24-28        | Remove from interface                    |
| `records.tsx`          | 86-92        | Remove from Record usage                 |
| `record.tsx`           | 16-21        | Remove from interface                    |
| `record.tsx`           | 23           | Update destructuring                     |

---

## 7. Testing Strategy

### Unit Tests

- `record-store.ts`: Test set/clear operations
- `useRecordManagement`: Mock store or props, verify behavior

### Integration Tests

- `Record` component: Verify it works with store
- `Records` component: Verify no regression
- `Domain` component: Verify store is populated before children render

### E2E Tests

- Full flow: Add record → verify refresh → verify store state
