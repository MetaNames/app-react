"use client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
export function GoBackButton({ href }: { href?: string } = {}) {
  const router = useRouter();
  const handleClick = useCallback(() => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  }, [href, router]);
  return (
    <Button variant="ghost" onClick={handleClick} className="gap-2">
      <ArrowLeft className="h-4 w-4" /> Go back
    </Button>
  );
}
