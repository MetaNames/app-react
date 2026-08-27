import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

import { useRecordManagement } from "../hooks/use-record-management";
import { useRecordStore } from "../stores/record-store";
import { TransactionError } from "../error";
import type { RecordRepository } from "../types";

const captureException = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

const toastFn = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: Object.assign((...args: unknown[]) => toastFn(...args), {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  }),
}));

vi.mock("@/lib/url", () => ({
  explorerTransactionUrl: (tx: string) => `https://explorer/${tx}`,
}));

/** A repository whose write resolves to a transaction with the given on-chain outcome. */
const repositoryWith = (
  outcome: { hasError: boolean; errorMessage?: string } | Error,
) => {
  const intent = (transactionHash: string) => ({
    transactionHash,
    fetchResult:
      outcome instanceof Error
        ? Promise.reject(outcome)
        : Promise.resolve(outcome),
  });
  return {
    update: vi.fn(async () => intent("0xupdate")),
    delete: vi.fn(async () => intent("0xdelete")),
  } as unknown as RecordRepository & {
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const setRepository = (repository: RecordRepository | null) => {
  useRecordStore.setState({ repository });
};

const renderRecord = (
  overrides: Partial<{ value: string; onUpdate: () => void }> = {},
) =>
  renderHook(() =>
    useRecordManagement({
      type: "Bio",
      value: "original bio",
      ...overrides,
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  setRepository(null);
  // An unhandled rejection from a repository stub must not leak between tests.
  process.removeAllListeners("unhandledRejection");
});

describe("useRecordManagement — editing", () => {
  it("restores the original value when an edit is cancelled", () => {
    const { result } = renderRecord();

    act(() => {
      result.current.setEditing(true);
      result.current.setEditValue("half-typed");
    });
    act(() => result.current.cancelEdit());

    expect(result.current.editing).toBe(false);
    expect(result.current.editValue).toBe("original bio");
    expect(result.current.editError).toBeNull();
  });

  it("rejects an invalid value without touching the chain", async () => {
    const repository = repositoryWith({ hasError: false });
    setRepository(repository);
    const { result } = renderRecord();

    act(() => result.current.setEditValue("   "));
    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.editError).toBe("Value is required");
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("does nothing while a save is already in flight", async () => {
    // A second click on Save must not submit a second transaction: the guard is
    // the only thing standing between an impatient user and a double write.
    let release: (v: { hasError: boolean }) => void = () => {};
    const repository = {
      update: vi.fn(async () => ({
        transactionHash: "0xslow",
        fetchResult: new Promise<{ hasError: boolean }>((resolve) => {
          release = resolve;
        }),
      })),
    } as unknown as RecordRepository & { update: ReturnType<typeof vi.fn> };
    setRepository(repository);
    const { result } = renderRecord();

    act(() => result.current.setEditValue("a new bio"));
    let first: Promise<void>;
    act(() => {
      first = result.current.handleSave();
    });
    await waitFor(() => expect(result.current.saving).toBe(true));

    await act(async () => {
      await result.current.handleSave();
    });
    expect(repository.update).toHaveBeenCalledTimes(1);

    await act(async () => {
      release({ hasError: false });
      await first;
    });
    expect(result.current.saving).toBe(false);
  });

  it("saves, announces the transaction, and leaves edit mode", async () => {
    const repository = repositoryWith({ hasError: false });
    setRepository(repository);
    const onUpdate = vi.fn();
    const { result } = renderRecord({ onUpdate });

    act(() => {
      result.current.setEditing(true);
      result.current.setEditValue("a new bio");
    });
    await act(async () => {
      await result.current.handleSave();
    });

    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: "a new bio" }),
    );
    expect(toastSuccess).toHaveBeenCalledWith("Record updated successfully");
    expect(result.current.editing).toBe(false);
    expect(onUpdate).toHaveBeenCalled();
  });

  it("opens the explorer from the submitted-transaction toast", async () => {
    const repository = repositoryWith({ hasError: false });
    setRepository(repository);
    const open = vi.fn();
    vi.stubGlobal("open", open);
    const { result } = renderRecord();

    act(() => result.current.setEditValue("a new bio"));
    await act(async () => {
      await result.current.handleSave();
    });

    const [, options] = toastFn.mock.calls.at(-1) as [
      string,
      { action: { onClick: () => void } },
    ];
    options.action.onClick();
    expect(open).toHaveBeenCalledWith("https://explorer/0xupdate", "_blank");
    vi.unstubAllGlobals();
  });

  it("keeps the user in edit mode when the transaction reverts", async () => {
    // A reverted transaction resolves rather than rejecting, so success is not
    // "the promise settled" — leaving edit mode here would report a write that
    // never landed as done.
    setRepository(repositoryWith({ hasError: true, errorMessage: "reverted" }));
    const onUpdate = vi.fn();
    const { result } = renderRecord({ onUpdate });

    act(() => {
      result.current.setEditing(true);
      result.current.setEditValue("a new bio");
    });
    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.editing).toBe(true);
    expect(result.current.editError).toBe("Failed to update record.");
    expect(onUpdate).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("reports an error thrown before the transaction ran", async () => {
    // Not a TransactionError: nothing has reported it yet, so this path owes
    // the user a toast and Sentry an event.
    const repository = {
      update: vi.fn(async () => {
        throw new Error("wallet rejected");
      }),
    } as unknown as RecordRepository;
    setRepository(repository);
    const { result } = renderRecord();

    act(() => result.current.setEditValue("a new bio"));
    await act(async () => {
      await result.current.handleSave();
    });

    expect(captureException).toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith("wallet rejected");
    expect(result.current.editError).toBe("wallet rejected");
  });

  it("does not double-report a failure runTransaction already handled", async () => {
    setRepository(repositoryWith(new Error("rpc down")));
    const { result } = renderRecord();

    act(() => result.current.setEditValue("a new bio"));
    await act(async () => {
      await result.current.handleSave();
    });

    // One report, from runTransaction itself — the catch must recognise its
    // own TransactionError and stay quiet.
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(result.current.editError).toBe("Failed to update record.");
    expect(
      toastError.mock.calls.some(([m]) => m instanceof TransactionError),
    ).toBe(false);
  });
});

describe("useRecordManagement — deleting", () => {
  it("deletes, closes the dialog, and notifies the caller", async () => {
    const repository = repositoryWith({ hasError: false });
    setRepository(repository);
    const onUpdate = vi.fn();
    const { result } = renderRecord({ onUpdate });

    act(() => result.current.setDeleteOpen(true));
    await act(async () => {
      await result.current.handleDelete();
    });

    expect(repository.delete).toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith("Record deleted successfully");
    expect(result.current.deleteOpen).toBe(false);
    expect(onUpdate).toHaveBeenCalled();
  });

  it("leaves the dialog open when the delete reverts", async () => {
    setRepository(repositoryWith({ hasError: true, errorMessage: "reverted" }));
    const { result } = renderRecord();

    act(() => result.current.setDeleteOpen(true));
    await act(async () => {
      await result.current.handleDelete();
    });

    expect(result.current.deleteOpen).toBe(true);
    expect(result.current.deleting).toBe(false);
  });

  it("does nothing without a repository", async () => {
    const { result } = renderRecord();

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(result.current.deleting).toBe(false);
    expect(toastFn).not.toHaveBeenCalled();
  });
});
