import type { ExtentFraction, BoardLayout } from "./layout";

/** Token values lifted from docs/DESIGN.md §2 — the single source of truth for the palette. */
export const THEME = {
  bg: "#0a1628",
  surface1: "#0f2138",
  surface2: "#16304f",
  text: "#e8f1fb",
  textMuted: "#7f9db9",
  accent: "#4fd1ff",
  accentSupport: "#ff8a4c",
  success: "#4ade80",
  danger: "#ff5c5c",
} as const;

const CORNER_RADIUS = 2;
const GRID_SPACING = 32;

export interface DrawBoardOptions {
  layout: BoardLayout;
  fraction: ExtentFraction;
  solved: boolean;
  /** 0 (idle) to 1 (peak) impact intensity, decaying over the ~90ms hit window. */
  impact: number;
  reducedMotion: boolean;
}

export function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = THEME.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = "rgba(79, 209, 255, 0.12)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += GRID_SPACING) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += GRID_SPACING) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function drawBoard(ctx: CanvasRenderingContext2D, opts: DrawBoardOptions): void {
  const { layout, fraction, solved, impact, reducedMotion } = opts;
  const shake = reducedMotion ? 0 : impact * 2;
  const ox = layout.x + (Math.random() - 0.5) * shake;
  const oy = layout.y;

  ctx.save();

  // Track: the full bounds of the search space, always visible as a dim outline.
  ctx.fillStyle = THEME.surface1;
  roundedRect(ctx, ox, oy, layout.width, layout.height, CORNER_RADIUS);
  ctx.fill();

  const isHorizontal = layout.orientation === "horizontal";
  const survivorRect = isHorizontal
    ? {
        x: ox + fraction.start * layout.width,
        y: oy,
        w: Math.max(1, fraction.length * layout.width),
        h: layout.height,
      }
    : {
        x: ox,
        y: oy + fraction.start * layout.height,
        w: layout.width,
        h: Math.max(1, fraction.length * layout.height),
      };

  // Dimmed (eliminated) regions: everything in the track outside the survivor rect.
  ctx.fillStyle = "rgba(22, 48, 79, 0.4)";
  if (isHorizontal) {
    ctx.fillRect(ox, oy, survivorRect.x - ox, layout.height);
    ctx.fillRect(survivorRect.x + survivorRect.w, oy, ox + layout.width - (survivorRect.x + survivorRect.w), layout.height);
  } else {
    ctx.fillRect(ox, oy, layout.width, survivorRect.y - oy);
    ctx.fillRect(ox, survivorRect.y + survivorRect.h, layout.width, oy + layout.height - (survivorRect.y + survivorRect.h));
  }

  // Surviving range: the live, glowing accent fill.
  ctx.save();
  ctx.shadowColor = "rgba(79, 209, 255, 0.55)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = solved ? THEME.success : THEME.accent;
  roundedRect(ctx, survivorRect.x, survivorRect.y, survivorRect.w, survivorRect.h, CORNER_RADIUS);
  ctx.fill();
  ctx.restore();

  // Cut line: flashes accent-support at the leading edge on every guess.
  if (impact > 0) {
    ctx.save();
    ctx.globalAlpha = impact;
    ctx.strokeStyle = THEME.accentSupport;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (isHorizontal) {
      ctx.moveTo(survivorRect.x, oy);
      ctx.lineTo(survivorRect.x, oy + layout.height);
    } else {
      ctx.moveTo(ox, survivorRect.y);
      ctx.lineTo(ox + layout.width, survivorRect.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = "rgba(79, 209, 255, 0.3)";
  ctx.lineWidth = 1;
  roundedRect(ctx, ox, oy, layout.width, layout.height, CORNER_RADIUS);
  ctx.stroke();

  ctx.restore();
}
