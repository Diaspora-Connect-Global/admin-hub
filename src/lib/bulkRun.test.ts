import { describe, it, expect, vi } from "vitest";
import { runBulk } from "./bulkRun";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("runBulk", () => {
  it("returns one outcome per item, in input order, and keeps going past failures", async () => {
    const outcomes = await runBulk(["a", "b", "c"], async (item) => {
      if (item === "b") throw new Error("refused");
    });
    expect(outcomes.map((o) => [o.item, o.ok])).toEqual([
      ["a", true],
      ["b", false],
      ["c", true],
    ]);
    expect((outcomes[1].error as Error).message).toBe("refused");
  });

  it("never runs more than `concurrency` workers at once", async () => {
    let inFlight = 0;
    let peak = 0;
    await runBulk(
      Array.from({ length: 10 }, (_, i) => i),
      async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await tick();
        inFlight -= 1;
      },
      { concurrency: 3 },
    );
    expect(peak).toBe(3);
  });

  it("reports progress after every item", async () => {
    const onProgress = vi.fn();
    await runBulk([1, 2], async () => {}, { onProgress });
    expect(onProgress.mock.calls).toEqual([
      [1, 2],
      [2, 2],
    ]);
  });

  it("handles an empty list", async () => {
    expect(await runBulk([], async () => {})).toEqual([]);
  });
});
