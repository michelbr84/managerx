export interface PseudoRandom {
  next(): number; // [0, 1)
  int(minInclusive: number, maxExclusive: number): number;
}

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function createPrng(seed: string | number): PseudoRandom {
  const seedStr = String(seed);
  const seedFn = xmur3(seedStr);
  const seedNum = seedFn();
  const rnd = mulberry32(seedNum);
  return {
    next: () => rnd(),
    int: (minInclusive: number, maxExclusive: number) => {
      if (!Number.isFinite(minInclusive) || !Number.isFinite(maxExclusive)) {
        throw new Error("Bounds must be finite numbers");
      }
      if (maxExclusive <= minInclusive) {
        throw new Error("maxExclusive must be greater than minInclusive");
      }
      const span = maxExclusive - minInclusive;
      return Math.floor(minInclusive + rnd() * span);
    },
  };
}

