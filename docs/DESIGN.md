# Design

## 1. Aesthetic direction

**Bisect is blueprint/technical**: the game board reads like a schematic diagram of the search
space — fine grid paper, cyan draft lines, a warm amber annotation color for the live cut,
monospace numerals stamped like measurements. The player isn't looking at a toy; they're
looking at a live diagram of an algorithm, which is exactly what the mechanic is.

This is deliberately distinct from a generic "dark cards + one accent" theme: the grid,
crosshair ticks, and annotation-style numerals are load-bearing, not decoration — they're what
makes the bar read as a *measurement* rather than a progress bar.

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a1628` | page background (deep blueprint navy) |
| `--surface-1` | `#0f2138` | panels, the range bar's track |
| `--surface-2` | `#16304f` | raised elements, active panel edges |
| `--text` | `#e8f1fb` | primary text |
| `--text-muted` | `#7f9db9` | secondary text, dimmed-range labels |
| `--accent` | `#4fd1ff` | live/surviving range, links, focus rings |
| `--accent-support` | `#ff8a4c` | the active cut line, guess marker |
| `--success` | `#4ade80` | win state, correct-guess pulse |
| `--danger` | `#ff5c5c` | invalid input, error state |

- **Display font:** [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) (600/700) —
  wordmark, headings, the numeric guess counter. Monospace reinforces the "measurement" feel.
- **UI font:** [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans) (400/500) — body
  copy, buttons, instructions. Same type family as the display font, different construction, so
  the pairing feels designed rather than mismatched.
- System fallback stack: `"IBM Plex Mono", ui-monospace, monospace` /
  `"IBM Plex Sans", system-ui, sans-serif`.
- **Spacing unit:** 8px scale (8/16/24/32/48/64).
- **Corner radius:** 2px — sharp, drafting-table precision, not soft/toy-like.
- **Depth:** thin 1px `--accent` hairlines at 15–25% opacity for the grid; a soft outer glow
  (`0 0 24px rgba(79, 209, 255, 0.25)`) on the live range and on focused controls, standing in
  for a shadow system in a dark, glow-driven UI.
- **Motion:** UI transitions 150ms ease-out; game feedback (split, dim, guess marker) 90ms
  ease-out; win celebration sequence up to 900ms total.

## 3. Layout intent

The **range bar is the hero** on every screen — it's the board, the diagram, and the only
feedback surface, per `docs/VISION.md`.

- **Desktop (1440×900):** the bar spans a centered column (max ~960px wide) and occupies the
  vertical middle ~65% of the viewport height. A thin header above holds the wordmark, level
  name, and mute toggle; a thin footer below holds the guess input and guess counter. Faint
  full-bleed grid lines run behind everything at low opacity so the board reads as sitting on
  drafting paper, not floating on flat black.
- **Phone (390×844):** the bar rotates to a vertical stack that fills the width and the top
  ~55% of viewport height; guess input becomes a large numeric keypad-style control beneath it,
  sized for thumbs (≥44px targets). Header collapses to a single row (wordmark + mute icon).
- No dead space: the grid background fills every edge; there is never a small fixed-size widget
  floating in an empty page.

## 4. Signature detail

The wordmark **"BISECT"** renders with the "I" replaced by a thin animated vertical divider —
on load (and idle, subtly looping) it sweeps a cyan-to-amber gradient down the glyph and the
two halves of the word give a 2px "flinch" apart and settle, foreshadowing the core mechanic
before the player has made a single guess.

## 5. Juice plan

- **Movement tween:** the surviving range's edges animate to their new bounds over 100ms
  ease-out; the eliminated half fades opacity to ~15% and desaturates over the same 100ms.
- **Impact feedback:** the cut line (accent-support) flashes and the board gives a 2px
  horizontal shake (~60ms) on every guess, scaled down/removed under `prefers-reduced-motion`.
- **Goal/success pop:** when the range collapses to one value, that cell pulses cyan → success
  green with a brief scale-up (1.0 → 1.15 → 1.0, 140ms).
- **Win celebration:** a stats overlay (guesses taken vs. optimal ⌈log₂ N⌉) with a burst of
  thin blueprint-style tick marks radiating from the winning point (CSS/canvas particles, no
  images) and one clear CTA: "Next level" / "Play again."
- **Synth SFX (WebAudio, generated in code — no audio files):**
  - `tick` — short 880Hz sine blip (~30ms) on every guess submit.
  - `narrow` — filtered noise burst (~80ms, lowpass sweep) on the split animation, giving the
    cut a "whoosh" without a sample.
  - `success` — two-note ascending sine chime (~200ms) on level win.
  - `error` — short low buzz (~120ms, square wave) on invalid input (out-of-range guess).
  - Mute toggle in the header persists to `localStorage`; `AudioContext` is created lazily on
    the first user gesture and all calls are guarded for environments without WebAudio.
- Respect `prefers-reduced-motion`: keep the split's functional state change instant/near-instant,
  drop the shake and particle burst, keep color/opacity change as the (non-motion) feedback.
