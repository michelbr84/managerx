#!/usr/bin/env node
import { join } from "node:path";
import {
  validateAttributeRanges,
  validateBundleShape,
  validateDuplicates,
  validateFixtures,
  validateSquads,
} from "../validators";

function run() {
  const dataDir = join(process.cwd(), "src", "data");
  const results = [
    validateBundleShape(dataDir),
    validateDuplicates(dataDir),
    validateAttributeRanges(dataDir),
    validateSquads(dataDir),
    validateFixtures(dataDir),
  ];
  const ok = results.every((r) => r.ok);
  if (!ok) {
    for (const r of results) {
      for (const err of r.errors) {
         
        console.error(err);
      }
    }
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log("Content validation passed.");
}

run();
