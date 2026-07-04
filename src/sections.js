import { SPAWN_Z, SECTION_LENGTH } from './constants.js';
import { randInt, shuffle } from './utils.js';
import { placeObstacle } from './obstacles.js';
import { placeCollectible, weightedCollectibleValue } from './collectibles.js';

function randomKind() {
  const kinds = ['low', 'high', 'wall'];
  return kinds[randInt(0, 2)];
}

function spawnCollectibleRun(scene, laneIdx, zStart) {
  const count = 3 + randInt(0, 3);
  const value = weightedCollectibleValue();
  for (let i = 0; i < count; i++) {
    placeCollectible(scene, laneIdx, value, zStart - i * 1.6);
  }
}

function spawnSection(scene) {
  const z = SPAWN_Z;
  const blockedLanes = new Set();
  const pattern = Math.random();

  if (pattern < 0.5) {
    const lane = randInt(0, 2);
    blockedLanes.add(lane);
    placeObstacle(scene, lane, randomKind(), z);
  } else if (pattern < 0.82) {
    const lanes = shuffle([0, 1, 2]);
    const blocked = lanes.slice(0, 2);
    blocked.forEach((l) => {
      blockedLanes.add(l);
      placeObstacle(scene, l, 'wall', z);
    });
  }

  const freeLanes = [0, 1, 2].filter((l) => !blockedLanes.has(l));
  freeLanes.forEach((l) => {
    if (Math.random() < 0.75) spawnCollectibleRun(scene, l, z);
  });

  if (Math.random() < 0.12 && freeLanes.length > 0) {
    const l = freeLanes[randInt(0, freeLanes.length - 1)];
    placeCollectible(scene, l, 40, z - 8);
  }
}

export function maybeSpawnSection(scene, dt, speed, state) {
  state.distanceSinceSection += speed * dt;
  if (state.distanceSinceSection >= SECTION_LENGTH) {
    state.distanceSinceSection = 0;
    spawnSection(scene);
  }
}
