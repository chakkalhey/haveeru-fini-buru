import { BASE_SPEED } from './constants.js';

export const state = {
  laneIndex: 1,
  speed: BASE_SPEED,
  elapsed: 0,
  scoreAccum: 0,
  mbTotal: 0,
  scoreMultiplier: 1,
  runCycle: 0,
  distanceSinceSection: 0,

  running: false,
  crashed: false,
  jumping: false,
  sliding: false,
  jumpT: 0,
  slideT: 0,
  boostActive: false,
  boostT: 0,

  shakeTime: 0,
  shakeStrength: 0,
  cameraBaseX: 0,
  cameraBaseY: 5.0,
};
