import type { Range } from "./range";

export interface RotatedLevel {
  size: number;
  /** Index (0-based) of the value that starts the displayed sequence. */
  pivot: number;
}

/** The value displayed at bar position `index`, given the level's rotation. */
export function valueAt(level: RotatedLevel, index: number): number {
  return ((index + level.pivot) % level.size) + 1;
}

/** The bar position (index) a given value is displayed at. */
export function indexOf(level: RotatedLevel, value: number): number {
  return ((value - 1 - level.pivot) % level.size + level.size) % level.size;
}

/**
 * Narrows the surviving index range given a guessed value and the hidden
 * target value. Unlike the baseline narrow(), the surviving half is
 * determined by comparing bar *positions* (indices), not raw values —
 * because under rotation, ascending value order no longer matches
 * ascending bar position.
 */
export function narrowRotated(level: RotatedLevel, range: Range, guessValue: number, targetValue: number): Range {
  const guessIndex = indexOf(level, guessValue);
  if (guessValue === targetValue) {
    return { lo: guessIndex, hi: guessIndex };
  }
  const targetIndex = indexOf(level, targetValue);
  // Clamp against the current bounds: a stale guess (re-submitting a value
  // already ruled out beyond lo/hi) must never widen the range back open.
  if (guessIndex < targetIndex) {
    return { lo: Math.max(range.lo, guessIndex + 1), hi: range.hi };
  }
  return { lo: range.lo, hi: Math.min(range.hi, guessIndex - 1) };
}
