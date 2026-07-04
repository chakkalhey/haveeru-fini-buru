# Architecture

Plain ES modules loaded directly by the browser via an import map (no
bundler, no build step — `index.html` still just opens and runs). The
previous implementation was a single ~1300-line `game.js`; this splits it
by responsibility so each file can be read and changed in isolation.

```
index.html
style.css
src/
  constants.js    tunable numbers, COLLECTIBLE_CONFIG, storage keys
  state.js        one shared mutable game-state object
  sceneSetup.js   renderer/scene/camera/composer creation + resize
  world.js        sky dome, sun, clouds, road/ground, palm trees, buildings
  player.js       scooter+rider mesh, per-frame movement/animation
  camera.js       camera follow, crash shake, crash tilt
  obstacles.js    obstacle meshes, pool, per-frame update
  collectibles.js coconut meshes, pool, per-frame update
  sections.js     procedural spawn pattern tying obstacles+collectibles
  effects.js      particle bursts, floating text sprites
  input.js        keyboard / swipe / on-screen button wiring
  ui.js           DOM refs, HUD + screen updates
  game.js         entry point: wires everything, collisions, game flow, loop
```

## Data flow

`game.js` is the only module that knows about *all* the others. It:

1. Calls `initScene()` to get `{ scene, camera, renderer, composer }`.
2. Calls `initWorld(scene)` and `createPlayer()` to populate the scene.
3. Wires `input.js` callbacks (`changeLane`, `jump`, `slide`) to the shared
   `state` object.
4. Runs the `requestAnimationFrame` loop: advance `state`, call each
   module's `update(dt, state)`, run collision checks, update the HUD,
   render via the composer.

Modules never reach into each other directly — everything that crosses a
module boundary goes through the shared `state` object (`state.js`) or is
passed explicitly as a function argument (e.g. `updateObstacles(dt, speed)`).
This keeps `obstacles.js` / `collectibles.js` / `player.js` independently
testable in isolation and easy to reskin without touching game flow.

## Why this split

- **constants vs state**: constants are load-time config; `state` is the
  mutable per-run data (score, lane index, jump/slide flags, boost timer).
  Resetting a run is just re-initializing `state`, not re-importing modules.
- **world vs player vs camera**: these were previously interleaved in one
  file. Splitting them means the environment (palm trees, buildings, road)
  can be reskinned without touching rider or camera logic, which is exactly
  the kind of change this project has gone through repeatedly (sunrise →
  retro → sunrise again).
- **obstacles/collectibles/sections**: `sections.js` is the only place that
  decides *where* things spawn and guarantees a lane is always clear;
  `obstacles.js`/`collectibles.js` only know how to build and animate one
  instance. This keeps the fairness guarantee (never block all 3 lanes) in
  a single, auditable place.
- **effects is generic**: particle bursts and floating text sprites are
  used by collectibles today but aren't collectible-specific, so they live
  independently.
