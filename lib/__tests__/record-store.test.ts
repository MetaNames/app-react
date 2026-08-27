import { describe, it, expect, beforeEach } from "vitest";

import { useRecordStore } from "../stores/record-store";
import type { RecordRepository } from "../types";

const repository = {} as RecordRepository;

beforeEach(() => {
  useRecordStore.setState({ repository: null });
});

describe("useRecordStore", () => {
  it("starts without a repository", () => {
    expect(useRecordStore.getState().repository).toBeNull();
  });

  it("holds the repository it is given", () => {
    useRecordStore.getState().setRepository(repository);
    expect(useRecordStore.getState().repository).toBe(repository);
  });

  it("drops the repository on clear", () => {
    // Disconnecting a wallet has to leave no repository behind: a stale one
    // would sign later writes with the previous account's strategy.
    useRecordStore.getState().setRepository(repository);
    useRecordStore.getState().clear();
    expect(useRecordStore.getState().repository).toBeNull();
  });
});
