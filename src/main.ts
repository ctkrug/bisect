import "./style.css";
import { LEVELS, boardExtent, createGame, isValidGuess, submitGuess, type GameState, type LevelConfig } from "./game/levels";
import { optimalGuessCount } from "./game/range";
import { computeBoardLayout, extentFraction } from "./render/layout";
import { drawBackground, drawBoard } from "./render/board";
import { createTween, tweenRange, type Tween } from "./render/tween";
import { loadProgress, markLevelComplete, nextUnplayedLevelId, saveProgress, type Progress } from "./storage/progress";
import { Sfx } from "./audio/sfx";

const IMPACT_DECAY_MS = 90;

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("missing #app root element");
}

app.innerHTML = `
  <canvas id="board" aria-hidden="true"></canvas>
  <header class="hud hud--top">
    <span class="wordmark">BISECT</span>
    <div class="hud-controls">
      <span id="level-name" class="level-name"></span>
      <button type="button" id="mute-btn" class="icon-btn" aria-pressed="false">Sound: On</button>
      <button type="button" id="levels-btn" class="icon-btn" aria-label="Choose a level">Levels</button>
    </div>
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
  <section id="level-select" class="level-select" hidden>
    <h1 class="level-select__title">Choose a level</h1>
    <div id="level-list" class="level-list"></div>
  </section>
  <section id="win-overlay" class="win-overlay" hidden>
    <div class="win-card">
      <div id="win-burst" class="win-burst" aria-hidden="true"></div>
      <p class="win-card__eyebrow">Solved</p>
      <p class="win-card__stats">
        <span id="win-guesses" class="win-card__stat"></span> guesses
        <span class="win-card__optimal">· optimal was <span id="win-optimal"></span></span>
      </p>
      <button type="button" id="win-cta" class="guess-submit win-cta"></button>
    </div>
  </section>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#board")!;
const ctx = canvas.getContext("2d")!;
const statusEl = document.querySelector<HTMLElement>("#status")!;
const levelNameEl = document.querySelector<HTMLElement>("#level-name")!;
const form = document.querySelector<HTMLFormElement>("#guess-form")!;
const input = document.querySelector<HTMLInputElement>("#guess-input")!;
const errorEl = document.querySelector<HTMLElement>("#error")!;
const levelsBtn = document.querySelector<HTMLButtonElement>("#levels-btn")!;
const muteBtn = document.querySelector<HTMLButtonElement>("#mute-btn")!;
const selectScreen = document.querySelector<HTMLElement>("#level-select")!;
const levelListEl = document.querySelector<HTMLElement>("#level-list")!;
const winOverlay = document.querySelector<HTMLElement>("#win-overlay")!;
const winBurstEl = document.querySelector<HTMLElement>("#win-burst")!;
const winGuessesEl = document.querySelector<HTMLElement>("#win-guesses")!;
const winOptimalEl = document.querySelector<HTMLElement>("#win-optimal")!;
const winCtaBtn = document.querySelector<HTMLButtonElement>("#win-cta")!;

const sfx = new Sfx(window.localStorage);
let progress: Progress = loadProgress(window.localStorage);
let view: "play" | "select" | "won" = "play";
let level: LevelConfig = LEVELS.find((l) => l.id === nextUnplayedLevelId(LEVELS.map((l) => l.id), progress)) ?? LEVELS[0];
let game: GameState = createGame(level);
let tween: Tween = createTween(game.range, game.range, performance.now(), 0);
let impactStart = -Infinity;

function updateMuteButton(): void {
  muteBtn.textContent = sfx.isMuted ? "Sound: Off" : "Sound: On";
  muteBtn.setAttribute("aria-pressed", String(sfx.isMuted));
}
updateMuteButton();

muteBtn.addEventListener("click", () => {
  sfx.toggleMute();
  updateMuteButton();
});

function reducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function updateStatus(): void {
  statusEl.textContent = game.solved ? `Solved in ${game.guesses} guesses.` : `Guesses: ${game.guesses}`;
}

function showError(message: string): void {
  errorEl.textContent = message;
}

function startLevel(next: LevelConfig): void {
  level = next;
  game = createGame(level);
  tween = createTween(game.range, game.range, performance.now(), 0);
  impactStart = -Infinity;
  levelNameEl.textContent = level.name;
  input.min = "1";
  input.max = String(level.size);
  input.value = "";
  showError("");
  updateStatus();
}

function renderLevelList(): void {
  levelListEl.innerHTML = "";
  for (const l of LEVELS) {
    const completed = progress.completedLevelIds.includes(l.id);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "level-card" + (completed ? " level-card--done" : "");
    card.innerHTML = `
      <span class="level-card__name">${l.name}</span>
      <span class="level-card__status">${completed ? "✓ Complete" : "Play"}</span>
    `;
    card.addEventListener("click", () => {
      startLevel(l);
      setView("play");
    });
    levelListEl.appendChild(card);
  }
}

function setView(next: "play" | "select" | "won"): void {
  view = next;
  selectScreen.hidden = view !== "select";
  winOverlay.hidden = view !== "won";
  canvas.style.visibility = view === "play" ? "visible" : "hidden";
  if (view === "select") renderLevelList();
}

levelsBtn.addEventListener("click", () => setView(view === "select" ? "play" : "select"));

const BURST_TICKS = 8;

function fireWinBurst(): void {
  winBurstEl.innerHTML = "";
  for (let i = 0; i < BURST_TICKS; i++) {
    const tick = document.createElement("span");
    tick.className = "win-burst__tick";
    tick.style.setProperty("--r", `${(360 / BURST_TICKS) * i}deg`);
    winBurstEl.appendChild(tick);
  }
}

function showWinOverlay(): void {
  const nextId = nextUnplayedLevelId(
    LEVELS.map((l) => l.id),
    progress,
  );
  const hasNext = nextId !== level.id;
  winGuessesEl.textContent = String(game.guesses);
  winOptimalEl.textContent = String(optimalGuessCount(level.size));
  winCtaBtn.textContent = hasNext ? "Next level" : "Play again";
  fireWinBurst();
  setView("won");
  winCtaBtn.focus();
}

winCtaBtn.addEventListener("click", () => {
  const nextId = nextUnplayedLevelId(
    LEVELS.map((l) => l.id),
    progress,
  );
  const next = LEVELS.find((l) => l.id === nextId) ?? level;
  startLevel(next);
  setView("play");
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && view === "won") {
    setView("play");
  }
});

startLevel(level);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (game.solved) return;

  const raw = input.value.trim();
  const guess = Number(raw);
  if (raw === "" || !isValidGuess(level, guess)) {
    showError(`Enter a whole number from 1 to ${level.size}.`);
    sfx.error();
    return;
  }

  showError("");
  const previousRange = game.range;
  const wasSolved = game.solved;
  game = submitGuess(game, guess);
  tween = createTween(previousRange, game.range, performance.now());
  impactStart = performance.now();
  input.value = "";
  updateStatus();
  sfx.tick();
  sfx.narrow();

  if (game.solved && !wasSolved) {
    progress = markLevelComplete(progress, level.id);
    saveProgress(window.localStorage, progress);
    sfx.success();
    showWinOverlay();
  }
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
  if (view === "play") {
    drawBoard(ctx, { layout, fraction, solved: game.solved, impact, reducedMotion: reducedMotion() });
  }

  requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);
