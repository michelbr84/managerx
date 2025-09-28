import { createPrng } from "./prng";

export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
}

function samplePoisson(rand: () => number, lambda: number): number {
  if (lambda <= 0) return 0;
  // Knuth's algorithm
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rand();
  } while (p > L);
  return k - 1;
}

export function simulateMatch(seed: string, homeAdvantage: number = 0.2): MatchResult {
  const prng = createPrng(`match:${seed}`);
  const base = 1.1;
  const homeLambda = base + homeAdvantage;
  const awayLambda = base - homeAdvantage * 0.5;
  const homeGoals = samplePoisson(prng.next, homeLambda);
  const awayGoals = samplePoisson(prng.next, awayLambda);
  return { homeGoals, awayGoals };
}
