import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";

const writeText = vi.fn(async () => {});

beforeEach(() => {
  vi.useFakeTimers();
  writeText.mockClear();
  writeText.mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useCopyToClipboard", () => {
  it("writes the value and flags the copy", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("one.mpc");
    });

    expect(writeText).toHaveBeenCalledWith("one.mpc");
    expect(result.current.copied).toBe(true);
  });

  it("clears the flag after the confirmation window", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("one.mpc");
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.copied).toBe(false);
  });

  it("does not claim success when the clipboard is denied", async () => {
    writeText.mockRejectedValueOnce(new Error("NotAllowedError"));
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("one.mpc");
    });

    // A checkmark over a copy that never happened is worse than no feedback.
    expect(result.current.copied).toBe(false);
  });

  it("restarts the window when copied again", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("one.mpc");
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    await act(async () => {
      await result.current.copy("two.mpc");
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.copied).toBe(true);
  });

  it("drops its timer on unmount", async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("one.mpc");
    });
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
