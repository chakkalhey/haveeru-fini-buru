import * as THREE from 'three';
import { LANES, REMOVE_Z, COLLECTIBLE_CONFIG } from './constants.js';
import { makeTextSprite } from './effects.js';

function makeCoconutTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 120; i++) {
    ctx.strokeStyle = `rgba(40,24,12,${0.2 + Math.random() * 0.3})`;
    ctx.lineWidth = 1;
    const y = Math.random() * 64;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(64, y + (Math.random() - 0.5) * 10);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const coconutTexture = makeCoconutTexture();
const coconutEyeMat = new THREE.MeshStandardMaterial({ color: 0x1a120a, roughness: 0.8 });
const sproutMat = new THREE.MeshStandardMaterial({ color: 0x3ddc6e, roughness: 0.5, side: THREE.DoubleSide });

function createCollectibleMesh(value) {
  const cfg = COLLECTIBLE_CONFIG[value];
  const group = new THREE.Group();

  const huskMat = new THREE.MeshStandardMaterial({
    map: coconutTexture,
    color: cfg.special ? 0xd4a017 : 0xffffff,
    roughness: 0.85,
  });
  const coconut = new THREE.Mesh(new THREE.SphereGeometry(cfg.size, 12, 10), huskMat);
  coconut.position.y = 1.1;
  coconut.castShadow = true;
  group.add(coconut);

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(cfg.size * 0.16, 6, 6), coconutEyeMat);
    eye.position.set(Math.cos(a) * cfg.size * 0.4, 1.1 + cfg.size * 0.75, Math.sin(a) * cfg.size * 0.4);
    group.add(eye);
  }

  if (cfg.special) {
    const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 5), sproutMat);
    sprout.position.set(0, 1.1 + cfg.size * 0.95, 0);
    group.add(sprout);
  }

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(cfg.size * 0.85, 0.035, 8, 24),
    new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.4, metalness: 0.3 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  group.add(ring);

  const sprite = makeTextSprite(value + 'MB', cfg.color);
  sprite.position.y = 1.1 + cfg.size + 0.4;
  group.add(sprite);

  group.userData = {
    value,
    special: !!cfg.special,
    spinSpeed: 1 + Math.random() * 0.6,
    color: cfg.color,
    coconutMesh: coconut,
    bobPhase: Math.random() * Math.PI * 2,
  };
  return group;
}

export const collectibles = [];

export function placeCollectible(scene, laneIdx, value, z) {
  const mesh = createCollectibleMesh(value);
  mesh.position.x = LANES[laneIdx];
  mesh.position.z = z;
  mesh.userData.lane = laneIdx;
  scene.add(mesh);
  collectibles.push(mesh);
}

export function weightedCollectibleValue() {
  const r = Math.random();
  if (r < 0.55) return 10;
  if (r < 0.85) return 20;
  return 30;
}

export function updateCollectibles(scene, dt, speed, elapsed) {
  for (let i = collectibles.length - 1; i >= 0; i--) {
    const c = collectibles[i];
    c.position.z += speed * dt;
    c.rotation.y += dt * c.userData.spinSpeed;
    if (c.userData.special) {
      c.rotation.x += dt * c.userData.spinSpeed * 0.6;
    }
    c.userData.coconutMesh.position.y = 1.1 + Math.sin(elapsed * 3 + c.userData.bobPhase) * 0.08;
    if (c.position.z > REMOVE_Z) {
      scene.remove(c);
      collectibles.splice(i, 1);
    }
  }
}

export function clearCollectibles(scene) {
  collectibles.forEach((c) => scene.remove(c));
  collectibles.length = 0;
}
