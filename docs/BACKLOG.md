# Backlog

Epics are ordered so the wow moment (Epic 1, Story 1) is reachable first — everything else
builds on top of a bar that already splits and dims. Acceptance criteria are meant to be
verifiable true/false checks a later QA run can confirm without guesswork.

## Epic 1 — Core Split Mechanic

- [x] **Guess splits the bar and dims the losing half (WOW MOMENT)**
  - Submitting a guess against a hidden target instantly redraws the bar: the half that cannot
    contain the target visibly dims (opacity/desaturation change), the surviving half redraws
    to its new bounds, and no text on screen says "higher" or "lower."
  - This is reachable as the very first interaction after the page loads — no menu, no
    onboarding gate, in front of the player within one guess.
  - Repeating guesses narrows the visible range monotonically (the surviving sliver on guess N
    is always ⊆ the surviving sliver on guess N-1).

- [x] **Win detection on a correct guess**
  - Guessing the exact target collapses the range to a single highlighted cell and triggers a
    distinct win state (visually different from a normal narrowing step).
  - After a win, further guess submission is disabled (or routes to "next level") — the round
    cannot continue silently.

- [x] **Guess counter with optimal-guess indicator**
  - A live guess counter increments once per submitted guess and is visible throughout the
    round.
  - On win, the counter's final value is shown alongside the information-theoretic optimum
    (⌈log₂ N⌉ from `optimalGuessCount`) so the player can compare.

- [x] **Design polish: board matches DESIGN.md blueprint tokens**
  - The range bar, grid background, and cut-line color use the exact token values from
    `docs/DESIGN.md` (not ad hoc colors picked during implementation).
  - The board fills ≥60% of viewport height on a 1440×900 desktop layout per the layout intent.

## Epic 2 — Levels & Progression

- [x] **Level 1 — baseline range (1–100)**
  - A fresh game starts on a standard ascending range of 1–100 with no twist active.
  - Winning Level 1 unlocks/advances to Level 2 without a page reload.

- [x] **Level 2 — rotated range twist**
  - The range's values wrap partway through (rotated-sorted-array style) so guess narrowing
    must account for the rotation point rather than assuming pure ascending order.
  - A unit test on the level-2 narrowing logic covers at least one case where the naive
    ascending-order narrowing would pick the wrong half.

- [x] **Level 3 — range with duplicates**
  - The range contains repeated values such that a single guess does not always cleanly halve
    the search space.
  - A unit test confirms the narrowing logic never eliminates a region that could still contain
    the target when duplicates are present.

- [x] **Level select and progress persisted in localStorage**
  - Reloading the page after clearing a level resumes from the next unplayed level rather than
    restarting at Level 1.
  - A level-select screen lists all three levels and visually marks completed ones.

- [x] **Design polish: level-select and transitions match DESIGN.md**
  - Level-select UI uses the same tokens, type pairing, and corner-radius/glow language as the
    core board — no visual "seam" between menu and gameplay.
  - The transition between levels uses the 150ms UI-transition timing from `docs/DESIGN.md`,
    not an instant cut or a mismatched duration.

## Epic 3 — Feel & Feedback (juice)

- [x] **Tweened split/dim animation with impact feedback**
  - The surviving range's edges animate to new bounds over ~80–140ms ease-out (never an
    instant teleport) per `docs/DESIGN.md`.
  - The cut line flashes and the board gives a brief shake on guess submission, and both are
    skipped when `prefers-reduced-motion` is set while the range still updates correctly.

- [x] **Synth SFX suite with persisted mute toggle**
  - `tick`, `narrow`, `success`, and `error` sounds are synthesized via WebAudio
    (oscillator/noise, no audio files) and each fires on its corresponding game event.
  - A mute toggle silences all SFX, its state persists across reloads via `localStorage`, and
    the `AudioContext` is created lazily on first user gesture (no autoplay-policy warnings).

- [x] **Win celebration overlay with run stats**
  - Winning a level shows an overlay with guesses-taken vs. optimal, a particle/tick-mark burst
    (canvas or CSS, no image assets), and exactly one primary CTA ("Next level" / "Play again").
  - The overlay is keyboard-dismissable/actionable (the primary CTA is reachable and
    activatable via Tab + Enter).

- [x] **Design polish: juice motion and timing match the DESIGN.md plan**
  - Every listed juice element (tween, impact flash/shake, goal pulse, win burst, four SFX) is
    present and matches the timing ranges specified in `docs/DESIGN.md` section 5.
  - A manual pass with `prefers-reduced-motion` enabled confirms motion drops out but function
    (range narrowing, win detection) is unaffected.

## Epic 4 — Polish & Shell

- [x] **Responsive layout at 390/768/1440 with touch controls**
  - The page renders with no horizontal scroll and no overlapping elements at 390px, 768px,
    and 1440px viewport widths.
  - All interactive controls (guess input, level select, mute toggle) have touch targets
    ≥44px and are operable by tap on a touch-simulated viewport, not just mouse/keyboard.

- [x] **Accessibility: focus states, live status, and reduced motion**
  - Every interactive control has a visible focus-visible state and a sane Tab order.
  - Round status (guess count, win/lose state) is exposed via an `aria-live` region so a
    screen reader announces changes without the player having to poll the UI.

- [x] **Design polish: brand assets and final self-review**
  - A code-generated favicon (inline SVG, project accent + monogram) replaces the default
    globe icon, and the wordmark treatment from `docs/DESIGN.md` section 4 is implemented.
  - A full design self-review (per the design standard's D3 checklist) is completed and any
    fixes are folded back into this story before it's checked off.
