import type { Range } from "./range";

/**
 * Builds a non-decreasing sequence of `size` values in [1, size] with
 * deliberate runs of duplicates, so a guess doesn't always cleanly halve
 * the search space. `rand` is injected for deterministic tests.
 */
export function generateDuplicateValues(size: number, rand: () => number = Math.random): number[] {
  const maxDistinct = Math.max(1, Math.round(size * 0.6));
  const values = Array.from({ length: size }, () => Math.floor(rand() * maxDistinct) + 1);
  values.sort((a, b) => a - b);
  return values;
}

/**
 * Narrows a surviving index range given a guessed value and the hidden
 * target's index (identity, not just value — duplicates mean the value
 * alone can't pin down which cell is "the" target). Only eliminates
 * indices whose value is provably on the wrong side of the target, so a
 * guess equal to the target's value narrows to the whole run sharing
 * that value rather than jumping straight to a single cell.
 */
export function narrowDuplicates(values: number[], range: Range, guessValue: number, targetIndex: number): Range {
  const targetValue = values[targetIndex];

  if (guessValue === targetValue) {
    let lo = range.lo;
    let hi = range.hi;
    while (lo < hi && values[lo] < guessValue) lo++;
    while (hi > lo && values[hi] > guessValue) hi--;
    return { lo, hi };
  }

  if (guessValue < targetValue) {
    let lo = range.lo;
    while (lo <= range.hi && values[lo] <= guessValue) lo++;
    return { lo, hi: range.hi };
  }

  let hi = range.hi;
  while (hi >= range.lo && values[hi] >= guessValue) hi--;
  return { lo: range.lo, hi };
}
