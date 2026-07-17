# Architecture

A concise map of the codebase for anyone (including a future session) picking this up cold.

## Run / test

```sh
npm install
npm run dev        # local dev server
npm test           # vitest run — unit tests only, no browser
npm run typecheck  # tsc -b --noEmit
npm run build      # tsc -b && vite build -> dist/
```

`vite.config.ts` sets `base: "./"` so `dist/` is deployable to a subpath
(`apps.charliekrug.com/bisect/`) with no server config.

## Module map

```
src/
  game/
    range.ts        # baseline (1-indexed value range) narrow/isSolved/optimalGuessCount
    rotated.ts       # Level 2: valueAt/indexOf map bar position <-> value under a rotation
                      # pivot; narrowRotated compares by position, not value order
    duplicates.ts     # Level 3: generateDuplicateValues + narrowDuplicates, which only
                      # strips indices provably outside the target's value
    levels.ts         # LevelConfig/GameState + createGame/submitGuess: dispatches to the
                      # right narrow* function per level and owns each level's hidden state
                      # (rotation pivot, duplicate-laden values array)
  render/
    layout.ts         # pure: viewport size -> board panel rect + orientation (breakpoint
                      # at 600px switches horizontal desktop bar <-> vertical phone stack)
    tween.ts          # pure: ease-out interpolation between two Ranges over time
    board.ts           # canvas drawing only (grid, track, dimmed halves, glowing survivor,
                      # cut-line flash) — takes layout + fraction + impact, draws, no state
  audio/
    sfx.ts             # Sfx class: lazy AudioContext, tick/narrow/success/error synths,
                      # mute state persisted via the same Storage-injection pattern as below
  storage/
    progress.ts        # loadProgress/saveProgress/markLevelComplete/nextUnplayedLevelId —
                      # Storage is injected (not hardcoded to window.localStorage) for tests
  main.ts              # wires everything: DOM shell, requestAnimationFrame loop, guess form,
                      # level-select overlay, win overlay, mute button
  style.css            # docs/DESIGN.md tokens as CSS custom properties + all component styles
```

## Data flow

1. `main.ts` picks the starting level via `nextUnplayedLevelId` against progress loaded from
   `localStorage`, then calls `createGame(level)` to get a `GameState` (hidden target/pivot/
   duplicate array + the starting `range`).
2. On guess submit: `isValidGuess` gates the input, `submitGuess` dispatches to
   `narrow` / `narrowRotated` / `narrowDuplicates` based on `level.id` and returns a new
   `GameState`. A `Tween` is created from the old range to the new one.
3. Each animation frame: `computeBoardLayout` + `extentFraction` turn the live tweened range
   into a pixel rect, `drawBoard` paints it. Impact intensity decays over `IMPACT_DECAY_MS`
   from the moment of the last guess, driving the cut-line flash and shake.
4. On win: progress is marked/persisted, `Sfx.success()` plays, and the win overlay shows
   guesses vs. `optimalGuessCount(level.size)`.

## Level domains (why `range` means different things per level)

`boardExtent(level)` returns each level's full extent in its own domain:

- **baseline** — `range` is a 1-indexed **value** range (`{lo: 1, hi: 100}`); `narrow()`
  compares the guessed value directly against the hidden target value.
- **rotated** / **duplicates** — `range` is a 0-indexed **bar-position** range. The player
  still types a value, but narrowing operates on where that value sits in the level's
  underlying array (`valueAt`/`indexOf` for rotated; the sorted `displayValues` array for
  duplicates), because value order no longer matches bar-position order once the range is
  rotated or has duplicate runs.

Rendering doesn't need to know which domain it's in — `extentFraction(range, boardExtent(level))`
always produces a 0..1 fraction of the panel regardless of domain.

## Testing approach

Game logic (`game/*`) and pure render math (`render/layout.ts`, `render/tween.ts`) are fully
unit tested, including boundary cases and a couple of seeded property-based fuzz tests
(`duplicates.test.ts`). `render/board.ts` (actual canvas drawing) and `main.ts` (DOM wiring) are
intentionally left to manual/visual verification — there's no meaningful pure logic to assert on
there beyond what the layout/tween tests already cover.
