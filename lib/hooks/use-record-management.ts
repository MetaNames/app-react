"use client";
import { useState, useCallback } from "react";
import { validateRecordValue } from "@/lib/records";
import type { RecordClass } from "@/lib/types";
import { toast } from "sonner";
import { explorerTransactionUrl } from "@/lib/url";
import { RECORD_CLASS_MAP } from "@/lib/constants";
import { useRecordStore } from "@/lib/stores/record-store";
import {
  TransactionError,
  errorMessage,
  reportAndAlert,
  runTransaction,
} from "@/lib/error";

const UPDATE_FAILED = "Failed to update record.";
const DELETE_FAILED = "Failed to delete record.";

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
      // A reverted transaction resolves rather than rejecting: without this
      // check an on-chain failure was reported to the user as a success.
      await runTransaction(intent.fetchResult, UPDATE_FAILED);
      toast.success("Record updated successfully");
      setEditing(false);
      onUpdate?.();
    } catch (e) {
      // runTransaction already reported and alerted its own failures; a wallet
      // rejection or RPC error thrown earlier still needs both.
      if (!(e instanceof TransactionError)) {
        await reportAndAlert(e, errorMessage(e, UPDATE_FAILED));
      }
      setEditError(errorMessage(e, UPDATE_FAILED));
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
      await runTransaction(intent.fetchResult, DELETE_FAILED);
      toast.success("Record deleted successfully");
      setDeleteOpen(false);
      onUpdate?.();
    } catch (e) {
      // Without this catch a rejected delete became an unhandled rejection:
      // no toast, no Sentry event, and the dialog left open with no reason why.
      if (!(e instanceof TransactionError)) {
        await reportAndAlert(e, errorMessage(e, DELETE_FAILED));
      }
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
