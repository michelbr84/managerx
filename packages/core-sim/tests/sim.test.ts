import { describe, it, expect } from "vitest";
import { createPrng, simulateMatch } from "../src";

describe("core-sim deterministic behavior", () => {
  it("PRNG produces stable sequence for same seed", () => {
    const a = createPrng("seed-123");
    const b = createPrng("seed-123");
    const seqA = Array.from({ length: 5 }, () => a.next());
    const seqB = Array.from({ length: 5 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("simulateMatch is deterministic for the same seed", () => {
    const r1 = simulateMatch("golden-seed");
    const r2 = simulateMatch("golden-seed");
    expect(r1).toEqual(r2);
    // Goals should be within a reasonable football range
    expect(r1.homeGoals).toBeGreaterThanOrEqual(0);
    expect(r1.homeGoals).toBeLessThanOrEqual(10);
    expect(r1.awayGoals).toBeGreaterThanOrEqual(0);
    expect(r1.awayGoals).toBeLessThanOrEqual(10);
  });
});
