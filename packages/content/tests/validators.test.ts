import { describe, it, expect, beforeAll } from "vitest";
import { join } from "node:path";
import { generateBundle, writeGeneratedFiles } from "../src/generate";
import {
  validateAttributeRanges,
  validateBundleShape,
  validateDuplicates,
  validateFixtures,
  validateSquads,
} from "../src/validators";
import { GOLDEN_SEASON_SEED } from "../src/schema";

const dataDir = join(process.cwd(), "src", "data");

describe("content validators", () => {
  beforeAll(() => {
    const bundle = generateBundle(GOLDEN_SEASON_SEED);
    writeGeneratedFiles(bundle, dataDir);
  });

  it("bundle shape is valid", () => {
    const res = validateBundleShape(dataDir);
    expect(res.ok).toBe(true);
  });

  it("no duplicates across leagues for names", () => {
    const res = validateDuplicates(dataDir);
    expect(res.ok).toBe(true);
  });

  it("attribute ranges are realistic", () => {
    const res = validateAttributeRanges(dataDir);
    expect(res.ok).toBe(true);
  });

  it("squads have valid sizes and GK count", () => {
    const res = validateSquads(dataDir);
    expect(res.ok).toBe(true);
  });

  it("fixtures are double round-robin with correct counts", () => {
    const res = validateFixtures(dataDir);
    expect(res.ok).toBe(true);
  });
});
