import { describe, expect, it } from "vitest";
import { computeBoardLayout, extentFraction } from "../src/render/layout";

describe("computeBoardLayout", () => {
  it("centers a horizontal panel capped at 960px on desktop", () => {
    const layout = computeBoardLayout(1440, 900);
    expect(layout.orientation).toBe("horizontal");
    expect(layout.width).toBe(960);
    expect(layout.height).toBeCloseTo(900 * 0.65);
    expect(layout.x).toBeCloseTo((1440 - 960) / 2);
  });

  it("shrinks the panel to fit narrower desktop widths", () => {
    const layout = computeBoardLayout(700, 900);
    expect(layout.orientation).toBe("horizontal");
    expect(layout.width).toBe(700 - 48);
  });

  it("rotates to a vertical stack below the phone breakpoint", () => {
    const layout = computeBoardLayout(390, 844);
    expect(layout.orientation).toBe("vertical");
    expect(layout.height).toBeCloseTo(844 * 0.55);
    expect(layout.width).toBe(390 - 48);
  });
});

describe("extentFraction", () => {
  it("maps the full bounds to the full 0..1 fraction", () => {
    expect(extentFraction({ lo: 1, hi: 100 }, { lo: 1, hi: 100 })).toEqual({ start: 0, length: 1 });
  });

  it("maps a narrowed upper half proportionally", () => {
    const frac = extentFraction({ lo: 51, hi: 100 }, { lo: 1, hi: 100 });
    expect(frac.start).toBeCloseTo(0.505, 3);
    expect(frac.length).toBeCloseTo(0.495, 3);
  });

  it("maps a fully collapsed range to zero length", () => {
    const frac = extentFraction({ lo: 55, hi: 55 }, { lo: 1, hi: 100 });
    expect(frac.length).toBe(0);
  });

  it("does not divide by zero when bounds are degenerate", () => {
    expect(extentFraction({ lo: 1, hi: 1 }, { lo: 1, hi: 1 })).toEqual({ start: 0, length: 1 });
  });
});
