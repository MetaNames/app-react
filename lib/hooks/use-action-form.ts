"use client";

import { useState, useTransition } from "react";
import { ActionError, isActionError } from "@/lib/actions/errors";

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
