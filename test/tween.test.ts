import { describe, expect, it } from "vitest";
import { createTween, isTweenDone, tweenRange } from "../src/render/tween";

describe("tweenRange", () => {
  it("starts exactly at the from-range", () => {
    const tween = createTween({ lo: 1, hi: 100 }, { lo: 41, hi: 100 }, 0, 100);
    expect(tweenRange(tween, 0)).toEqual({ lo: 1, hi: 100 });
  });

  it("ends exactly at the to-range once the duration elapses", () => {
    const tween = createTween({ lo: 1, hi: 100 }, { lo: 41, hi: 100 }, 0, 100);
    expect(tweenRange(tween, 100)).toEqual({ lo: 41, hi: 100 });
  });

  it("clamps past the end instead of overshooting", () => {
    const tween = createTween({ lo: 1, hi: 100 }, { lo: 41, hi: 100 }, 0, 100);
    expect(tweenRange(tween, 500)).toEqual({ lo: 41, hi: 100 });
  });

  it("is partway between from and to mid-duration", () => {
    const tween = createTween({ lo: 0, hi: 100 }, { lo: 100, hi: 100 }, 0, 100);
    const mid = tweenRange(tween, 50);
    expect(mid.lo).toBeGreaterThan(0);
    expect(mid.lo).toBeLessThan(100);
  });

  it("returns the target range immediately for a zero duration", () => {
    const tween = createTween({ lo: 1, hi: 100 }, { lo: 41, hi: 100 }, 0, 0);
    expect(tweenRange(tween, 0)).toEqual({ lo: 41, hi: 100 });
  });
});

describe("isTweenDone", () => {
  it("is false before the duration elapses and true at/after it", () => {
    const tween = createTween({ lo: 1, hi: 100 }, { lo: 41, hi: 100 }, 1000, 100);
    expect(isTweenDone(tween, 1050)).toBe(false);
    expect(isTweenDone(tween, 1100)).toBe(true);
    expect(isTweenDone(tween, 2000)).toBe(true);
  });
});
