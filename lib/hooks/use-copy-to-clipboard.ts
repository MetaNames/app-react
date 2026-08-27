"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** How long the "Copied" confirmation stays up before the icon reverts. */
const COPIED_RESET_MS = 1500;

/**
 * Copy a value and flag it for a moment afterwards.
 *
 * Three components had grown their own version of this — the same state, the
 * same timer, the same unmount cleanup — and a fourth was about to. The timer
 * handle is held so unmounting mid-countdown does not leave a setState queued
 * against a component that is gone; record rows re-render on every edit, so
 * this is a real path, not a theoretical one.
 */
export function useCopyToClipboard(): {
  copied: boolean;
  copy: (value: string) => Promise<void>;
} {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const copy = useCallback(async (value: string) => {
    // A denied clipboard permission rejects; the copy simply did not happen,
    // and claiming otherwise with a checkmark would be worse than silence.
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }
    setCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }, []);

  return { copied, copy };
}
