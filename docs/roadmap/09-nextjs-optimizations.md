# Next.js Optimization Tools Implementation Plan

## 1. Inventory of All Image Usages in the Codebase

### 1.1 SVG Usages

| File                    | Type        | Description                           | Size                 | Dynamic                         |
| ----------------------- | ----------- | ------------------------------------- | -------------------- | ------------------------------- |
| `components/logo.tsx`   | Inline SVG  | Logo with "M" text, hardcoded inline  | 28x28                | No                              |
| `components/domain.tsx` | Dynamic SVG | Jdenticon avatar for domain addresses | 64x64 (configurable) | Yes - via `import("jdenticon")` |

### 1.2 External Images

| File                            | Context         | URL                              | Purpose                     |
| ------------------------------- | --------------- | -------------------------------- | --------------------------- |
| `lib/__tests__/records.test.ts` | Test validation | `https://example.com/avatar.png` | Record validation test only |

**Note:** No production `<img>` tags found in the codebase. All iconography uses `lucide-react` which is already tree-shakeable.

### 1.3 Background Images

No CSS background images detected. No `url()` references to image assets.

### 1.4 Current `next/image` Usage

None. The codebase does not currently use `next/image` component.

---

## 2. `next/image` Migration Plan

### 2.1 Assessment

**Current State:** No images require migration since there are no `<img>` tags or external images in production code.

**Opportunities:**

1. The inline SVG logo could potentially be replaced with a proper Next.js `<Image>` if we convert it to an actual image file
2. If any external images are added in the future (e.g., user avatars, product images), `next/image` should be used

### 2.2 Recommendations

1. **Logo Component** (`components/logo.tsx`):
   - Keep as inline SVG for now (simple geometric shape, no external dependency)
   - SVG is rendered at build time, no runtime cost
   - Converting to `next/image` would require hosting an image file

2. **Jdenticon Avatar** (`components/domain.tsx`):
   - Already dynamically imported via `import("jdenticon")`
   - Renders to an `<svg>` element, not a raster image
   - Not suitable for `next/image` since it's procedurally generated

3. **Future Image additions**:
   - Any new images must use `next/image` for automatic optimization
   - Update CSP in `next.config.ts` if needed for image domains

### 2.3 Files to Modify (if images are added)

- `next.config.ts` - Add allowed image domains if using external images
- Individual component files when images are added

---

## 3. Font Loading Analysis and `next/font` Migration Plan

### 3.1 Current Font Configuration

**CSS Variables (from `app/globals.css`):**

```css
--font-sans: var(--font-sans); /* Line 10 */
--font-mono: var(--font-geist-mono); /* Line 11 */
--font-heading: var(--font-sans); /* Line 12 */
```

**Current Implementation:**

- Fonts are defined via CSS custom properties
- No explicit font loading mechanism (likely shadcn/ui default setup)
- No Google Fonts or external font imports found
- Uses system font stack via Tailwind's default sans font

### 3.2 Analysis

The codebase currently relies on:

1. **shadcn/tailwind.css** for base styling
2. **CSS custom properties** for font tokens
3. **System fonts** via Tailwind's `font-sans` utility

### 3.3 `next/font` Migration Plan

**Priority:** Medium

**Steps:**

1. **Identify target fonts**
   - Default sans font (system stack)
   - Monospace font for code/addresses
   - Consider Geist font (Next.js default) or custom fonts

2. **Update `app/layout.tsx`** to import fonts with `next/font`:

   ```tsx
   import { Geist, Geist_Mono } from "next/font/google";

   const geistSans = Geist({
     subsets: ["latin"],
     variable: "--font-sans",
   });

   const geistMono = Geist_Mono({
     subsets: ["latin"],
     variable: "--font-mono",
   });
   ```

3. **Update `app/globals.css`** to use CSS variable names:
   - Already using `--font-sans`, `--font-mono`, `--font-heading`
   - Ensure they match the `variable` in font configuration

4. **Remove shadcn font imports** if present

### 3.4 Files to Modify

| File              | Change                                        |
| ----------------- | --------------------------------------------- |
| `app/layout.tsx`  | Add `next/font` imports and apply to `<html>` |
| `app/globals.css` | Verify CSS variables match font configuration |

### 3.5 Impact

| Aspect      | Impact                                                  |
| ----------- | ------------------------------------------------------- |
| Performance | High - self-hosted fonts eliminate external requests    |
| CLS         | High - fonts loaded before render prevents layout shift |
| Bundle size | Low - fonts loaded separately from JS bundle            |

---

## 4. Heavy Components Suitable for `next/dynamic`

### 4.1 `jdenticon` Analysis

**Current Usage:**

```tsx
// components/domain.tsx - Line 33-36
useEffect(() => {
  import("jdenticon").then(({ update }) => {
    if (ref.current) update(ref.current, value);
  });
}, [value]);
```

**Current Loading:** Dynamic import inside `useEffect` (client-side only)

**Jdenticon Package Size:** ~3KB gzipped (lightweight)

