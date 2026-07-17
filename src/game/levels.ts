import { type Range, isSolved, narrow } from "./range";

export type LevelId = "baseline";

export interface LevelConfig {
  id: LevelId;
  name: string;
  size: number;
}

/** The three levels are added incrementally; only the baseline exists so far. */
export const LEVELS: LevelConfig[] = [{ id: "baseline", name: "Level 1 — Baseline", size: 100 }];

export interface GameState {
  level: LevelConfig;
  /** Hidden value the player is searching for. */
  target: number;
  /** Currently surviving (non-dimmed) extent, in the level's own domain. */
  range: Range;
  guesses: number;
  solved: boolean;
}

export function randomTarget(size: number, rand: () => number = Math.random): number {
  return Math.floor(rand() * size) + 1;
}

export function createGame(level: LevelConfig, target: number): GameState {
  return {
    level,
    target,
    range: { lo: 1, hi: level.size },
    guesses: 0,
    solved: false,
  };
}

export function isValidGuess(level: LevelConfig, guess: number): boolean {
  return Number.isInteger(guess) && guess >= 1 && guess <= level.size;
}

/**
 * Applies a guess to the game state. Invalid guesses (out of range, non-integer)
 * are the caller's responsibility to reject via isValidGuess before calling this.
 */
export function submitGuess(state: GameState, guess: number): GameState {
  if (state.solved) return state;
  const range = narrow(state.range, guess, state.target);
  return { ...state, range, guesses: state.guesses + 1, solved: isSolved(range) };
}
