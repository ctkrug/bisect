export interface Range {
  lo: number;
  hi: number;
}

/**
 * Narrows a range given a guess against a target — the core mechanic the
 * whole game is built on. The returned range is what should render as the
 * surviving (non-dimmed) sliver of the bar.
 */
export function narrow(range: Range, guess: number, target: number): Range {
  if (guess === target) {
    return { lo: target, hi: target };
  }
  if (guess < target) {
    return { lo: guess + 1, hi: range.hi };
  }
  return { lo: range.lo, hi: guess - 1 };
}

export function isSolved(range: Range): boolean {
  return range.lo === range.hi;
}

/** Information-theoretic minimum guesses to find any value in a range of this size. */
export function optimalGuessCount(rangeSize: number): number {
  if (rangeSize <= 1) return 1;
  return Math.ceil(Math.log2(rangeSize));
}
