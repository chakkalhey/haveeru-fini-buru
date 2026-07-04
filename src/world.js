import * as THREE from 'three';
import { PLANE_WIDTH } from './constants.js';
import { randInt } from './utils.js';

/* ---------------------------------------------------------------- */
/* road / ground                                                     */
/* ---------------------------------------------------------------- */

function createRoadTexture() {
  const W = 256;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const worldToPx = (w) => ((w + PLANE_WIDTH / 2) / PLANE_WIDTH) * W;
  const roadX0 = worldToPx(-3.3);
  const roadX1 = worldToPx(3.3);

  // sand on both sides of the road
  ctx.fillStyle = '#e8cf9c';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(170,135,85,${Math.random() * 0.18})`;
    const sx = Math.random() < 0.5 ? Math.random() * roadX0 : roadX1 + Math.random() * (W - roadX1);
    ctx.fillRect(sx, Math.random() * H, 2, 2);
  }

  // asphalt
  ctx.fillStyle = '#3b3b42';
  ctx.fillRect(roadX0, 0, roadX1 - roadX0, H);
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
    ctx.fillRect(roadX0 + Math.random() * (roadX1 - roadX0), Math.random() * H, 2, 2);
  }

  // road edge lines
  ctx.fillStyle = '#f2ead9';
  ctx.fillRect(roadX0 + 3, 0, 3, H);
  ctx.fillRect(roadX1 - 6, 0, 3, H);

  // dashed lane dividers
  const laneX1 = roadX0 + (roadX1 - roadX0) / 3;
  const laneX2 = roadX0 + (roadX1 - roadX0) * (2 / 3);
  ctx.fillStyle = '#f5e7b8';
  const dashLen = 34;
  const gapLen = 26;
  [laneX1, laneX2].forEach((lx) => {
    for (let y = 0; y < H; y += dashLen + gapLen) {
      ctx.fillRect(lx - 2, y, 4, dashLen);
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 46);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createGround() {
  const groundTexture = createRoadTexture();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(PLANE_WIDTH, 520),
    new THREE.MeshStandardMaterial({ map: groundTexture, roughness: 0.9, metalness: 0.08 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -190);
  ground.receiveShadow = true;
  return ground;
}

/* ---------------------------------------------------------------- */
/* palm trees                                                         */
/* ---------------------------------------------------------------- */

const SCENERY_COUNT = 16;
const SCENERY_SPACING = 20;

const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x8a6642, roughness: 0.85 });
const palmFrondMat = new THREE.MeshStandardMaterial({ color: 0x2f7d3a, roughness: 0.55, side: THREE.DoubleSide });
const palmFrondMatDark = new THREE.MeshStandardMaterial({ color: 0x24632b, roughness: 0.55, side: THREE.DoubleSide });
const palmCocoMat = new THREE.MeshStandardMaterial({ color: 0x4a3320, roughness: 0.7 });

// Two chained, tapering, flattened cones: a wide near-horizontal base segment
// and a narrower, more sharply drooping tip segment. This reads as a bent,
// arcing frond instead of a straight spiky blade.
function createFrond(mat, length, baseDroop) {
  const group = new THREE.Group();
  const len1 = length * 0.55;
  const len2 = length * 0.45;

  const geo1 = new THREE.ConeGeometry(0.34, len1, 6, 1);
  geo1.scale(1, 1, 0.15);
  geo1.translate(0, len1 / 2, 0);
  const seg1 = new THREE.Mesh(geo1, mat);
  seg1.rotation.z = -Math.PI / 2 + baseDroop;
  seg1.castShadow = true;
  group.add(seg1);

  const tipX = Math.cos(baseDroop) * len1;
  const tipY = -Math.sin(baseDroop) * len1;

  const geo2 = new THREE.ConeGeometry(0.15, len2, 5, 1);
  geo2.scale(1, 1, 0.15);
  geo2.translate(0, len2 / 2, 0);
  const seg2 = new THREE.Mesh(geo2, mat);
  const tipDroop = baseDroop + 0.55 + Math.random() * 0.25;
  seg2.rotation.z = -Math.PI / 2 + tipDroop;
  seg2.position.set(tipX, tipY, 0);
  seg2.castShadow = true;
  group.add(seg2);

  return group;
}

function createPalmTree() {
  const group = new THREE.Group();

  const totalHeight = 4.4 + Math.random() * 2.4;
  const segCount = 5;
  const segH = totalHeight / segCount;
  const leanDir = (Math.random() - 0.5) * 0.9;

  let pos = new THREE.Vector3(0, 0, 0);
  let angle = 0;
  for (let i = 0; i < segCount; i++) {
    angle += (leanDir * (i + 1) / segCount) * 0.16;
    const radiusTop = Math.max(0.26 - i * 0.032, 0.06);
    const radiusBottom = Math.max(0.32 - i * 0.032, 0.09);
    const segGeo = new THREE.CylinderGeometry(radiusTop, radiusBottom, segH, 8);
    const seg = new THREE.Mesh(segGeo, palmTrunkMat);
    seg.position.set(pos.x + Math.sin(angle) * segH / 2, pos.y + Math.cos(angle) * segH / 2, 0);
    seg.rotation.z = -angle;
    seg.castShadow = true;
    group.add(seg);
    pos = new THREE.Vector3(pos.x + Math.sin(angle) * segH, pos.y + Math.cos(angle) * segH, 0);
  }

  const crown = new THREE.Group();
  crown.position.copy(pos);
  const frondCount = 10;
  for (let i = 0; i < frondCount; i++) {
    const yaw = new THREE.Group();
    yaw.rotation.y = (i / frondCount) * Math.PI * 2 + Math.random() * 0.3;
    const length = 2.3 + Math.random() * 1.1;
    const baseDroop = 0.1 + Math.random() * 0.18;
    const mat = i % 2 === 0 ? palmFrondMat : palmFrondMatDark;
    const frond = createFrond(mat, length, baseDroop);
    yaw.add(frond);
    crown.add(yaw);
  }
  group.add(crown);

  for (let i = 0; i < 4; i++) {
    const coco = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), palmCocoMat);
    coco.position.set(pos.x + (Math.random() - 0.5) * 0.3, pos.y - 0.12, pos.z + (Math.random() - 0.5) * 0.3);
    group.add(coco);
  }

  group.userData.crown = crown;
  group.userData.swayPhase = Math.random() * Math.PI * 2;

  return group;
}

function createScenery() {
  const scenery = [];
  for (let i = 0; i < SCENERY_COUNT; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const palm = createPalmTree();
    const bandOffset = 4.4 + Math.random() * 2.2;
    palm.position.set(side * bandOffset, 0, -i * SCENERY_SPACING - Math.random() * 6);
    palm.rotation.y = Math.random() * Math.PI * 2;
    const scale = 0.9 + Math.random() * 0.45;
    palm.scale.set(scale, scale, scale);
    scenery.push(palm);
  }
  return scenery;
}

function updateScenery(scenery, dt, speed, time) {
  const totalSpan = SCENERY_COUNT * SCENERY_SPACING;
  scenery.forEach((p) => {
    p.position.z += speed * dt;
    if (p.position.z > 15) p.position.z -= totalSpan;
    if (p.userData.crown) {
      p.userData.crown.rotation.z = Math.sin(time * 0.8 + p.userData.swayPhase) * 0.05;
    }
  });
}

/* ---------------------------------------------------------------- */
/* buildings                                                          */
/* ---------------------------------------------------------------- */

const BUILDING_COUNT = 14;
const BUILDING_SPACING = 22;
const BUILDING_WALL_COLORS = ['#f5ead6', '#ffd9b3', '#dff0ea', '#f7c8b0'];
const BUILDING_ROOF_COLORS = ['#c9573f', '#7a8f6b', '#8f5a3f'];

function makeBuildingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  const wall = BUILDING_WALL_COLORS[randInt(0, BUILDING_WALL_COLORS.length - 1)];
  const roof = BUILDING_ROOF_COLORS[randInt(0, BUILDING_ROOF_COLORS.length - 1)];
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, 64, 96);
  ctx.fillStyle = roof;
  ctx.fillRect(0, 0, 64, 10);
  const cols = 4;
  const rows = 7;
  const cw = 64 / cols;
  const ch = (96 - 14) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < 0.55) {
        ctx.fillStyle = '#3a4a55';
        ctx.fillRect(c * cw + 4, 14 + r * ch + 3, cw - 8, ch - 6);
        ctx.strokeStyle = '#fffaf0';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * cw + 4, 14 + r * ch + 3, cw - 8, ch - 6);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBuilding() {
  const width = 2.4 + Math.random() * 1.8;
  const depth = 2.4 + Math.random() * 1.8;
  const height = 3 + Math.random() * 4;
  const tex = makeBuildingTexture();
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, Math.max(1, Math.round(height / 3.5)));
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
  box.position.y = height / 2;
  box.castShadow = true;
  box.receiveShadow = true;
  const group = new THREE.Group();
  group.add(box);
  return group;
}

function createBuildings() {
  const buildings = [];
  for (let i = 0; i < BUILDING_COUNT; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const b = createBuilding();
    const offset = 8 + Math.random() * 5;
    b.position.set(side * offset, 0, -i * BUILDING_SPACING - Math.random() * 8);
    b.rotation.y = (Math.random() - 0.5) * 0.3;
    buildings.push(b);
  }
  return buildings;
}

function updateBuildings(buildings, dt, speed) {
  const totalSpan = BUILDING_COUNT * BUILDING_SPACING;
  buildings.forEach((b) => {
    b.position.z += speed * dt;
    if (b.position.z > 15) b.position.z -= totalSpan;
  });
}

/* ---------------------------------------------------------------- */
/* sky / sun / clouds                                                 */
/* ---------------------------------------------------------------- */

function createSkyDome() {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#3f6fa8');
  grad.addColorStop(0.32, '#7fb0d6');
  grad.addColorStop(0.52, '#ffd9a0');
  grad.addColorStop(0.7, '#ff9d6c');
  grad.addColorStop(0.85, '#ff7f5c');
  grad.addColorStop(1, '#ffb37a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.SphereGeometry(300, 24, 16);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, toneMapped: false });
  return new THREE.Mesh(geo, mat);
}

function createSun() {
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(9, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff2cf, fog: false, toneMapped: false })
  );
  sun.position.set(-14, 13, -260);
  return sun;
}

function makeCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const blob = (x, y, r, alpha) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,250,245,${alpha})`);
    g.addColorStop(1, 'rgba(255,250,245,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  blob(90, 72, 52, 0.9);
  blob(140, 60, 58, 0.9);
  blob(180, 76, 42, 0.85);
  blob(60, 82, 38, 0.8);
  blob(120, 50, 40, 0.7);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCloud(cloudTexture) {
  const mat = new THREE.SpriteMaterial({ map: cloudTexture, transparent: true, opacity: 0.85, depthWrite: false, fog: false, toneMapped: false });
  const sprite = new THREE.Sprite(mat);
  const scale = 14 + Math.random() * 18;
  sprite.scale.set(scale, scale * 0.5, 1);
  return sprite;
}

function createClouds() {
  const cloudTexture = makeCloudTexture();
  const clouds = [];
  for (let i = 0; i < 14; i++) {
    const c = createCloud(cloudTexture);
    c.position.set((Math.random() - 0.5) * 160, 18 + Math.random() * 22, -40 - Math.random() * 250);
    clouds.push(c);
  }
  return clouds;
}

function updateClouds(clouds, dt, speed) {
  clouds.forEach((c) => {
    c.position.z += speed * dt * 0.15;
    c.position.x += dt * 0.15;
    if (c.position.z > 40) {
      c.position.z -= 300;
      c.position.x = (Math.random() - 0.5) * 160;
    }
  });
}

/* ---------------------------------------------------------------- */
/* public API                                                         */
/* ---------------------------------------------------------------- */

export function initWorld(scene) {
  scene.add(createGround());

  const scenery = createScenery();
  scenery.forEach((p) => scene.add(p));

  const buildings = createBuildings();
  buildings.forEach((b) => scene.add(b));

  scene.add(createSkyDome());
  scene.add(createSun());

  const clouds = createClouds();
  clouds.forEach((c) => scene.add(c));

  return { scenery, buildings, clouds };
}

let worldTime = 0;

export function updateWorld(world, dt, speed) {
  worldTime += dt;
  updateScenery(world.scenery, dt, speed, worldTime);
  updateBuildings(world.buildings, dt, speed);
  updateClouds(world.clouds, dt, speed);
}
