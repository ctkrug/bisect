import type { Range } from "../game/range";

export type Orientation = "horizontal" | "vertical";

export interface BoardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: Orientation;
}

/** Below this viewport width the board rotates to a vertical stack (per docs/DESIGN.md §3). */
const PHONE_BREAKPOINT = 600;
const DESKTOP_MAX_WIDTH = 960;
const MARGIN = 24;

export function computeBoardLayout(viewportWidth: number, viewportHeight: number): BoardLayout {
  if (viewportWidth < PHONE_BREAKPOINT) {
    const width = viewportWidth - MARGIN * 2;
    const height = viewportHeight * 0.55;
    return { x: MARGIN, y: (viewportHeight - height) / 2, width, height, orientation: "vertical" };
  }

  const width = Math.min(DESKTOP_MAX_WIDTH, viewportWidth - MARGIN * 2);
  const height = viewportHeight * 0.65;
  return {
    x: (viewportWidth - width) / 2,
    y: (viewportHeight - height) / 2,
    width,
    height,
    orientation: "horizontal",
  };
}

export interface ExtentFraction {
  /** 0..1 distance from the start of the bounds to the start of the surviving range. */
  start: number;
  /** 0..1 fraction of the bounds the surviving range still occupies. */
  length: number;
}

/** Maps a surviving range within its full bounds to a normalized 0..1 fraction for drawing. */
export function extentFraction(range: Range, bounds: Range): ExtentFraction {
  const span = bounds.hi - bounds.lo;
  if (span <= 0) return { start: 0, length: 1 };
  const start = (range.lo - bounds.lo) / span;
  const length = (range.hi - range.lo) / span;
  return { start: clamp01(start), length: clamp01(length) };
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
