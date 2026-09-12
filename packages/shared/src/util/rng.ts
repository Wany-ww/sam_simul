export type Rng = () => number; // returns a float in [0, 1)

// A tiny seeded PRNG (xmur3 seed hash + mulberry32 generator), so turn
// resolution can be deterministic and replayable from a seed. Phase 2 doesn't
// consume randomness yet, but resolveTurn takes a seed from day one so
// Phase 3+ (disasters/events) doesn't need to change resolveTurn's signature.
export function createSeededRng(seed: string): Rng {
  const seedFn = xmur3(seed);
  return mulberry32(seedFn());
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
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed: number): Rng {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
