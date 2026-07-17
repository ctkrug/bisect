import { describe, expect, it } from "vitest";
import {
  LEVELS,
  boardExtent,
  createGame,
  isValidGuess,
  randomTarget,
  submitGuess,
  submitPositionGuess,
} from "../src/game/levels";

const baseline = LEVELS[0];
const rotated = LEVELS[1];
const duplicates = LEVELS[2];

/** rand() that always returns a fixed value, for deterministic target selection. */
const fixedRand = (n: number) => () => n;

describe("randomTarget", () => {
  it("stays within [1, size] across the rand() domain", () => {
    expect(randomTarget(100, () => 0)).toBe(1);
    expect(randomTarget(100, () => 0.9999999)).toBe(100);
  });
});

describe("boardExtent", () => {
  it("is a 1-indexed value range for the baseline level", () => {
    expect(boardExtent(baseline)).toEqual({ lo: 1, hi: 100 });
  });

  it("is a 0-indexed position range for rotated/duplicates levels", () => {
    expect(boardExtent(rotated)).toEqual({ lo: 0, hi: 99 });
    expect(boardExtent(duplicates)).toEqual({ lo: 0, hi: 99 });
  });
});

describe("createGame", () => {
  it("starts unsolved with the full range and zero guesses", () => {
    const state = createGame(baseline, fixedRand(0.41));
    expect(state.target).toBe(42);
    expect(state.range).toEqual({ lo: 1, hi: 100 });
    expect(state.guesses).toBe(0);
    expect(state.solved).toBe(false);
  });

  it("attaches a rotation pivot for the rotated level", () => {
    const state = createGame(rotated, fixedRand(0.5));
    expect(state.rotatedPivot).toBeGreaterThan(0);
    expect(state.rotatedPivot).toBeLessThan(rotated.size);
  });

  it("attaches sorted duplicate-laden values for the duplicates level", () => {
    const state = createGame(duplicates, fixedRand(0.5));
    expect(state.displayValues).toHaveLength(duplicates.size);
    expect(state.target).toBeGreaterThanOrEqual(0);
    expect(state.target).toBeLessThan(duplicates.size);
  });
});

describe("isValidGuess", () => {
  it("accepts integers within the level bounds", () => {
    expect(isValidGuess(baseline, 1)).toBe(true);
    expect(isValidGuess(baseline, 100)).toBe(true);
    expect(isValidGuess(baseline, 50)).toBe(true);
  });

  it("rejects out-of-range and non-integer guesses", () => {
    expect(isValidGuess(baseline, 0)).toBe(false);
    expect(isValidGuess(baseline, 101)).toBe(false);
    expect(isValidGuess(baseline, 50.5)).toBe(false);
    expect(isValidGuess(baseline, Number.NaN)).toBe(false);
  });
});

describe("submitGuess", () => {
  it("narrows the range and increments the guess counter", () => {
    const state = createGame(baseline, fixedRand(0.76)); // target 77
    const next = submitGuess(state, 40);
    expect(next.range).toEqual({ lo: 41, hi: 100 });
    expect(next.guesses).toBe(1);
    expect(next.solved).toBe(false);
  });

  it("marks the game solved on an exact guess", () => {
    const state = createGame(baseline, fixedRand(0.54)); // target 55
    const next = submitGuess(state, 55);
    expect(next.solved).toBe(true);
    expect(next.range).toEqual({ lo: 55, hi: 55 });
  });

  it("is a no-op once solved", () => {
    const base = createGame(baseline, fixedRand(0.54));
    const state = { ...base, range: { lo: 55, hi: 55 }, solved: true, guesses: 3 };
    const next = submitGuess(state, 10);
    expect(next).toEqual(state);
  });

  it("drives a rotated-level game to a win using the level's own dispatch", () => {
    let state = createGame(rotated, fixedRand(0.3));
    state = submitGuess(state, state.target);
    expect(state.solved).toBe(true);
  });

  it("drives a duplicates-level game to a win using the level's own dispatch", () => {
    let state = createGame(duplicates, fixedRand(0.2));
    const targetValue = state.displayValues![state.target];
    state = submitGuess(state, targetValue);
    // May not solve in one guess if the target's value has duplicate neighbors,
    // but the target index must always remain within the surviving range.
    expect(state.target).toBeGreaterThanOrEqual(state.range.lo);
    expect(state.target).toBeLessThanOrEqual(state.range.hi);
  });
});

describe("submitPositionGuess", () => {
  it("is equivalent to typing the value at that position on baseline", () => {
    const state = createGame(baseline, fixedRand(0.76)); // target 77
    const fractionForValue40 = (40 - 1) / (baseline.size - 1);
    const next = submitPositionGuess(state, fractionForValue40);
    expect(next).toEqual(submitGuess(state, 40));
  });

  it("resolves to the correct rotated value at that bar position", () => {
    const state = createGame(rotated, fixedRand(0.3));
    // Guessing the actual target's own position must always win, regardless
    // of rotation, since position <-> value is a consistent bijection.
    const targetIndex = ((state.target - 1 - state.rotatedPivot!) % rotated.size + rotated.size) % rotated.size;
    const next = submitPositionGuess(state, targetIndex / (rotated.size - 1));
    expect(next.solved).toBe(true);
  });

  it("can always finish a duplicates game that value guesses alone cannot solve", () => {
    // A pathological all-duplicate board: every value guess is either an
    // uninformative "too low/high against a flat run" or lands exactly on
    // the shared value with no index information.
    let state = createGame(duplicates, fixedRand(0.5));
    state = { ...state, displayValues: new Array(duplicates.size).fill(7), target: 42 };
    state = submitGuess(state, 7); // value guess: makes zero progress on an all-flat board
    expect(state.solved).toBe(false);
    expect(state.range).toEqual({ lo: 0, hi: 99 });

    // Linear position probing still finishes it off.
    for (let i = 0; i < duplicates.size && !state.solved; i++) {
      state = submitPositionGuess(state, i / (duplicates.size - 1));
    }
    expect(state.solved).toBe(true);
  });

  it("is a no-op once solved", () => {
    const base = createGame(baseline, fixedRand(0.54));
    const state = { ...base, range: { lo: 55, hi: 55 }, solved: true, guesses: 3 };
    expect(submitPositionGuess(state, 0.9)).toEqual(state);
  });
});
