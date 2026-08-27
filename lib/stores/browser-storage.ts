/**
 * localStorage is not a given: Safari denies it in private windows, embedded
 * contexts can have it removed, and jsdom ships without it. Every one of those
 * throws on first touch, and an unhandled throw here takes down the module and
 * every page that imports it. A store backed by the fallback lives for the
 * session only, which is a far better outcome than a blank page.
 */
export function browserStorage(probeKey: string): Storage {
  try {
    const storage = globalThis.localStorage;
    // Reading the property can throw on its own; touching it proves it works.
    storage.getItem(probeKey);
    return storage;
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => void memory.set(key, value),
      removeItem: (key) => void memory.delete(key),
      clear: () => memory.clear(),
      key: (index) => [...memory.keys()][index] ?? null,
      get length() {
        return memory.size;
      },
    } satisfies Storage;
  }
}
