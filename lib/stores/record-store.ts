import { create } from "zustand";
import type { RecordRepository } from "@/lib/types";

interface RecordStore {
  repository: RecordRepository | null;
  setRepository: (repository: RecordRepository) => void;
  clear: () => void;
}

export const useRecordStore = create<RecordStore>((set) => ({
  repository: null,
  setRepository: (repository) => set({ repository }),
  clear: () => set({ repository: null }),
}));
