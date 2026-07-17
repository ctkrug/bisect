---
title: "Bisect: teaching binary search with a bar instead of words"
published: false
tags: javascript, typescript, gamedev, webdev
---

Every "higher or lower" number-guessing game claims to teach binary search. None of them do. You
type a number, you read two words, and the computer quietly runs the algorithm on your behalf while
you watch text scroll by. The search stays invisible, and so does the intuition it is supposed to
build.

So I built [Bisect](https://apps.charliekrug.com/bisect/): a number-guessing game with zero text
hints. The range you are searching is a bar on screen. Every guess is a cut through that bar. The
half that cannot hold the target dims out, and the surviving half redraws to fill the space. There
is no "too high," no "too low." You read direction entirely from which side kept its color. By the
fourth guess most people stop doing arithmetic and start halving the range on instinct, which is the
whole point.

## Decision one: the range means different things per level

The base game is easy. The interesting part is the two twist levels, which are real binary-search
interview variants: a rotated range and a range with duplicates.

The trap is trying to make one narrowing function handle all three. It cannot, because the *meaning*
of the surviving range changes per level. In the baseline level the range is a range of **values**:
guess 50 against a target of 30, and everything from 50 up is gone. But in the rotated level the
values wrap partway along the bar, so ascending value order no longer matches left-to-right screen
position. Narrowing by value would dim the wrong half.

The fix was to let each level own its domain. The baseline narrows by value; the rotated and
duplicate levels narrow by **bar position** (index), mapping the guessed value to where it sits on
the bar first. Rendering never needs to know the difference, because a small `extentFraction`
function turns whatever the range means into a plain 0-to-1 fraction of the bar. One drawing path,
three very different games underneath.

## Decision two: a bug that made Level 3 unwinnable

A scripted playthrough during the build caught something a human tester might have called "bad
luck." Level 3 could get **permanently stuck**. Once the surviving range narrows to a run of cells
that all share the same value, every further value guess is either "equal" (no new information) or
lands on the wrong side of a value that is no longer in the range. The player is trapped with no
move that makes progress.

Value comparison alone cannot break a tie between identical values. So the bar became clickable.
Tapping a position picks a **cell** directly, and a position pick is always informative: it can
never strip the target's own index, and it always narrows when the pick is wrong. Typing is still
the primary interaction, but for duplicates the tap is the escape hatch, and it falls back to being
equivalent to typing the value at that position for the other levels.

The lesson I keep relearning: a scripted playthrough finds the states a designer would never think
to try, and "the player is softlocked" is the kind of bug that only shows up when something plays
thousands of games in a row.

## Decision three: no binary assets, for anything

Bisect ships as a single static directory with no image or audio files. The favicon is an inline
SVG data URI. The win celebration is CSS tick-marks. Every sound is synthesized in code with the
WebAudio API: the guess blip is a 30ms sine, the split is a lowpass-swept noise burst, the win is a
two-note chime. That keeps the whole thing tiny and deployable to any subpath, and it meant the
sound design lived in the same TypeScript as everything else instead of in a folder of `.wav` files
I would have to license and load.

## What I would do differently

The narrowing logic sits at 100% test coverage, but the canvas drawing and the DOM wiring do not,
because there is not much pure logic to assert on there. If I did it again I would reach for a real
headless-browser test harness from day one rather than bolting scripted playthroughs on later. The
softlock bug would have been a failing test instead of a lucky catch.

Play it here: [apps.charliekrug.com/bisect](https://apps.charliekrug.com/bisect/)

Code (TypeScript, MIT): [github.com/ctkrug/bisect](https://github.com/ctkrug/bisect)
