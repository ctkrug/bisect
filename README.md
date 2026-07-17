# Bisect

A number-guessing game with **zero text hints**. Every guess splits a bar in half and dims
the losing side — you learn binary-search intuition by *watching the surviving sliver shrink*,
not by reading "too high" / "too low."

## Why

Most guessing games tell you the answer in words. Bisect shows it to you instead: the range
you're searching is a literal bar on screen, and each guess is a cut through it. By your fourth
guess you're not parsing text anymore — you're watching a search space collapse, which is
exactly what binary search *is*. Later levels riff on real interview-style edge cases (a
rotated range, duplicate values) so the visual metaphor keeps teaching as the challenge grows.

## The wow moment

Your first guess splits the bar and one half dims out instantly. No numbers telling you what
happened — just the range visibly shrinking. Four guesses in, it clicks: you're doing binary
search with your eyes.

## Features

- **Pure visual feedback** — no "higher/lower" text, ever. The bar and its dimming *is* the hint.
- **Three levels** — a clean range, a rotated range, and a range with duplicates, each one
  encoding a real binary-search edge case. Progress persists in `localStorage` and a level-select
  screen (reachable from the header, never blocking the first guess) tracks what's complete.
- **Juice** — tweened splits, an impact flash/shake on every guess, synthesized WebAudio SFX
  (tick / narrow / success / error, no audio files) with a persisted mute toggle, and a win
  celebration overlay with a tick-mark burst and run stats.
- **Guess-efficiency tracking** — the win overlay shows guesses taken vs. the
  information-theoretic optimum (⌈log₂ N⌉).

## Stack

- TypeScript + HTML5 Canvas, bundled with [Vite](https://vitejs.dev/).
- No UI framework, no runtime dependencies — the game loop and rendering are hand-rolled.
- [Vitest](https://vitest.dev/) for unit tests on the game logic.
- Static output (`dist/`) — no server required, deployable to any static host or subpath.

## Status

Core gameplay is complete and playable end to end: all three levels, the split/dim board with
tweened feedback and synth SFX, level select with persisted progress, and a win celebration.
See [`docs/VISION.md`](docs/VISION.md) for the design, [`docs/DESIGN.md`](docs/DESIGN.md) for
the visual direction, [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the code is laid
out, and [`docs/BACKLOG.md`](docs/BACKLOG.md) for what's left.

## Development

```sh
npm install
npm run dev      # local dev server
npm test         # run the unit tests
npm run build    # production build to dist/
```

## License

MIT — see [`LICENSE`](LICENSE).
