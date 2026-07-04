import * as THREE from 'three';

export function updateCameraFollow(camera, player, dt, state) {
  state.cameraBaseX = THREE.MathUtils.lerp(state.cameraBaseX, player.position.x * 0.5, dt * 5);
  state.cameraBaseY = state.sliding ? 4.7 : 5.0;
  camera.position.x = state.cameraBaseX;
  camera.position.y = state.cameraBaseY;
  camera.position.z = 9.5;
  camera.lookAt(player.position.x * 0.3, 1.4, -14);
}

export function updateShake(camera, dt, state) {
  if (state.shakeTime > 0) {
    state.shakeTime -= dt;
    camera.position.x += (Math.random() - 0.5) * state.shakeStrength;
    camera.position.y += (Math.random() - 0.5) * state.shakeStrength;
  }
}

export function updateCrashAnim(player, camera, dt, state) {
  player.rotation.x = THREE.MathUtils.lerp(player.rotation.x, 1.3, dt * 4);
  player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, 0.6, dt * 4);
  updateShake(camera, dt, state);
}

export function triggerShake(state, strength, duration) {
  state.shakeStrength = strength;
  state.shakeTime = duration;
}
