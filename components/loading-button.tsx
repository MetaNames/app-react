"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import type { ComponentProps } from "react";
interface LoadingButtonProps extends ComponentProps<typeof Button> {
  onClick?: () => Promise<void>;
  loadingText?: string;
}
export function LoadingButton({
  onClick,
  loadingText,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const handleClick = async () => {
    if (!onClick) return;
    setLoading(true);
    try {
      await onClick();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button {...props} disabled={disabled || loading} onClick={handleClick}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {loadingText ?? "Loading..."}
        </>
      ) : success ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          {children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
