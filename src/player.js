import * as THREE from 'three';
import { LANES, JUMP_DURATION, JUMP_HEIGHT, SLIDE_DURATION } from './constants.js';

function makeShirtTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ff5a4e';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#2f9e5a';
  [[10, 12], [46, 14], [26, 40], [54, 48], [8, 50]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.ellipse(x, y, 9, 4, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#ffe37a';
  [[18, 26], [40, 30], [30, 6], [56, 20]].forEach(([x, y]) => {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 3, 2, a, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function createPlayer() {
  const model = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.6 });
  const shortsMat = new THREE.MeshStandardMaterial({ color: 0xe8dcb8, roughness: 0.7 });
  const shirtMat = new THREE.MeshStandardMaterial({ map: makeShirtTexture(), roughness: 0.65 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.35, metalness: 0.15 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.2, metalness: 0.3 });
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.35, metalness: 0.15 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xffd23f, roughness: 0.4, metalness: 0.2 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x2a2320, roughness: 0.6 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.25, metalness: 0.8 });
  const headlightMat = new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff6d8, emissiveIntensity: 1.3 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0d15, roughness: 0.6 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xffd23f, roughness: 0.35, metalness: 0.4 });

  const footboard = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.75), bodyMat);
  footboard.position.set(0, 0.32, 0.05);

  const frontShield = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 12), bodyMat);
  frontShield.scale.set(1, 1.35, 0.5);
  frontShield.position.set(0, 0.95, 0.58);

  const shieldStripe = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.09, 0.15), accentMat);
  shieldStripe.position.set(0, 0.85, 0.78);

  const rearHump = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 12), bodyMat);
  rearHump.scale.set(1, 1.0, 0.85);
  rearHump.position.set(0, 0.55, -0.55);

  const rearStripe = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.1), accentMat);
  rearStripe.position.set(0, 0.5, -0.78);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.46), seatMat);
  seat.position.set(0, 0.63, -0.12);

  const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), headlightMat);
  headlight.position.set(0, 1.05, 0.82);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 8), bodyMat);
  pole.position.set(0, 1.2, 0.62);

  const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.05, 0.05), bodyMat);
  handlebar.position.set(0, 1.42, 0.62);

  const gripGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.1, 8);
  const leftGrip = new THREE.Mesh(gripGeo, accentMat);
  leftGrip.rotation.z = Math.PI / 2;
  leftGrip.position.set(-0.29, 1.42, 0.62);
  const rightGrip = leftGrip.clone();
  rightGrip.position.x = 0.29;

  const mirrorStemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6);
  const leftMirrorStem = new THREE.Mesh(mirrorStemGeo, chromeMat);
  leftMirrorStem.position.set(-0.24, 1.55, 0.62);
  leftMirrorStem.rotation.z = 0.5;
  const leftMirror = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), chromeMat);
  leftMirror.position.set(-0.34, 1.63, 0.62);
  const rightMirrorStem = leftMirrorStem.clone();
  rightMirrorStem.position.x = 0.24;
  rightMirrorStem.rotation.z = -0.5;
  const rightMirror = leftMirror.clone();
  rightMirror.position.x = 0.34;

  const wheelGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.07, 16);
  const rimGeo = new THREE.TorusGeometry(0.13, 0.02, 8, 16);

  const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
  frontWheel.rotation.z = Math.PI / 2;
  frontWheel.position.set(0, 0.19, 0.55);
  const frontRim = new THREE.Mesh(rimGeo, rimMat);
  frontRim.rotation.y = Math.PI / 2;
  frontWheel.add(frontRim);

  const rearWheel = frontWheel.clone();
  rearWheel.position.set(0, 0.19, -0.42);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.28), shirtMat);
  torso.position.set(0, 1.08, 0.1);
  torso.rotation.x = -0.15;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), helmetMat);
  head.position.set(0, 1.58, 0.04);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 0.06), visorMat);
  visor.position.set(0, 1.57, 0.18);

  const armGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.48, 8);
  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(-0.28, 1.18, 0.3);
  leftArm.rotation.x = -0.7;
  const rightArm = leftArm.clone();
  rightArm.position.x = 0.28;

  const legGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.48, 8);
  const leftLeg = new THREE.Mesh(legGeo, skinMat);
  leftLeg.position.set(-0.12, 0.55, -0.02);
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.12;

  const shortsGeo = new THREE.BoxGeometry(0.17, 0.16, 0.24);
  const leftShorts = new THREE.Mesh(shortsGeo, shortsMat);
  leftShorts.position.set(-0.12, 0.8, -0.02);
  const rightShorts = leftShorts.clone();
  rightShorts.position.x = 0.12;

  model.add(
    footboard, frontShield, shieldStripe, rearHump, rearStripe, seat, headlight,
    pole, handlebar, leftGrip, rightGrip, leftMirrorStem, leftMirror, rightMirrorStem, rightMirror,
    frontWheel, rearWheel,
    torso, head, visor, leftArm, rightArm, leftLeg, rightLeg, leftShorts, rightShorts
  );

  model.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
    }
  });

  // The model was built facing +Z; the world scrolls toward the camera along
  // +Z, so the rider needs to face -Z. Rotate the inner model, not the outer
  // group, so gameplay transforms (lean/crash tilt) stay untouched.
  model.rotation.y = Math.PI;

  const group = new THREE.Group();
  group.add(model);
  group.userData.wheels = [frontWheel, rearWheel];
  group.userData.legs = [leftLeg, rightLeg];
  group.userData.arms = [leftArm, rightArm];

  return group;
}

export function updatePlayer(player, dt, state, speed) {
  const targetX = LANES[state.laneIndex];
  const prevX = player.position.x;
  player.position.x = THREE.MathUtils.lerp(player.position.x, targetX, Math.min(1, dt * 12));
  const lateral = (player.position.x - prevX) / Math.max(dt, 0.0001);
  const targetTilt = THREE.MathUtils.clamp(-lateral * 0.05, -0.35, 0.35);
  player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, targetTilt, dt * 10);

  let baseY = 0;
  if (state.jumping) {
    state.jumpT += dt;
    const p = Math.min(state.jumpT / JUMP_DURATION, 1);
    baseY = Math.sin(p * Math.PI) * JUMP_HEIGHT;
    if (p >= 1) {
      state.jumping = false;
      baseY = 0;
    }
  }

  let scaleY = 1;
  let slideOffset = 0;
  if (state.sliding) {
    state.slideT += dt;
    scaleY = 0.55;
    slideOffset = -0.15;
    if (state.slideT >= SLIDE_DURATION) {
      state.sliding = false;
    }
  }
  player.scale.y = THREE.MathUtils.lerp(player.scale.y, scaleY, dt * 14);

  const bob = state.jumping ? 0 : Math.abs(Math.sin(state.runCycle * 2)) * 0.018;
  player.position.y = baseY + slideOffset + bob;

  state.runCycle += dt * speed * 1.1;
  player.userData.wheels.forEach((w) => {
    w.rotation.x += dt * speed * 3;
  });
  const swing = Math.sin(state.runCycle) * 0.5;
  player.userData.legs[0].rotation.x = swing;
  player.userData.legs[1].rotation.x = -swing;
  player.userData.arms[0].rotation.x = -0.7 + swing * 0.3;
  player.userData.arms[1].rotation.x = -0.7 - swing * 0.3;
}
