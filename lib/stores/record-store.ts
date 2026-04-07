import { create } from "zustand";
import type { RecordRepository } from "@/lib/types";

interface RecordStore {
  repository: RecordRepository | null;
  onUpdate: (() => void) | null;
  setRepository: (repository: RecordRepository) => void;
  setOnUpdate: (onUpdate: () => void) => void;
  clear: () => void;
}

export const useRecordStore = create<RecordStore>((set) => ({
  repository: null,
  onUpdate: null,
  setRepository: (repository) => set({ repository }),
  setOnUpdate: (onUpdate) => set({ onUpdate }),
  clear: () => set({ repository: null, onUpdate: null }),
}));