**Recommendation:** Keep as-is. The dynamic import pattern is already optimal. The library is small enough that further optimization yields minimal benefit.

### 4.2 `chart.js` / `react-chartjs-2` Analysis

**Dependencies in `package.json`:**

```json
"chart.js": "^4.5.1",
"react-chartjs-2": "^5.3.1"
```

**Usage in Codebase:** NONE

These packages are installed but not imported anywhere. They should be:

1. **Removed** if not needed, OR
2. **Wrapped with `next/dynamic`** if future charts are needed

### 4.3 Other Heavy Dependencies

| Package                         | Version | Usage               | Recommendation                         |
| ------------------------------- | ------- | ------------------- | -------------------------------------- |
| `@sentry/nextjs`                | 10.47.0 | Error tracking      | Keep, already optimized                |
| `@tanstack/react-table`         | 8.21.3  | Table component     | Keep, tree-shakeable                   |
| `sonner`                        | 2.0.7   | Toast notifications | Keep, dynamically loaded in components |
| `@ledgerhq/hw-transport-webusb` | 6.33.0  | Ledger support      | Keep, dynamic import when needed       |

### 4.4 `next/dynamic` Candidates

Since `chart.js` is not used, there are no heavy charting components to dynamic import.

**If charts are added in the future:**

```tsx
const ChartComponent = dynamic(() => import("@/components/charts"), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

---

## 5. Implementation Order and Impact Assessment

### 5.1 Recommended Implementation Order

| Priority | Task                                            | Impact                  | Effort | Risk |
| -------- | ----------------------------------------------- | ----------------------- | ------ | ---- |
| 1        | Remove unused `chart.js` dependencies           | Medium (smaller bundle) | Low    | Low  |
| 2        | Add `next/font` configuration                   | High (performance)      | Low    | Low  |
| 3        | Audit and update `next.config.ts` for images    | Low                     | Low    | Low  |
| 4        | Review dynamic imports for further optimization | Low                     | Medium | Low  |

### 5.2 Detailed Impact Assessment

#### Priority 1: Remove Unused Dependencies

**Why first:** Reduces bundle size with minimal risk

**Changes:**

- Remove from `package.json`:
  - `chart.js`
  - `react-chartjs-2`

**Files to modify:** `package.json`

**Bundle impact:** ~50KB+ gzipped reduction

#### Priority 2: Add `next/font`

**Why second:** High performance impact, straightforward implementation

**Changes:**

- Update `app/layout.tsx` with font configuration
- Verify `app/globals.css` CSS variables

**Files to modify:**

- `app/layout.tsx`
- `app/globals.css` (verify only)

**Performance impact:**

- Eliminates external font requests
- Prevents CLS (Cumulative Layout Shift)
- Self-hosted fonts via CDN edge nodes

#### Priority 3: Image Configuration Audit

**Why third:** Future-proofing for when images are added

**Changes:**

- Review `next.config.ts` Content Security Policy for image sources
- Add `images.domains` or `images.remotePatterns` if external images needed

**Files to modify:** `next.config.ts`

#### Priority 4: Dynamic Import Review

**Why fourth:** Optimization based on actual usage patterns

**Current state:** `jdenticon` already dynamically imported
**Action:** Verify no other heavy components need optimization

---

## 6. Files to Modify

### Summary Table

| File              | Purpose        | Changes                              |
| ----------------- | -------------- | ------------------------------------ |
| `package.json`    | Dependencies   | Remove `chart.js`, `react-chartjs-2` |
| `app/layout.tsx`  | Root layout    | Add `next/font` configuration        |
| `app/globals.css` | Global styles  | Verify CSS variable names            |
| `next.config.ts`  | Next.js config | Update CSP for images if needed      |

### Detailed Changes

#### `package.json`

```diff
  "dependencies": {
-   "chart.js": "^4.5.1",
-   "react-chartjs-2": "^5.3.1",
    ...
  }
```

#### `app/layout.tsx`

```tsx
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      {/* ... rest of layout */}
    </html>
  );
}
```

#### `app/globals.css`

```css
@theme inline {
  --font-sans: var(--font-sans); /* Already correct */
  --font-mono: var(--font-geist-mono); /* Already correct */
  --font-heading: var(--font-sans); /* Already correct */
}
```

#### `next.config.ts` (if external images needed)

```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
      },
    ],
  },
  // ... rest of config
};
```

---

## 7. Testing Considerations

After implementing changes:

1. **Visual Regression:** Ensure fonts render correctly across all pages
2. **Performance:** Run Lighthouse to verify font loading improvements
3. **Bundle Size:** Verify `chart.js` removal reduces bundle
4. **CSP:** Test that images (if any) load without security errors

---

## 8. Dependencies Summary

| Action             | Dependencies to Add              | Dependencies to Remove        |
| ------------------ | -------------------------------- | ----------------------------- |
| Font optimization  | `next/font` (built-in)           | None                          |
| Bundle reduction   | None                             | `chart.js`, `react-chartjs-2` |
| Image optimization | None (use built-in `next/image`) | None                          |
