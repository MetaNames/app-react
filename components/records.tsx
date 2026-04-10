"use client";
import { Record } from "@/components/record";
import { RecordsAddForm } from "@/components/records-add-form";
import { useRecordStore } from "@/lib/stores/record-store";
import type { RecordClass } from "@/lib/types";

interface RecordsProps {
  records: Record<string, string>;
  onUpdate?: () => void;
}

export function Records({ records, onUpdate }: RecordsProps) {
  const repository = useRecordStore((s) => s.repository);

  const usedTypes = Object.keys(records) as RecordClass[];

  return (
    <div
      className="records flex flex-col gap-4"
      data-testid="records-container"
    >
      {usedTypes.length === 0 && (
        <p className="text-muted-foreground text-sm">No records found</p>
      )}
      {usedTypes.map((type) => (
        <Record key={type} type={type} value={records[type]} onUpdate={onUpdate} />
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
