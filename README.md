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

## Planned features

- **Pure visual feedback** — no "higher/lower" text, ever. The bar and its dimming *is* the hint.
- **Escalating levels** — a clean range, then a rotated range, then a range with duplicates,
  each one encoding a real binary-search edge case.
- **Juice** — tweened splits, synth sound effects (WebAudio, no audio files), and a proper win
  celebration with run stats.
- **Guess-efficiency tracking** — see how close you got to the information-theoretic optimum
  (⌈log₂ N⌉ guesses).

## Stack

- TypeScript + HTML5 Canvas, bundled with [Vite](https://vitejs.dev/).
- No UI framework, no runtime dependencies — the game loop and rendering are hand-rolled.
- [Vitest](https://vitest.dev/) for unit tests on the game logic.
- Static output (`dist/`) — no server required, deployable to any static host or subpath.

## Status

Early scaffold. See [`docs/VISION.md`](docs/VISION.md) for the design and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## Development

```sh
npm install
npm run dev      # local dev server
npm test         # run the unit tests
npm run build    # production build to dist/
```

## License

MIT — see [`LICENSE`](LICENSE).
