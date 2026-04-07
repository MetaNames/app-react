"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
export function GoBackButton({ href }: { href?: string } = {}) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      onClick={() => (href ? router.push(href) : router.back())}
      className="gap-2"
    >
      <ArrowLeft className="h-4 w-4" /> Go back
    </Button>
  );
}
