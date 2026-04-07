import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface DomainsTableSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function DomainsTableSearch({
  value,
  onChange,
}: DomainsTableSearchProps) {
  return (
    <div className="relative max-w-xs">
      <Input
        data-testid="search-bar"
        placeholder="Search domains..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-8"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
