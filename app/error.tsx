"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="spotlight-beam flex flex-col items-center justify-center gap-6 py-24 text-center relative z-10 w-full">
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button
        onClick={() => unstable_retry()}
        className="shadow-[0_0_24px_var(--glow)]"
      >
        Try again
      </Button>
    </div>
  );
}
