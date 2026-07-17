import "./style.css";
import { LEVELS, boardExtent, createGame, isValidGuess, submitGuess, type GameState } from "./game/levels";
import { computeBoardLayout, extentFraction } from "./render/layout";
import { drawBackground, drawBoard } from "./render/board";
import { createTween, tweenRange, type Tween } from "./render/tween";

const IMPACT_DECAY_MS = 90;

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("missing #app root element");
}

app.innerHTML = `
  <canvas id="board" aria-hidden="true"></canvas>
  <header class="hud hud--top">
    <span class="wordmark">BISECT</span>
    <span id="level-name" class="level-name"></span>
  </header>
  <main class="status" id="status" aria-live="polite"></main>
  <footer class="hud hud--bottom">
    <form id="guess-form" class="guess-form" autocomplete="off">
      <label for="guess-input" class="visually-hidden">Enter your guess</label>
      <input
        id="guess-input"
        name="guess"
        type="number"
        inputmode="numeric"
        class="guess-input"
        placeholder="?"
      />
      <button type="submit" class="guess-submit">Guess</button>
    </form>
    <div id="error" class="error" role="alert"></div>
  </footer>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#board")!;
const ctx = canvas.getContext("2d")!;
const statusEl = document.querySelector<HTMLElement>("#status")!;
const levelNameEl = document.querySelector<HTMLElement>("#level-name")!;
const form = document.querySelector<HTMLFormElement>("#guess-form")!;
const input = document.querySelector<HTMLInputElement>("#guess-input")!;
const errorEl = document.querySelector<HTMLElement>("#error")!;

const level = LEVELS[0];
let game: GameState = createGame(level);
let tween: Tween = createTween(game.range, game.range, performance.now(), 0);
let impactStart = -Infinity;

levelNameEl.textContent = level.name;
input.min = "1";
input.max = String(level.size);
updateStatus();

function reducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function updateStatus(): void {
  statusEl.textContent = game.solved
    ? `Solved in ${game.guesses} guesses.`
    : `Guesses: ${game.guesses}`;
}

function showError(message: string): void {
  errorEl.textContent = message;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (game.solved) return;

  const raw = input.value.trim();
  const guess = Number(raw);
  if (raw === "" || !isValidGuess(level, guess)) {
    showError(`Enter a whole number from 1 to ${level.size}.`);
    return;
  }

  showError("");
  const previousRange = game.range;
  game = submitGuess(game, guess);
  tween = createTween(previousRange, game.range, performance.now());
  impactStart = performance.now();
  input.value = "";
  updateStatus();
});

function resize(): void {
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function frame(now: number): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const layout = computeBoardLayout(width, height);
  const bounds = boardExtent(level);
  const liveRange = tweenRange(tween, now);
  const fraction = extentFraction(liveRange, bounds);
  const impactElapsed = now - impactStart;
  const impact = impactElapsed >= 0 && impactElapsed < IMPACT_DECAY_MS ? 1 - impactElapsed / IMPACT_DECAY_MS : 0;

  drawBackground(ctx, width, height);
  drawBoard(ctx, { layout, fraction, solved: game.solved, impact, reducedMotion: reducedMotion() });

  requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);
