"use client";
import { useState, useCallback } from "react";
import { validateRecordValue } from "@/lib/records";
import type { RecordClass } from "@/lib/types";
import { toast } from "sonner";
import { explorerTransactionUrl } from "@/lib/url";
import { RECORD_CLASS_MAP } from "@/lib/constants";
import { useRecordStore } from "@/lib/stores/record-store";

interface UseRecordManagementProps {
  type: RecordClass;
  value: string;
  onUpdate?: () => void;
}

export function useRecordManagement({
  type,
  value,
  onUpdate,
}: UseRecordManagementProps) {
  const repository = useRecordStore((s) => s.repository);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cancelEdit = () => {
    setEditing(false);
    setEditValue(value);
    setEditError(null);
  };

  const handleSave = useCallback(async () => {
    if (saving) return;
    const err = validateRecordValue(type, editValue);
    if (err) {
      setEditError(err);
      return;
    }
    const classInfo = RECORD_CLASS_MAP[type];
    if (!classInfo || !repository) return;
    setSaving(true);
    try {
      const intent = await repository.update({
        class: classInfo.value,
        data: editValue,
      });
      const txHash = intent.transactionHash;
      toast("New Transaction submitted", {
        action: {
          label: "View",
          onClick: () => window.open(explorerTransactionUrl(txHash), "_blank"),
        },
        duration: 10000,
      });
      await intent.fetchResult;
      toast.success("Record updated successfully");
      setEditing(false);
      onUpdate?.();
    } finally {
      setSaving(false);
    }
  }, [saving, type, editValue, repository, onUpdate]);

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    const classInfo = RECORD_CLASS_MAP[type];
    if (!classInfo || !repository) return;
    setDeleting(true);
    try {
      const intent = await repository.delete(classInfo.value);
      const txHash = intent.transactionHash;
      toast("New Transaction submitted", {
        action: {
          label: "View",
          onClick: () => window.open(explorerTransactionUrl(txHash), "_blank"),
        },
        duration: 10000,
      });
      await intent.fetchResult;
      toast.success("Record deleted successfully");
      setDeleteOpen(false);
      onUpdate?.();
    } finally {
      setDeleting(false);
    }
  }, [deleting, type, repository, onUpdate]);

  return {
    editing,
    editValue,
    editError,
    deleteOpen,
    saving,
    deleting,
    handleSave,
    handleDelete,
    cancelEdit,
    setEditing,
    setEditValue,
    setEditError,
    setDeleteOpen,
  };
}
