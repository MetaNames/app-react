# Implement Next.js Server Actions for Domain Mutations

## 1. Analysis of Current Mutation Patterns

### Overview

The codebase currently performs all blockchain mutations (registration, transfer, renewals, record updates) directly from client components via the MetaNames SDK. These mutations follow a consistent pattern across multiple files.

### Current Pattern Flow

```
Client Component → SDK Method → Intent → send() → waitForConfirmation() → toast notifications
```

### Affected Files

| File                                    | Mutations                                    |
| --------------------------------------- | -------------------------------------------- |
| `lib/hooks/use-domain-payment.ts`       | `register()`, `renew()`, `approveMintFees()` |
| `lib/hooks/use-record-management.ts`    | `update()`, `delete()`                       |
| `components/subdomain-registration.tsx` | `register()`                                 |
| `app/domain/[name]/transfer/page.tsx`   | `transfer()`                                 |
| `components/records.tsx`                | `create()`                                   |

### Pattern Analysis

#### Domain Registration (`use-domain-payment.ts:114-119`)

```typescript
intent = await metaNamesSdk.domainRepository.register({
  domain,
  to: address,
  subscriptionYears: years,
  byocSymbol: selectedCoin as SdkBYOCSymbol,
});
```

**Problems:**

- SDK imported into client bundle
- Wallet address derived from client-side wallet store
- No server-side validation of domain availability before attempting registration
- Fees fetched client-side and could be stale by time of submission

#### Domain Transfer (`app/domain/[name]/transfer/page.tsx:26-30`)

```typescript
const intent = await metaNamesSdk.domainRepository.transfer({
  domain: domainName,
  from: address,
  to: recipient,
});
```

**Problems:**

- Recipient address validated only via regex (`validateAddress`)
- No server-side verification of ownership before transfer
- No confirmation of domain exists before transfer

#### Record Management (`use-record-management.ts:47-50`)

```typescript
const intent = await (repository as any).update({
  class: classInfo.value,
  data: editValue,
});
```

**Problems:**

- Type casting bypasses TypeScript safety
- Validation client-side only
- No atomic guarantees

#### Common Issues Across All Patterns

1. **Bundle Size**: SDK (~6.3.1) is included in client bundle despite only needing wallet connection for signing
2. **Security**: No server-side validation of transaction parameters
3. **Race Conditions**: Domain availability could change between check and registration
4. **Toast Coupling**: UI logic (toast) embedded in mutation logic, not separated

---

## 2. Operations That Should Become Server Actions

### Tier 1: Critical (High Impact, Low Risk)

| Operation                       | Rationale                                              |
| ------------------------------- | ------------------------------------------------------ |
| **Domain Registration**         | Most frequent, highest value. Requires pre-validation. |
| **Domain Renewal**              | Similar to registration, uses same flow.               |
| **Domain Transfer**             | Irreversible, needs ownership verification.            |
| **Record Create/Update/Delete** | Lower risk but improves bundle size.                   |

### Tier 2: Important (Medium Impact)

| Operation                  | Rationale                                                |
| -------------------------- | -------------------------------------------------------- |
| **Approve Mint Fees**      | Depends on balance check which requires server-side SDK. |
| **Subdomain Registration** | Can use same action as main registration.                |

### Operations to Keep as Client-Side

| Operation                      | Rationale                            |
| ------------------------------ | ------------------------------------ |
| **Wallet Connection**          | Requires browser wallet integration. |
| **Transaction Status Polling** | Real-time UI updates needed.         |
| **Balance Checks (display)**   | For UI display only.                 |

---

## 3. Server Action File Structure Proposal

```
app/
├── actions/
│   ├── domain/
│   │   ├── register.ts          # Domain registration action
│   │   ├── renew.ts             # Domain renewal action
│   │   ├── transfer.ts          # Domain transfer action
│   │   └── approve-fees.ts     # Approve mint fees action
│   ├── records/
│   │   ├── create.ts            # Create record action
│   │   ├── update.ts            # Update record action
│   │   └── delete.ts            # Delete record action
│   └── lib/
│       ├── types.ts             # Action-specific types
│       ├── errors.ts            # Action-specific errors
│       ├── validation.ts        # Shared validation logic
│       └── sdk.ts               # Server-side SDK initialization
lib/
├── actions/                     # Shared action utilities
│   ├── errors.ts
│   └── validation.ts
```

### Key Principles

1. **One action file per operation** - Easier to maintain, tree-shakeable
2. **`lib/actions/` for shared code** - Validation, error types
3. **Server-only SDK initialization** - SDK never imported in client code

