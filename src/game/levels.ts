import { type Range, isSolved, narrow } from "./range";
import { narrowRotated, valueAt } from "./rotated";
import { generateDuplicateValues, narrowDuplicates } from "./duplicates";

export type LevelId = "baseline" | "rotated" | "duplicates";

export interface LevelConfig {
  id: LevelId;
  name: string;
  size: number;
}

export const LEVELS: LevelConfig[] = [
  { id: "baseline", name: "Level 1 — Baseline", size: 100 },
  { id: "rotated", name: "Level 2 — Rotated", size: 100 },
  { id: "duplicates", name: "Level 3 — Duplicates", size: 100 },
];

export interface GameState {
  level: LevelConfig;
  /** baseline/rotated: the hidden value. duplicates: the hidden index (value alone is ambiguous). */
  target: number;
  /** Currently surviving (non-dimmed) extent, in the level's own domain. */
  range: Range;
  guesses: number;
  solved: boolean;
  /** rotated only: the rotation pivot used to build the displayed sequence. */
  rotatedPivot?: number;
  /** duplicates only: the sorted, duplicate-laden sequence backing the bar. */
  displayValues?: number[];
}

/** The full [lo, hi] extent a level's range starts at, in its own domain. */
export function boardExtent(level: LevelConfig): Range {
  return level.id === "baseline" ? { lo: 1, hi: level.size } : { lo: 0, hi: level.size - 1 };
}

export function randomTarget(size: number, rand: () => number = Math.random): number {
  return Math.floor(rand() * size) + 1;
}

export function createGame(level: LevelConfig, rand: () => number = Math.random): GameState {
  const range = boardExtent(level);
  const guesses = 0;
  const solved = false;

  if (level.id === "rotated") {
    const pivot = 1 + Math.floor(rand() * (level.size - 1));
    const targetIndex = Math.floor(rand() * level.size);
    const target = valueAt({ size: level.size, pivot }, targetIndex);
    return { level, target, range, guesses, solved, rotatedPivot: pivot };
  }

  if (level.id === "duplicates") {
    const displayValues = generateDuplicateValues(level.size, rand);
    const target = Math.floor(rand() * level.size);
    return { level, target, range, guesses, solved, displayValues };
  }

  return { level, target: randomTarget(level.size, rand), range, guesses, solved };
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

  let range: Range;
  if (state.level.id === "rotated") {
    range = narrowRotated({ size: state.level.size, pivot: state.rotatedPivot! }, state.range, guess, state.target);
  } else if (state.level.id === "duplicates") {
    range = narrowDuplicates(state.displayValues!, state.range, guess, state.target);
  } else {
    range = narrow(state.range, guess, state.target);
  }

  return { ...state, range, guesses: state.guesses + 1, solved: isSolved(range) };
}
