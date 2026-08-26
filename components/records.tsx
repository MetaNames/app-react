"use client";
import { Record } from "@/components/record";
import { RecordsAddForm } from "@/components/records-add-form";
import { useRecordStore } from "@/lib/stores/record-store";
import type { RecordClass } from "@/lib/types";
import { FileText } from "lucide-react";

interface RecordsProps {
  records: Record<string, string>;
  onUpdate?: () => void;
}

export function Records({ records, onUpdate }: RecordsProps) {
  const repository = useRecordStore((s) => s.repository);

  const usedTypes = Object.keys(records) as RecordClass[];

  return (
    <div
      className="records glass-panel rounded-2xl p-4 flex flex-col gap-4"
      data-testid="records-container"
    >
      {usedTypes.length === 0 && (
        <div className="flex flex-col items-center gap-1 py-6 text-center">
          <FileText
            className="h-5 w-5 text-muted-foreground/60"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-sm">No records found</p>
          <p className="text-muted-foreground/70 text-xs">
            Attach a bio, links and socials to this name below.
          </p>
        </div>
      )}
      {usedTypes.map((type) => (
        <Record
          key={type}
          type={type}
          value={records[type]}
          onUpdate={onUpdate}
        />
      ))}
      {repository && onUpdate && (
        <RecordsAddForm
          records={records}
          repository={repository}
          onSuccess={onUpdate}
        />
      )}
    </div>
  );
}
