import { cn } from "@/lib/utils";

/**
 * Placeholder block used to reserve layout space while async content loads,
 * so panels fade in rather than shifting the page (CLS) as they arrive.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-[hsl(0_0%_100%/0.06)]",
        className,
      )}
      {...props}
    />
  );
}
