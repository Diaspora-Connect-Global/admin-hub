export interface BulkOutcome<T> {
  item: T;
  ok: boolean;
  /** What the worker threw, when `ok` is false. */
  error?: unknown;
}

export interface BulkRunOptions {
  /** How many workers run at once. Clamped to 1…items. Default 4. */
  concurrency?: number;
  /** Called after every item settles, with the running count. */
  onProgress?: (done: number, total: number) => void;
}

/**
 * Runs `worker` over every item with bounded concurrency and never stops early:
 * one refused item must not hide the outcome of the others. Results come back in
 * the input order, one per item, so the caller can report exactly which ones
 * failed and why.
 *
 * Bounded on purpose — a console bulk action fans out one gateway request per
 * item, and an unbounded `Promise.all` over a 100-row page would open 100
 * concurrent requests against the same downstream service.
 */
export async function runBulk<T>(
  items: readonly T[],
  worker: (item: T) => Promise<void>,
  { concurrency = 4, onProgress }: BulkRunOptions = {},
): Promise<BulkOutcome<T>[]> {
  const results: BulkOutcome<T>[] = new Array(items.length);
  const lanes = Math.max(1, Math.min(concurrency, items.length));
  let next = 0;
  let done = 0;

  const lane = async () => {
    while (next < items.length) {
      const index = next++;
      const item = items[index];
      try {
        await worker(item);
        results[index] = { item, ok: true };
      } catch (error) {
        results[index] = { item, ok: false, error };
      }
      done += 1;
      onProgress?.(done, items.length);
    }
  };

  await Promise.all(Array.from({ length: lanes }, lane));
  return results;
}
