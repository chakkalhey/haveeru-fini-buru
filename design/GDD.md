# Scooter Rush — Game Design Document

## Overview

A 3-lane endless runner in the vein of Subway Surfers. The player rides a
Vespa-style scooter down a Maldivian coastal road at sunrise, dodging
obstacles and collecting floating coconuts that represent data (MB) instead
of coins.

- **Platform**: browser (desktop + mobile), no install, shared via a single link
- **Session length**: 30 seconds to a few minutes per run (endless, ends on crash)
- **Engine**: Three.js (WebGL), plain HTML/CSS/JS, no build step

## Player Fantasy

You're a local cruising the coast road on your scooter at first light —
weaving through traffic, ducking under signage, hopping crates, grabbing
data top-ups as you go. Low-stakes, breezy, a little silly (coconuts = MB).

## Visual Style

Warm, natural sunrise palette — no neon, no synthwave. Tone-mapped Three.js
scene with soft bloom reserved for the sun and the headlight only.

- **Sky**: gradient dome, blue at zenith fading through pale gold to coral
  at the horizon; warm directional "sunrise" key light; drifting cloud
  sprites; soft-glow sun low on the horizon.
- **Road**: three-lane asphalt strip with dashed white lane markers and
  solid edge lines, flanked by sandy shoulders.
- **Roadside**: procedurally built palm trees (leaning trunks, drooping
  frond crowns, coconut clusters) close to the road; small pastel
  two-story village buildings with window grids further back, replacing
  what would otherwise be open ocean.
- **Rider**: white-and-yellow Vespa-style scooter (rounded shield/fender,
  chrome mirrors, working headlight) ridden by a character in a printed
  tropical shirt, khaki shorts, and a white helmet with a dark visor.

## Core Mechanics

### Lanes
Three fixed lanes (`x = -1.8, 0, 1.8`). Left/Right input moves the target
lane by one; the scooter lerps toward it and leans into the turn.

### Jump
Clears **low** obstacles (knee-height barriers). Arc governed by
`JUMP_DURATION` / `JUMP_HEIGHT`. Cannot jump while sliding.

### Slide
Clears **high** obstacles (overhead bars). Player scales down and drops
slightly for `SLIDE_DURATION`. Cannot slide while jumping.

### Wall obstacles
Full-height, block a lane entirely — only escape is a lane change. Section
generation guarantees at least one lane is always clear.

### Collectibles — coconuts
Floating coconuts labeled with a value: **10 / 20 / 30 / 40 MB**. A colored
ring beneath each coconut color-codes its value at a glance (cyan / green
/ purple / gold) without relying on neon glow. Values are weighted so 10MB
is most common and 40MB is rare.

### Data Boost (40MB special)
The rare golden, sprouting coconut. On pickup: **2x score multiplier** and
a **20% speed bump** for `BOOST_DURATION` (8s), shown via a HUD progress bar.

### Difficulty ramp
Speed increases continuously with elapsed run time up to a cap
(`BASE_SPEED` + `SPEED_RAMP` × time, capped at `MAX_SPEED_BONUS`). Obstacle
density is constant per section, so higher speed alone raises difficulty.

### Scoring
Score accumulates continuously as `speed × scoreMultiplier`. MB collected
is tracked as a separate stat. Best score persists in `localStorage` and
is shown on the game-over screen.

### Failure
Colliding with an obstacle (without the right avoidance action active)
ends the run: crash animation, camera shake, game-over screen with score,
MB collected, and best score.

## Controls

| Input | Desktop | Mobile |
|---|---|---|
| Switch lane | Arrow Left/Right, A/D | Swipe left/right, on-screen buttons |
| Jump | Arrow Up, W, Space | Swipe up, on-screen button |
| Slide | Arrow Down, S | Swipe down, on-screen button |
| Start / Restart | Space / click | Tap |

On-screen buttons auto-show on touch devices (`pointer: coarse`); swipe
gestures work everywhere touch is available.

## Edge Cases & Invariants

- Section generator never blocks all 3 lanes at once — always at least one
  clear path.
- Jump and slide are mutually exclusive states.
- Speed is clamped to `BASE_SPEED + MAX_SPEED_BONUS` (× boost multiplier).
- Collision checks use world-space distance, not lane index, so a
  mid-lane-change player can still clip an obstacle if timed badly (by design).
- Resize is handled for camera aspect, renderer size, and the post-processing
  composer together.

## Tuning Knobs

`BASE_SPEED`, `MAX_SPEED_BONUS`, `SPEED_RAMP`, `JUMP_DURATION`,
`JUMP_HEIGHT`, `SLIDE_DURATION`, `SECTION_LENGTH`, `BOOST_DURATION`,
collectible value weights (55/30/15 for 10/20/30MB, 12% chance of a bonus
40MB per section).

## Acceptance Criteria

- Start screen, HUD, and game-over screen all functional with persisted
  best score.
- All three obstacle kinds are individually avoidable by the correct
  action (jump / slide / lane-change).
- All four collectible values are visually distinguishable at a glance.
- Playable end-to-end on both keyboard and touch input.
- Runs at a stable frame rate with the bloom post-process enabled.
