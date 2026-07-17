import { describe, expect, it } from "vitest";
import { computeBoardLayout, extentFraction, pointToFraction } from "../src/render/layout";

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

  it("treats the breakpoint width itself as desktop, not phone", () => {
    expect(computeBoardLayout(600, 900).orientation).toBe("horizontal");
    expect(computeBoardLayout(599, 900).orientation).toBe("vertical");
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

describe("pointToFraction", () => {
  const horizontal = { x: 100, y: 50, width: 400, height: 200, orientation: "horizontal" as const };
  const vertical = { x: 20, y: 10, width: 100, height: 500, orientation: "vertical" as const };

  it("maps a horizontal point to its fraction along the x-axis", () => {
    expect(pointToFraction(100, 100, horizontal)).toBeCloseTo(0);
    expect(pointToFraction(500, 100, horizontal)).toBeCloseTo(1);
    expect(pointToFraction(300, 100, horizontal)).toBeCloseTo(0.5);
  });

  it("maps a vertical point to its fraction along the y-axis", () => {
    expect(pointToFraction(50, 10, vertical)).toBeCloseTo(0);
    expect(pointToFraction(50, 510, vertical)).toBeCloseTo(1);
    expect(pointToFraction(50, 260, vertical)).toBeCloseTo(0.5);
  });

  it("returns null for a point outside the panel", () => {
    expect(pointToFraction(0, 0, horizontal)).toBeNull();
    expect(pointToFraction(1000, 1000, horizontal)).toBeNull();
  });
});
