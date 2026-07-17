# Vision

## The problem

Number-guessing games ("higher / lower") teach binary search in theory but not in feel. The
player reads two words per turn and updates a mental model that never gets externalized. The
game is *doing* binary search on their behalf while they watch text scroll by — the algorithm
stays invisible, and so does the intuition it's supposed to build.

## Who it's for

Programmers and CS students who already know binary search as an algorithm but have never felt
it as a physical narrowing of space — plus anyone who enjoys a tight, minimal puzzle mechanic
and doesn't need hand-holding text to stay oriented. No literacy or language dependency: the
entire feedback loop is visual, so it also works for a non-native-English audience.

## The core idea

Replace every text hint with a direct spatial transformation. The number range is drawn as a
single horizontal bar. Every guess is a cut through that bar: the half that can no longer
contain the target dims and locks out, and the surviving half redraws to fill the freed space.
There is no "too high," no "too low," no digit read-out during play — the player infers
direction entirely from *which side kept its color*. The mechanic is the visualization; there's
no separate "game" layered on top of a chart.

Because the visual *is* the algorithm, later levels can escalate by attacking the assumptions
binary search normally takes for granted, using the same bar:

- **Rotated range** — the bar's values wrap partway through (like a rotated sorted array), so
  "left half is smaller" is no longer reliably true and the player has to notice the wrap point.
- **Duplicates** — repeated values in the range mean a single guess doesn't always cut the
  space cleanly in half, forcing the player to reason about which side is *guaranteed* to be
  safe rather than which side merely looks smaller.

Both twists are real interview-style edge cases for binary search, taught the same way the
base game teaches the algorithm itself: by watching the bar behave, not by reading a rule.

## Key design decisions

- **Zero text hints, ever.** Not "minimal text" — zero. Guess counter, level name, and win
  stats are the only text on screen during play; nothing narrates direction.
- **The bar is the only feedback surface.** No side panel, no chart-plus-game split. Constraint
  forces the visualization to carry the entire experience, which is the point of the project.
- **Canvas, not DOM, for the bar.** Precise sub-pixel control over the dim/split animation and
  headroom for later particle/juice work without fighting CSS transitions.
- **Levels are algorithmic, not difficulty sliders.** Progression = new binary-search edge case,
  not "bigger number" or "less time." Keeps the game honest to its teaching goal.
- **No backend.** Fully static and client-side; ships as a single deployable directory with
  relative asset paths so it can be hosted at a subpath.

## What "v1 done" looks like

- The wow moment is real: a fresh player's first guess visibly splits and dims the bar with no
  numbers explaining what happened.
- Three levels are playable end to end: baseline range, rotated range, range with duplicates.
- Every guess gets tweened visual feedback, synthesized sound (mutable), and a win screen with
  run stats (guesses taken vs. the optimal count).
- The page is responsive from phone to desktop and matches the direction in `docs/DESIGN.md`.
- CI is green: typecheck, unit tests on the core range/level logic, and a production build.