---

## 4. Step-by-Step Implementation: Domain Registration

### Step 1: Create Server-Side SDK Helper

**File: `lib/actions/sdk.ts`**

```typescript
import { getServerSdk } from "@/lib/sdk";
import type { MetaNamesSdk } from "@metanames/sdk";

let sdkInstance: MetaNamesSdk | null = null;

export function getServerSdkInstance(): MetaNamesSdk {
  if (!sdkInstance) {
    sdkInstance = getServerSdk();
  }
  return sdkInstance;
}
```

### Step 2: Define Action Types and Errors

**File: `lib/actions/types.ts`**

```typescript
import type { BYOCSymbol } from "@metanames/sdk/dist/providers/config";

export interface RegisterDomainInput {
  domain: string;
  to: string;
  subscriptionYears: number;
  byocSymbol: BYOCSymbol;
}

export interface RegisterDomainResult {
  success: boolean;
  txHash?: string;
  domain?: string;
}

export interface RenewDomainInput {
  domain: string;
  payer: string;
  subscriptionYears: number;
  byocSymbol: BYOCSymbol;
}

export interface TransferDomainInput {
  domain: string;
  from: string;
  to: string;
}
```

**File: `lib/actions/errors.ts`**

```typescript
export class ActionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "ActionError";
  }
}

export class ValidationError extends ActionError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class DomainNotAvailableError extends ActionError {
  constructor(domain: string) {
    super(`Domain ${domain} is not available`, "DOMAIN_NOT_AVAILABLE", 409);
    this.name = "DomainNotAvailableError";
  }
}

export class InsufficientBalanceError extends ActionError {
  constructor(coin: string) {
    super(`Insufficient balance for ${coin}`, "INSUFFICIENT_BALANCE", 402);
    this.name = "InsufficientBalanceError";
  }
}

export class NotDomainOwnerError extends ActionError {
  constructor(domain: string) {
    super(`You do not own domain ${domain}`, "NOT_OWNER", 403);
    this.name = "NotDomainOwnerError";
  }
}

export function isActionError(e: unknown): e is ActionError {
  return e instanceof ActionError;
}
```

### Step 3: Create Validation Utilities

**File: `lib/actions/validation.ts`**

```typescript
import { validateAddress } from "@/lib/wallet";
import { normalizeDomain, parseSubdomain } from "@/lib/domain-validator";
import type {
  RegisterDomainInput,
  TransferDomainInput,
  RenewDomainInput,
} from "./types";
import { ValidationError } from "./errors";

export function validateDomainName(domain: string): string {
  const normalized = normalizeDomain(domain);
  if (!normalized) {
    throw new ValidationError("Invalid domain name");
  }
  return normalized;
}

export function validateRegistrationInput(
  input: RegisterDomainInput,
): RegisterDomainInput {
  const { domain, to, subscriptionYears, byocSymbol } = input;

  if (!domain || typeof domain !== "string") {
    throw new ValidationError("Domain is required");
  }

  const normalizedDomain = validateDomainName(domain);

  if (!to || !validateAddress(to)) {
    throw new ValidationError("Invalid recipient address");
  }

  if (!subscriptionYears || subscriptionYears < 1 || subscriptionYears > 10) {
    throw new ValidationError("Subscription years must be between 1 and 10");
  }

  if (!byocSymbol || typeof byocSymbol !== "string") {
    throw new ValidationError("Invalid BYOC symbol");
  }

  return {
    domain: normalizedDomain,
    to,
    subscriptionYears,
    byocSymbol,
  };
}

export function validateTransferInput(
  input: TransferDomainInput,
): TransferDomainInput {
  const { domain, from, to } = input;

  if (!domain) {
    throw new ValidationError("Domain is required");
  }

  const normalizedDomain = validateDomainName(domain);

  if (!from || !validateAddress(from)) {
    throw new ValidationError("Invalid sender address");
  }

  if (!to || !validateAddress(to)) {
    throw new ValidationError("Invalid recipient address");
  }

  if (from === to) {
    throw new ValidationError("Sender and recipient must be different");
  }

  return {
    domain: normalizedDomain,
    from,
    to,
  };
}

export function validateRenewInput(input: RenewDomainInput): RenewDomainInput {
  const { domain, payer, subscriptionYears, byocSymbol } = input;

  if (!domain) {
    throw new ValidationError("Domain is required");
  }

  const normalizedDomain = validateDomainName(domain);

  if (!payer || !validateAddress(payer)) {
    throw new ValidationError("Invalid payer address");
  }

  if (!subscriptionYears || subscriptionYears < 1 || subscriptionYears > 10) {
    throw new ValidationError("Subscription years must be between 1 and 10");
  }

  if (!byocSymbol || typeof byocSymbol !== "string") {
    throw new ValidationError("Invalid BYOC symbol");
  }

  return {
    domain: normalizedDomain,
    payer,
    subscriptionYears,
    byocSymbol,
  };
}
```

