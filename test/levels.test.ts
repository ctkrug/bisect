import { describe, expect, it } from "vitest";
import { LEVELS, createGame, isValidGuess, randomTarget, submitGuess } from "../src/game/levels";

const baseline = LEVELS[0];

describe("randomTarget", () => {
  it("stays within [1, size] across the rand() domain", () => {
    expect(randomTarget(100, () => 0)).toBe(1);
    expect(randomTarget(100, () => 0.9999999)).toBe(100);
  });
});

describe("createGame", () => {
  it("starts unsolved with the full range and zero guesses", () => {
    const state = createGame(baseline, 42);
    expect(state.range).toEqual({ lo: 1, hi: 100 });
    expect(state.guesses).toBe(0);
    expect(state.solved).toBe(false);
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
    const state = createGame(baseline, 77);
    const next = submitGuess(state, 40);
    expect(next.range).toEqual({ lo: 41, hi: 100 });
    expect(next.guesses).toBe(1);
    expect(next.solved).toBe(false);
  });

  it("marks the game solved on an exact guess", () => {
    const state = createGame(baseline, 55);
    const next = submitGuess(state, 55);
    expect(next.solved).toBe(true);
    expect(next.range).toEqual({ lo: 55, hi: 55 });
  });

  it("is a no-op once solved", () => {
    const state = { ...createGame(baseline, 55), range: { lo: 55, hi: 55 }, solved: true, guesses: 3 };
    const next = submitGuess(state, 10);
    expect(next).toEqual(state);
  });
});
