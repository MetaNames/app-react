"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Renders when the domain lookup itself failed (network/API error), as
 * distinct from a lookup that succeeded and confirmed the domain doesn't
 * exist. Legacy surfaces this via an alert + redirect home; we do the same
 * here with the app's existing sonner toast, since a Server Component can't
 * call into the client toast/alert mechanism directly.
 */
export function DomainLoadError({ message }: { message: string }) {
  const router = useRouter();

  useEffect(() => {
    toast.error(message);
    router.replace("/");
  }, [message, router]);

  return (
    <div role="status" aria-label="Redirecting home">
      <span className="sr-only">{message}</span>
    </div>
  );
}
