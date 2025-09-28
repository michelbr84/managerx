import { describe, it, expect } from "vitest";
import { generateBundle, GOLDEN_SEASON_SEED } from "../src";

describe("content dataset", () => {
  it("has 6 leagues", () => {
    const bundle = generateBundle(GOLDEN_SEASON_SEED);
    expect(bundle.leagues).toHaveLength(6);
  });
  it("has ~200 clubs (exactly 200)", () => {
    const bundle = generateBundle(GOLDEN_SEASON_SEED);
    expect(bundle.clubs.length).toBe(200);
  });
  it("bundle combines leagues and clubs", () => {
    const bundle = generateBundle(GOLDEN_SEASON_SEED);
    expect(bundle.leagues.length).toBe(6);
    expect(bundle.clubs.length).toBe(200);
  });
});
