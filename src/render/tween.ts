import type { Range } from "../game/range";

export interface Tween {
  from: Range;
  to: Range;
  startTime: number;
  duration: number;
}

/** docs/DESIGN.md §5: the surviving range's edges animate over ~100ms ease-out. */
export const SPLIT_TWEEN_DURATION_MS = 100;

export function createTween(
  from: Range,
  to: Range,
  startTime: number,
  duration: number = SPLIT_TWEEN_DURATION_MS,
): Tween {
  return { from, to, startTime, duration };
}

/** Cubic ease-out: fast start, gentle settle — matches the DESIGN.md motion language. */
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function isTweenDone(tween: Tween, now: number): boolean {
  return now - tween.startTime >= tween.duration;
}

/** Interpolated range at `now`; clamps to `tween.to` once the duration has elapsed. */
export function tweenRange(tween: Tween, now: number): Range {
  if (tween.duration <= 0) return tween.to;
  const t = Math.min(1, Math.max(0, (now - tween.startTime) / tween.duration));
  const eased = easeOutCubic(t);
  return {
    lo: lerp(tween.from.lo, tween.to.lo, eased),
    hi: lerp(tween.from.hi, tween.to.hi, eased),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
