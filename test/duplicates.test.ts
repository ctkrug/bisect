import { describe, expect, it } from "vitest";
import { generateDuplicateValues, narrowDuplicates, resolveDuplicateIndex } from "../src/game/duplicates";

/** Deterministic PRNG so property tests are reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("generateDuplicateValues", () => {
  it("produces a non-decreasing sequence of the requested length within bounds", () => {
    const values = generateDuplicateValues(50, mulberry32(1));
    expect(values).toHaveLength(50);
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(50);
    }
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
  });

  it("contains genuine duplicate runs (fewer distinct values than cells)", () => {
    const values = generateDuplicateValues(50, mulberry32(7));
    expect(new Set(values).size).toBeLessThan(values.length);
  });
});

describe("narrowDuplicates", () => {
  const values = [2, 4, 4, 4, 4, 7, 9, 9];

  it("eliminates the provably-lower side on a too-low guess", () => {
    const result = narrowDuplicates(values, { lo: 0, hi: 7 }, 4, 6); // target index 6 -> value 9
    expect(result).toEqual({ lo: 5, hi: 7 });
  });

  it("eliminates the provably-higher side on a too-high guess", () => {
    const result = narrowDuplicates(values, { lo: 0, hi: 7 }, 7, 1); // target index 1 -> value 4
    expect(result).toEqual({ lo: 0, hi: 4 });
  });

  it("narrows to the whole duplicate run instead of a single cell on an exact-value guess", () => {
    // target index 2 has value 4, but indices 1-4 all share that value.
    const result = narrowDuplicates(values, { lo: 0, hi: 7 }, 4, 2);
    expect(result).toEqual({ lo: 1, hi: 4 });
    expect(result.hi - result.lo).toBeGreaterThan(0);
  });

  it("collapses to a single cell when the matching run has length 1", () => {
    const result = narrowDuplicates(values, { lo: 0, hi: 7 }, 7, 5);
    expect(result).toEqual({ lo: 5, hi: 5 });
  });

  it("never eliminates the target's index across a randomized sequence of guesses", () => {
    const rand = mulberry32(42);
    for (let trial = 0; trial < 25; trial++) {
      const size = 20;
      const arr = generateDuplicateValues(size, rand);
      const targetIndex = Math.floor(rand() * size);
      let range = { lo: 0, hi: size - 1 };
      for (let guessCount = 0; guessCount < size; guessCount++) {
        expect(targetIndex).toBeGreaterThanOrEqual(range.lo);
        expect(targetIndex).toBeLessThanOrEqual(range.hi);
        if (range.lo === range.hi) break;
        const guessIndex = Math.floor((range.lo + range.hi) / 2);
        range = narrowDuplicates(arr, range, arr[guessIndex], targetIndex);
      }
      expect(targetIndex).toBeGreaterThanOrEqual(range.lo);
      expect(targetIndex).toBeLessThanOrEqual(range.hi);
    }
  });

  it("regression: value guesses alone can get stuck inside a duplicate run", () => {
    // A flat run where every remaining cell shares the same value: no
    // value-based guess (too-low, too-high, or exact) can ever narrow
    // further once here, even guessing the exact value repeatedly.
    const flat = [5, 5, 5, 5, 5];
    let range = { lo: 0, hi: 4 };
    const targetIndex = 3;
    for (let i = 0; i < 10; i++) {
      range = narrowDuplicates(flat, range, 5, targetIndex);
    }
    expect(range).toEqual({ lo: 0, hi: 4 }); // never narrows past the flat run
  });
});

describe("resolveDuplicateIndex", () => {
  it("solves instantly on a correct pick", () => {
    expect(resolveDuplicateIndex({ lo: 0, hi: 4 }, 3, 3)).toEqual({ lo: 3, hi: 3 });
  });

  it("eliminates the picked index and everything provably on its side", () => {
    expect(resolveDuplicateIndex({ lo: 0, hi: 4 }, 1, 3)).toEqual({ lo: 2, hi: 4 });
    expect(resolveDuplicateIndex({ lo: 0, hi: 4 }, 4, 1)).toEqual({ lo: 0, hi: 3 });
  });

  it("leaves the range untouched for a pick outside current bounds", () => {
    expect(resolveDuplicateIndex({ lo: 2, hi: 4 }, 0, 3)).toEqual({ lo: 2, hi: 4 });
  });

  it("breaks the stuck-flat-run case that value guesses cannot resolve", () => {
    let range = { lo: 0, hi: 4 };
    const targetIndex = 3;
    // Linearly probing each candidate always finishes within run length.
    for (const pick of [0, 1, 2, 4, 3]) {
      if (range.lo === range.hi) break;
      range = resolveDuplicateIndex(range, pick, targetIndex);
    }
    expect(range).toEqual({ lo: 3, hi: 3 });
  });
});
