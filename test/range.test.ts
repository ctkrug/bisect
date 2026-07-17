import { describe, expect, it } from "vitest";
import { isSolved, narrow, optimalGuessCount } from "../src/game/range";

describe("narrow", () => {
  it("keeps only the upper half when the guess is too low", () => {
    expect(narrow({ lo: 1, hi: 100 }, 40, 77)).toEqual({ lo: 41, hi: 100 });
  });

  it("keeps only the lower half when the guess is too high", () => {
    expect(narrow({ lo: 1, hi: 100 }, 60, 12)).toEqual({ lo: 1, hi: 59 });
  });

  it("collapses to a single value on a correct guess", () => {
    expect(narrow({ lo: 1, hi: 100 }, 55, 55)).toEqual({ lo: 55, hi: 55 });
  });

  it("never widens the range when re-guessing an already-eliminated low value", () => {
    const narrowed = narrow({ lo: 1, hi: 100 }, 50, 75); // {lo: 51, hi: 100}
    const restale = narrow(narrowed, 10, 75); // 10 was already ruled out below the range
    expect(restale).toEqual(narrowed);
  });

  it("never widens the range when re-guessing an already-eliminated high value", () => {
    const narrowed = narrow({ lo: 1, hi: 100 }, 60, 12); // {lo: 1, hi: 59}
    const restale = narrow(narrowed, 90, 12); // 90 was already ruled out above the range
    expect(restale).toEqual(narrowed);
  });
});

describe("isSolved", () => {
  it("is true only when the range has collapsed to one value", () => {
    expect(isSolved({ lo: 55, hi: 55 })).toBe(true);
    expect(isSolved({ lo: 1, hi: 2 })).toBe(false);
  });
});

describe("optimalGuessCount", () => {
  it("matches ceil(log2(n)) for standard ranges", () => {
    expect(optimalGuessCount(1)).toBe(1);
    expect(optimalGuessCount(100)).toBe(7);
    expect(optimalGuessCount(1024)).toBe(10);
  });
});
