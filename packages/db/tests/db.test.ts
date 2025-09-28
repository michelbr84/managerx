import { describe, it, expect } from "vitest";
import { openDatabase } from "../src";

describe("db basic open", () => {
  it("opens sqlite database in memory", () => {
    const db = openDatabase(":memory:");
    expect(db).toBeTruthy();
  });
});

