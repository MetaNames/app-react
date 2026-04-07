"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { validateRecordValue, isUrlRecord } from "@/lib/records";
import type { RecordClass, RecordRepository } from "@/lib/types";
import { toast } from "sonner";
import { explorerTransactionUrl } from "@/lib/url";
import { RECORD_CLASS_MAP } from "@/lib/constants";

interface RecordProps {
  type: RecordClass;
  value: string;
  repository: RecordRepository;
  onUpdate: () => void;
}

export function Record({ type, value, repository, onUpdate }: RecordProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    const err = validateRecordValue(type, editValue);
    if (err) {
      setEditError(err);
      return;
    }
    const classInfo = RECORD_CLASS_MAP[type];
    if (!classInfo) return;
    setSaving(true);
    try {
      // @ts-expect-error - SDK expects number, not string RecordClass
      const intent = await repository.update({
        class: classInfo.value,
        data: editValue,
      });
      const txHash = await intent.send();
      toast("New Transaction submitted", {
        action: {
          label: "View",
          onClick: () => window.open(explorerTransactionUrl(txHash), "_blank"),
        },
        duration: 10000,
      });
      await intent.waitForConfirmation();
      toast.success("Record updated successfully");
      setEditing(false);
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    const classInfo = RECORD_CLASS_MAP[type];
    if (!classInfo) return;
    setDeleting(true);
    try {
      // @ts-expect-error - SDK expects number, not string RecordClass
      const intent = await repository.delete(classInfo.value);
      const txHash = await intent.send();
      toast("New Transaction submitted", {
        action: {
          label: "View",
          onClick: () => window.open(explorerTransactionUrl(txHash), "_blank"),
        },
        duration: 10000,
      });
      await intent.waitForConfirmation();
      toast.success("Record deleted successfully");
      setDeleteOpen(false);
      onUpdate();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="record-container flex items-start gap-3 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {type}
        </span>
        {editing ? (
          <div className="mt-1 flex flex-col gap-1">
            <Textarea
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                setEditError(null);
              }}
              rows={2}
              maxLength={64}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {editError && (
                <span className="text-destructive">{editError}</span>
              )}
              <span className="ml-auto">{editValue.length}/64</span>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 truncate">
            {isUrlRecord(type) ? (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {value}
              </a>
            ) : (
              value
            )}
            {type === "Price" && " $"}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <>
            <Button
              size="icon"
              variant="ghost"
              data-testid="save-record"
              onClick={handleSave}
              disabled={saving}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              data-testid="cancel-edit"
              onClick={() => {
                setEditing(false);
                setEditValue(value);
                setEditError(null);
              }}
              disabled={saving}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              size="icon"
              variant="ghost"
              data-testid="edit-record"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              data-testid="delete-record"
              onClick={() => setDeleteOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
          </DialogHeader>
          <p>Do you really want to remove the record?</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              No
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Yes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
