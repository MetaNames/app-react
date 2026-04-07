"use client";
import { useEffect, useRef } from "react";

export function JdenticonAvatar({
  value,
  size = 64,
}: {
  value: string;
  size?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    import("jdenticon").then(({ update }) => {
      if (ref.current) update(ref.current, value);
    });
  }, [value]);
  return <svg ref={ref} width={size} height={size} className="rounded-lg" />;
}
