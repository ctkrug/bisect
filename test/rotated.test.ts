import { describe, expect, it } from "vitest";
import { indexOf, narrowRotated, valueAt, type RotatedLevel } from "../src/game/rotated";
import { narrow } from "../src/game/range";

// Rotated at pivot 4 over size 10: displayed order is 5,6,7,8,9,10,1,2,3,4
const level: RotatedLevel = { size: 10, pivot: 4 };

describe("valueAt / indexOf", () => {
  it("are inverses of each other across the whole range", () => {
    for (let index = 0; index < level.size; index++) {
      expect(indexOf(level, valueAt(level, index))).toBe(index);
    }
  });

  it("matches the expected rotated sequence", () => {
    const displayed = Array.from({ length: level.size }, (_, i) => valueAt(level, i));
    expect(displayed).toEqual([5, 6, 7, 8, 9, 10, 1, 2, 3, 4]);
  });
});

describe("narrowRotated", () => {
  it("collapses to a single index on an exact guess", () => {
    const result = narrowRotated(level, { lo: 0, hi: 9 }, 7, 7);
    expect(result).toEqual({ lo: indexOf(level, 7), hi: indexOf(level, 7) });
  });

  it("keeps the correct index-half, which diverges from naive ascending-value narrowing", () => {
    // target value 2 sits at index 8; guess value 7 sits at index 2.
    // Correct: guessIndex(2) < targetIndex(8), so the surviving half is [3, 9].
    const result = narrowRotated(level, { lo: 0, hi: 9 }, 7, 2);
    expect(result).toEqual({ lo: 3, hi: 9 });

    // A naive narrow() operating on raw values would see guess(7) > target(2)
    // and keep the *lower value* half [1, 6] — a completely different, wrong
    // answer once you're reasoning about bar positions instead of values.
    const naive = narrow({ lo: 1, hi: 10 }, 7, 2);
    expect(naive).toEqual({ lo: 1, hi: 6 });
  });

  it("keeps the lower index-half when the guess sits after the target position", () => {
    // target value 9 at index 4; guess value 3 at index 8.
    const result = narrowRotated(level, { lo: 0, hi: 9 }, 3, 9);
    expect(result).toEqual({ lo: 0, hi: 7 });
  });

  it("never widens the range when re-guessing an already-eliminated index", () => {
    // target value 2 at index 7; guess value 8 (index 3) narrows to [4, 9].
    const narrowed = narrowRotated(level, { lo: 0, hi: 9 }, 8, 2);
    expect(narrowed).toEqual({ lo: 4, hi: 9 });
    // Re-guessing value 5 (index 0) is stale — its index is already below lo.
    const restale = narrowRotated(level, narrowed, 5, 2);
    expect(restale).toEqual(narrowed);
  });
});
