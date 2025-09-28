import { describe, it, expect } from "vitest";
import { bundle, leagues, clubs } from "../src";

describe("content dataset", () => {
  it("has 6 leagues", () => {
    expect(leagues).toHaveLength(6);
  });
  it("has ~200 clubs (exactly 200)", () => {
    expect(clubs.length).toBe(200);
  });
  it("bundle combines leagues and clubs", () => {
    expect(bundle.leagues.length).toBe(6);
    expect(bundle.clubs.length).toBe(200);
  });
});

