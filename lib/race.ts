/**
 * Generation-counter race guard.
 *
 * React effect cleanup with `AbortController` only protects the fetch itself;
 * it does nothing to stop a stale `.then()`/`await` continuation that was
 * already scheduled before the newer request started. `trackLatest` hands out
 * monotonically increasing ids so a caller can cheaply check, after an await,
 * whether a newer call has since started and — if so — bail out instead of
 * driving state updates or navigation from stale data.
 *
 * Usage:
 *   const latest = trackLatest();
 *   async function run() {
 *     const id = latest.next();
 *     const data = await fetchSomething();
 *     if (!latest.check(id)) return; // superseded, ignore this response
 *     setState(data);
 *   }
 */
export interface LatestTracker {
  next(): number;
  check(id: number): boolean;
}

export function trackLatest(): LatestTracker {
  let latest = 0;

  return {
    next: () => ++latest,
    check: (id) => id === latest,
  };
}
