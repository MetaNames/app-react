import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Uses the root layout's remaining main-axis space to center compact page
 * content while retaining padding when content grows beyond the viewport.
 */
export function CompactPage({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col justify-center py-8 sm:py-12",
        className,
      )}
      {...props}
    />
  );
}
