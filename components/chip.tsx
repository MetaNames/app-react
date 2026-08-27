"use client";
import { Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";
interface ChipProps {
  label: string;
  value?: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "available" | "registered";
  className?: string;
}
export function Chip({
  label,
  value,
  href,
  onClick,
  variant = "default",
  className,
}: ChipProps) {
  const { copied, copy } = useCopyToClipboard();
  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (value) await copy(value);
  };
  const variantClass = {
    default: "bg-muted text-muted-foreground",
    available: "bg-[var(--chip-available-bg)] text-[var(--chip-available-fg)]",
    registered:
      "bg-[var(--chip-registered-bg)] text-[var(--chip-registered-fg)]",
  }[variant];
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-90 transition-all border border-transparent",
        variantClass,
        className,
      )}
    >
      <span className="text-xs opacity-70">{label}</span>
      {value && <span className="font-semibold">{value}</span>}
      {href ? (
        <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
      ) : value ? (
        copied ? (
          <Check className="h-3 w-3" />
        ) : (
          <Copy className="h-3 w-3 opacity-60" />
        )
      ) : null}
      {copied && (
        <span role="status" className="sr-only">
          Copied to the clipboard
        </span>
      )}
    </span>
  );
  if (href) {
    // A chip pointing inside the app (the Parent chip, for one) was opening a
    // new tab, stranding the user with a second copy of the site instead of
    // navigating. Only external destinations get the new-tab treatment.
    const external = /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//");
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="focus-ring rounded-full"
      >
        {content}
      </a>
    );
  }
  if (onClick)
    return (
      <button onClick={onClick} className="focus-ring rounded-full">
        {content}
      </button>
    );
  return (
    <button onClick={handleCopy} className="focus-ring rounded-full">
      {content}
    </button>
  );
}