### Step 4: Create Domain Registration Action

**File: `app/actions/domain/register.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { getServerSdkInstance } from "@/lib/actions/sdk";
import type {
  RegisterDomainInput,
  RegisterDomainResult,
} from "@/lib/actions/types";
import { validateRegistrationInput } from "@/lib/actions/validation";
import {
  ValidationError,
  DomainNotAvailableError,
  InsufficientBalanceError,
  ActionError,
} from "@/lib/actions/errors";
import { checkDomain } from "@/lib/api";

export async function registerDomain(
  input: RegisterDomainInput,
): Promise<RegisterDomainResult> {
  let validatedInput: RegisterDomainInput;

  try {
    validatedInput = validateRegistrationInput(input);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(
      error instanceof Error ? error.message : "Invalid input",
    );
  }

  // Server-side domain availability check
  const availability = await checkDomain(validatedInput.domain);
  if (availability.error) {
    throw new ActionError(
      `Failed to check domain availability: ${availability.error}`,
      "AVAILABILITY_CHECK_FAILED",
    );
  }

  if (availability.data?.domainPresent) {
    throw new DomainNotAvailableError(validatedInput.domain);
  }

  // Server-side registration via SDK
  const sdk = getServerSdkInstance();

  try {
    const intent = await sdk.domainRepository.register({
      domain: validatedInput.domain,
      to: validatedInput.to,
      subscriptionYears: validatedInput.subscriptionYears,
      byocSymbol: validatedInput.byocSymbol,
    });

    // Wait for transaction confirmation on server
    await intent.waitForConfirmation();

    // Revalidate relevant paths
    revalidatePath("/profile");
    revalidatePath(`/domain/${validatedInput.domain}`);
    revalidatePath("/");

    return {
      success: true,
      txHash: intent.transactionHash,
      domain: validatedInput.domain,
    };
  } catch (error) {
    // Handle SDK-specific errors
    if (error instanceof Error) {
      if (error.message.includes("balance")) {
        throw new InsufficientBalanceError(validatedInput.byocSymbol);
      }
      throw new ActionError(error.message, "REGISTRATION_FAILED");
    }
    throw new ActionError("Registration failed", "UNKNOWN_ERROR");
  }
}
```

### Step 5: Create Approve Fees Action

**File: `app/actions/domain/approve-fees.ts`**

```typescript
"use server";

import { getServerSdkInstance } from "@/lib/actions/sdk";
import type { BYOCSymbol } from "@metanames/sdk/dist/providers/config";
import { validateDomainName } from "@/lib/actions/validation";
import { ValidationError, ActionError } from "@/lib/actions/errors";

export interface ApproveFeesInput {
  domain: string;
  byocSymbol: BYOCSymbol;
  years: number;
}

export interface ApproveFeesResult {
  success: boolean;
  txHash?: string;
  feesApproved?: boolean;
}

export async function approveMintFees(
  input: ApproveFeesInput,
): Promise<ApproveFeesResult> {
  const { domain, byocSymbol, years } = input;

  if (!domain) {
    throw new ValidationError("Domain is required");
  }

  if (!years || years < 1) {
    throw new ValidationError("Years must be at least 1");
  }

  const normalizedDomain = validateDomainName(domain);

  const sdk = getServerSdkInstance();

  try {
    const intent = await sdk.domainRepository.approveMintFees(
      normalizedDomain,
      byocSymbol,
      years,
    );

    await intent.waitForConfirmation();

    return {
      success: true,
      txHash: intent.transactionHash,
      feesApproved: true,
    };
  } catch (error) {
    throw new ActionError(
      error instanceof Error ? error.message : "Failed to approve fees",
      "APPROVE_FEES_FAILED",
    );
  }
}
```

### Step 6: Create Transfer Action

