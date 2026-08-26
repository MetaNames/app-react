import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors the real domain layout (avatar + title block, tab strip, detail
 * sections) so the page settles in place instead of reflowing when the
 * server data arrives.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex flex-col gap-6 w-full max-w-2xl"
    >
      <div className="flex items-center gap-4">
        <Skeleton className="h-[72px] w-[72px] rounded-2xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <Skeleton className="h-9 w-44 rounded-xl" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-16" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-32 rounded-full" />
          <Skeleton className="h-7 w-40 rounded-full" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-16" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-36 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}
