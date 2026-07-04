import * as THREE from 'three';
import { BASE_SPEED, MAX_SPEED_BONUS, SPEED_RAMP, BOOST_DURATION, HIGH_SCORE_KEY } from './constants.js';
import { state } from './state.js';
import { initScene } from './sceneSetup.js';
import { initWorld, updateWorld } from './world.js';
import { createPlayer, updatePlayer } from './player.js';
import { updateCameraFollow, updateCrashAnim, triggerShake } from './camera.js';
import { obstacles, updateObstacles, clearObstacles } from './obstacles.js';
import { collectibles, updateCollectibles, clearCollectibles } from './collectibles.js';
import { maybeSpawnSection } from './sections.js';
import { spawnBurst, updateBursts, clearBursts } from './effects.js';
import { initInput } from './input.js';
import * as ui from './ui.js';

const { scene, camera, composer } = initScene(ui.dom.container);
const world = initWorld(scene);
const player = createPlayer();
scene.add(player);

/* ---------------------------------------------------------------- */
/* controls                                                           */
/* ---------------------------------------------------------------- */

function changeLane(dir) {
  state.laneIndex = Math.min(2, Math.max(0, state.laneIndex + dir));
}

function jump() {
  if (!state.jumping && !state.sliding) {
    state.jumping = true;
    state.jumpT = 0;
  }
}

function slide() {
  if (!state.sliding && !state.jumping) {
    state.sliding = true;
    state.slideT = 0;
  }
}

/* ---------------------------------------------------------------- */
/* game flow                                                          */
/* ---------------------------------------------------------------- */

function resetGame() {
  clearObstacles(scene);
  clearCollectibles(scene);
  clearBursts(scene);

  Object.assign(state, {
    laneIndex: 1,
    speed: BASE_SPEED,
    elapsed: 0,
    scoreAccum: 0,
    mbTotal: 0,
    scoreMultiplier: 1,
    runCycle: 0,
    distanceSinceSection: 0,
    crashed: false,
    jumping: false,
    sliding: false,
    jumpT: 0,
    slideT: 0,
    boostActive: false,
    boostT: 0,
  });

  player.position.set(0, 0, 0);
  player.rotation.set(0, 0, 0);
  player.scale.set(1, 1, 1);
  ui.hideBoostBar();
}

function startGame() {
  resetGame();
  ui.hideStartScreen();
  ui.hideGameOverScreen();
  ui.showHUD();
  state.running = true;
}

function crash() {
  if (state.crashed) return;
  state.crashed = true;
  triggerShake(state, 0.18, 0.45);

  const finalScore = Math.floor(state.scoreAccum);
  const best = Math.max(finalScore, parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10));
  localStorage.setItem(HIGH_SCORE_KEY, String(best));

  setTimeout(() => {
    ui.showGameOverStats(finalScore, state.mbTotal, best);
    ui.hideHUD();
    ui.showGameOverScreen();
    state.running = false;
  }, 550);
}

function collectItem(mesh) {
  state.mbTotal += mesh.userData.value;
  const worldPos = new THREE.Vector3();
  mesh.userData.coconutMesh.getWorldPosition(worldPos);
  spawnBurst(scene, worldPos, mesh.userData.color);
  if (mesh.userData.special) {
    state.boostActive = true;
    state.boostT = BOOST_DURATION;
    state.scoreMultiplier = 2;
    ui.showBoostBar();
  }
}

/* ---------------------------------------------------------------- */
/* collisions                                                         */
/* ---------------------------------------------------------------- */

function checkCollisions() {
  if (state.crashed) return;

  for (const o of obstacles) {
    if (Math.abs(o.position.z) < 0.55 && Math.abs(player.position.x - o.position.x) < 0.85) {
      const kind = o.userData.kind;
      let hit = true;
      if (kind === 'low' && player.position.y > 0.75) hit = false;
      if (kind === 'high' && state.sliding) hit = false;
      if (hit) {
        crash();
        return;
      }
    }
  }

  for (let i = collectibles.length - 1; i >= 0; i--) {
    const c = collectibles[i];
    if (Math.abs(c.position.z) < 0.7 && Math.abs(player.position.x - c.position.x) < 0.75) {
      collectItem(c);
      scene.remove(c);
      collectibles.splice(i, 1);
    }
  }
}

function updateBoost(dt) {
  if (!state.boostActive) return;
  state.boostT -= dt;
  ui.setBoostFill(Math.max(0, (state.boostT / BOOST_DURATION) * 100));
  if (state.boostT <= 0) {
    state.boostActive = false;
    state.scoreMultiplier = 1;
    ui.hideBoostBar();
  }
}

/* ---------------------------------------------------------------- */
/* input wiring                                                       */
/* ---------------------------------------------------------------- */

initInput({
  onStart: startGame,
  onLaneChange: changeLane,
  onJump: jump,
  onSlide: slide,
  isRunning: () => state.running,
  isCrashed: () => state.crashed,
});

/* ---------------------------------------------------------------- */
/* main loop                                                          */
/* ---------------------------------------------------------------- */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (state.running && !state.crashed) {
    state.elapsed += dt;
    const boostSpeedMul = state.boostActive ? 1.2 : 1;
    state.speed = (BASE_SPEED + Math.min(state.elapsed * SPEED_RAMP, MAX_SPEED_BONUS)) * boostSpeedMul;

    state.scoreAccum += state.speed * dt * state.scoreMultiplier;

    updatePlayer(player, dt, state, state.speed);
    updateObstacles(scene, dt, state.speed);
    updateCollectibles(scene, dt, state.speed, state.elapsed);
    updateWorld(world, dt, state.speed);
    maybeSpawnSection(scene, dt, state.speed, state);
    checkCollisions();
    updateBursts(scene, dt, state.speed);
    updateBoost(dt);
    updateCameraFollow(camera, player, dt, state);
    ui.updateHUD(state.scoreAccum, state.mbTotal);
  } else if (state.crashed) {
    updateCrashAnim(player, camera, dt, state);
    updateBursts(scene, dt, state.speed);
  }

  composer.render();
}

animate();