**File: `app/actions/domain/transfer.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { getServerSdkInstance } from "@/lib/actions/sdk";
import type { TransferDomainInput } from "@/lib/actions/types";
import { validateTransferInput } from "@/lib/actions/validation";
import {
  ValidationError,
  NotDomainOwnerError,
  ActionError,
} from "@/lib/actions/errors";

export interface TransferDomainResult {
  success: boolean;
  txHash?: string;
}

export async function transferDomain(
  input: TransferDomainInput,
): Promise<TransferDomainResult> {
  const validatedInput = validateTransferInput(input);

  const sdk = getServerSdkInstance();

  try {
    // Verify ownership on server
    const domain = await sdk.domainRepository.find(validatedInput.domain);
    if (!domain) {
      throw new ActionError(
        `Domain ${validatedInput.domain} not found`,
        "DOMAIN_NOT_FOUND",
        404,
      );
    }

    if (domain.owner.toLowerCase() !== validatedInput.from.toLowerCase()) {
      throw new NotDomainOwnerError(validatedInput.domain);
    }

    const intent = await sdk.domainRepository.transfer({
      domain: validatedInput.domain,
      from: validatedInput.from,
      to: validatedInput.to,
    });

    await intent.waitForConfirmation();

    revalidatePath("/profile");
    revalidatePath(`/domain/${validatedInput.domain}`);

    return {
      success: true,
      txHash: intent.transactionHash,
    };
  } catch (error) {
    if (error instanceof ActionError) {
      throw error;
    }
    throw new ActionError(
      error instanceof Error ? error.message : "Transfer failed",
      "TRANSFER_FAILED",
    );
  }
}
```

### Step 7: Create Renew Action

**File: `app/actions/domain/renew.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { getServerSdkInstance } from "@/lib/actions/sdk";
import type { RenewDomainInput } from "@/lib/actions/types";
import { validateRenewInput } from "@/lib/actions/validation";
import {
  ValidationError,
  NotDomainOwnerError,
  InsufficientBalanceError,
  ActionError,
} from "@/lib/actions/errors";

export interface RenewDomainResult {
  success: boolean;
  txHash?: string;
}

export async function renewDomain(
  input: RenewDomainInput,
): Promise<RenewDomainResult> {
  const validatedInput = validateRenewInput(input);

  const sdk = getServerSdkInstance();

  try {
    // Verify ownership
    const domain = await sdk.domainRepository.find(validatedInput.domain);
    if (!domain) {
      throw new ActionError(
        `Domain ${validatedInput.domain} not found`,
        "DOMAIN_NOT_FOUND",
        404,
      );
    }

    if (domain.owner.toLowerCase() !== validatedInput.payer.toLowerCase()) {
      throw new NotDomainOwnerError(validatedInput.domain);
    }

    const intent = await sdk.domainRepository.renew({
      domain: validatedInput.domain,
      payer: validatedInput.payer,
      byocSymbol: validatedInput.byocSymbol,
      subscriptionYears: validatedInput.subscriptionYears,
    });

    await intent.waitForConfirmation();

    revalidatePath("/profile");
    revalidatePath(`/domain/${validatedInput.domain}`);

    return {
      success: true,
      txHash: intent.transactionHash,
    };
  } catch (error) {
    if (error instanceof ActionError) {
      throw error;
    }
    if (error instanceof Error) {
      if (error.message.includes("balance")) {
        throw new InsufficientBalanceError(validatedInput.byocSymbol);
      }
      throw new ActionError(error.message, "RENEW_FAILED");
    }
    throw new ActionError("Renewal failed", "UNKNOWN_ERROR");
  }
}
```

---

## 5. How to Handle Form State and Validation

### Client-Side Form State

Continue using React state for form inputs, but delegate validation to Server Actions:

**File: `components/domain-registration-form.tsx`**

