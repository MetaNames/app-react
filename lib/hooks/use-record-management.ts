"use client";
import { useState } from "react";
import { validateRecordValue } from "@/lib/records";
import type { RecordClass, RecordRepository } from "@/lib/types";
import { toast } from "sonner";
import { explorerTransactionUrl } from "@/lib/url";
import { RECORD_CLASS_MAP } from "@/lib/constants";
import { useRecordStore } from "@/lib/stores/record-store";

interface UseRecordManagementProps {
  type: RecordClass;
  value: string;
  repository?: RecordRepository;
  onUpdate?: () => void;
}

export function useRecordManagement({
  type,
  value,
  repository: propRepository,
  onUpdate: propOnUpdate,
}: UseRecordManagementProps) {
  const storeRepository = useRecordStore((s) => s.repository);
  const storeOnUpdate = useRecordStore((s) => s.onUpdate);

  const repository = propRepository ?? storeRepository;
  const onUpdate = propOnUpdate ?? storeOnUpdate;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const intent = await (repository as any).update({
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
      onUpdate!();
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const intent = await (repository as any).delete(classInfo.value);
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
      onUpdate!();
    } finally {
      setDeleting(false);
    }
  };

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