```typescript
"use client";

import { useState, useTransition, useCallback } from "react";
import { registerDomain } from "@/app/actions/domain/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { explorerTransactionUrl } from "@/lib/url";
import type { RegisterDomainInput } from "@/lib/actions/types";
import { ValidationError, DomainNotAvailableError, ActionError } from "@/lib/actions/errors";
import { useRouter } from "next/navigation";

interface DomainRegistrationFormProps {
  domain: string;
  address: string;
}

export function DomainRegistrationForm({
  domain,
  address,
}: DomainRegistrationFormProps) {
  const router = useRouter();
  const [years, setYears] = useState(1);
  const [selectedCoin, setSelectedCoin] = useState("ETH");
  const [isPending, startTransition] = useTransition();
  const [feesApproved, setFeesApproved] = useState(false);

  // Client-side validation for immediate feedback
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = useCallback(() => {
    setLocalError(null);

    const input: RegisterDomainInput = {
      domain,
      to: address,
      subscriptionYears: years,
      byocSymbol: selectedCoin as RegisterDomainInput["byocSymbol"],
    };

    startTransition(async () => {
      try {
        const result = await registerDomain(input);

        if (result.success && result.txHash) {
          toast.success("Domain registered successfully!", {
            action: {
              label: "View",
              onClick: () => window.open(explorerTransactionUrl(result.txHash!), "_blank"),
            },
          });
          router.push(`/domain/${domain}`);
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          setLocalError(error.message);
          toast.error(error.message);
        } else if (error instanceof DomainNotAvailableError) {
          setLocalError(error.message);
          toast.error(error.message);
          router.push("/");
        } else if (error instanceof ActionError) {
          toast.error(error.message);
        } else {
          toast.error("Registration failed. Please try again.");
        }
      }
    });
  }, [domain, address, years, selectedCoin, router]);

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      {/* Form fields */}
      <Input
        type="number"
        value={years}
        onChange={(e) => setYears(Number(e.target.value))}
        min={1}
        max={10}
      />

      {localError && (
        <p className="text-destructive text-sm">{localError}</p>
      )}

      <Button
        type="submit"
        disabled={isPending || !feesApproved}
      >
        {isPending ? "Registering..." : "Register domain"}
      </Button>
    </form>
  );
}
```

### Form State Management Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Component                         │
├─────────────────────────────────────────────────────────────┤
│  - useState for form inputs (years, coin, etc.)             │
│  - useTransition for async submission                       │
│  - Local validation (optional, for UX)                     │
│  - Toast notifications                                      │
│  - Navigation on success                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Server Action                              │
├─────────────────────────────────────────────────────────────┤
│  - Input validation (required, security)                    │
│  - Business logic (domain availability, ownership)         │
│  - SDK call                                                  │
│  - Error mapping                                            │
│  - Revalidation                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Error Handling Approach

### Error Hierarchy

```
Error
├── ActionError (base for all action errors)
│   ├── ValidationError (400)
│   ├── DomainNotAvailableError (409)
│   ├── InsufficientBalanceError (402)
│   ├── NotDomainOwnerError (403)
│   └── ActionError (generic 500)
├── SDK Errors (caught and wrapped)
└── Network Errors (caught and wrapped)
```

### Client-Side Error Handling

```typescript
// hooks/use-action-form.ts
import { useState, useTransition } from "react";
import type { ActionError } from "@/lib/actions/errors";

interface UseActionFormOptions<TInput, TResult> {
  action: (input: TInput) => Promise<TResult>;
  onSuccess?: (result: TResult) => void;
  onError?: (error: ActionError) => void;
}

export function useActionForm<TInput, TResult>(
  options: UseActionFormOptions<TInput, TResult>,
) {
  const [error, setError] = useState<ActionError | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (input: TInput) => {
    setError(null);

    startTransition(async () => {
      try {
        const result = await options.action(input);
        options.onSuccess?.(result);
      } catch (e) {
        if (isActionError(e)) {
          setError(e);
          options.onError?.(e);
        } else {
          const actionError = new ActionError(
            e instanceof Error ? e.message : "An unexpected error occurred",
            "UNKNOWN_ERROR",
          );
          setError(actionError);
          options.onError?.(actionError);
        }
      }
    });
  };

  return { submit, error, isPending };
}
```

### Error Toast Mapping

```typescript
import { ActionError } from "@/lib/actions/errors";

function getToastMessage(error: ActionError): {
  message: string;
  action?: { label: string; onClick: () => void };
} {
  switch (error.code) {
    case "INSUFFICIENT_BALANCE":
      return {
        message: `Insufficient balance for ${error.message.split(" ").pop()}`,
        action: {
          label: "Add funds",
          onClick: () => window.open(bridgeUrl(), "_blank"),
        },
      };
    case "DOMAIN_NOT_AVAILABLE":
      return {
        message: error.message,
      };
    case "VALIDATION_ERROR":
      return {
        message: error.message,
      };
    default:
      return {
        message: "An error occurred. Please try again.",
      };
  }
}
```

### Server-Side Error Handling

```typescript
// app/actions/domain/register.ts
export async function registerDomain(
  input: RegisterDomainInput,
): Promise<RegisterDomainResult> {
  try {
    // Action logic
  } catch (error) {
    // Log error for debugging
    console.error("Register domain failed:", error);

    // Re-throw known errors as-is
    if (error instanceof ActionError) {
      throw error;
    }

    // Wrap unknown errors
    throw new ActionError(
      "Registration failed. Please try again.",
      "INTERNAL_ERROR",
      500,
    );
  }
}
```

---

## 7. Files to Create/Modify

### New Files to Create

| File Path                            | Purpose                               |
| ------------------------------------ | ------------------------------------- |
| `app/actions/domain/register.ts`     | Domain registration Server Action     |
| `app/actions/domain/renew.ts`        | Domain renewal Server Action          |
| `app/actions/domain/transfer.ts`     | Domain transfer Server Action         |
| `app/actions/domain/approve-fees.ts` | Approve mint fees Server Action       |
| `app/actions/records/create.ts`      | Create record Server Action           |
| `app/actions/records/update.ts`      | Update record Server Action           |
| `app/actions/records/delete.ts`      | Delete record Server Action           |
| `lib/actions/sdk.ts`                 | Server-side SDK initialization        |
| `lib/actions/types.ts`               | Action input/output types             |
| `lib/actions/errors.ts`              | Action error classes                  |
| `lib/actions/validation.ts`          | Shared validation utilities           |
| `lib/hooks/use-action-form.ts`       | Reusable form hook for Server Actions |

### Files to Modify

| File                                    | Changes                                               |
| --------------------------------------- | ----------------------------------------------------- |
| `lib/hooks/use-domain-payment.ts`       | Replace SDK calls with Server Actions                 |
| `lib/hooks/use-record-management.ts`    | Replace SDK calls with Server Actions                 |
| `components/subdomain-registration.tsx` | Use `registerDomain` action                           |
| `components/domain-payment.tsx`         | Use Server Actions for registration/renewal           |
| `components/records.tsx`                | Use record Server Actions                             |
| `app/domain/[name]/transfer/page.tsx`   | Use `transferDomain` action                           |
| `app/components/record.tsx`             | Use record Server Actions                             |
| `app/layout.tsx`                        | Ensure `"use server"` boundary at app level if needed |

### Files to Review (No Changes Expected)

| File                         | Reason                                           |
| ---------------------------- | ------------------------------------------------ |
| `lib/sdk.ts`                 | Contains `getServerSdk()` - already server-ready |
| `lib/wallet.ts`              | Client-side wallet operations only               |
| `lib/stores/wallet-store.ts` | Client-side wallet state only                    |
| `lib/stores/sdk-store.ts`    | Client-side SDK state only                       |

### Testing Files to Create

| File                                       | Purpose                  |
| ------------------------------------------ | ------------------------ |
| `lib/actions/__tests__/register.test.ts`   | Test registration action |
| `lib/actions/__tests__/validation.test.ts` | Test validation logic    |
| `lib/actions/__tests__/errors.test.ts`     | Test error handling      |

---

## 8. Migration Checklist

### Phase 1: Foundation

- [ ] Create `lib/actions/errors.ts` with error classes
- [ ] Create `lib/actions/types.ts` with action types
- [ ] Create `lib/actions/validation.ts` with validation utilities
- [ ] Create `lib/actions/sdk.ts` with server SDK initialization
- [ ] Create `lib/hooks/use-action-form.ts` for form handling

### Phase 2: Core Actions

- [ ] Implement `registerDomain` action
- [ ] Implement `renewDomain` action
- [ ] Implement `transferDomain` action
- [ ] Implement `approveMintFees` action

### Phase 3: Record Actions

- [ ] Implement `createRecord` action
- [ ] Implement `updateRecord` action
- [ ] Implement `deleteRecord` action

### Phase 4: UI Migration

- [ ] Update `use-domain-payment.ts` to use Server Actions
- [ ] Update `use-record-management.ts` to use Server Actions
- [ ] Update `components/domain-payment.tsx`
- [ ] Update `components/records.tsx`
- [ ] Update `app/domain/[name]/transfer/page.tsx`
- [ ] Update `components/subdomain-registration.tsx`

### Phase 5: Cleanup

- [ ] Remove SDK imports from client components
- [ ] Verify SDK not in client bundle (check bundle size)
- [ ] Add unit tests for actions
- [ ] Add integration tests for form flows

---

## 9. Bundle Size Impact Estimate

**Current State:**

- SDK (`@metanames/sdk`) imported in multiple client components
- Estimated SDK size impact: ~50-100KB gzipped

**After Migration:**

- SDK only imported in Server Actions
- Server bundle increases slightly
- Client bundle decreases by SDK size
- Net improvement: Better caching (server actions cached, client bundles smaller)
