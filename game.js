import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ---------------------------------------------------------------- */
/* constants                                                         */
/* ---------------------------------------------------------------- */

const LANES = [-1.8, 0, 1.8];
const SPAWN_Z = -260;
const REMOVE_Z = 8;
const SECTION_LENGTH = 26;

const BASE_SPEED = 13;
const MAX_SPEED_BONUS = 15;
const SPEED_RAMP = 0.12;

const JUMP_DURATION = 0.62;
const JUMP_HEIGHT = 1.55;
const SLIDE_DURATION = 0.55;

const COLLECTIBLE_CONFIG = {
  10: { color: 0x38e1ff, size: 0.32 },
  20: { color: 0x39ff88, size: 0.38 },
  30: { color: 0xb15bff, size: 0.44 },
  40: { color: 0xffd23f, size: 0.56, special: true },
};

const BOOST_DURATION = 8;

/* ---------------------------------------------------------------- */
/* dom refs                                                          */
/* ---------------------------------------------------------------- */

const container = document.getElementById('game-container');
const hud = document.getElementById('hud');
const scoreValueEl = document.getElementById('score-value');
const mbValueEl = document.getElementById('mb-value');
const boostWrap = document.getElementById('boost-wrap');
const boostFill = document.getElementById('boost-fill');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('gameover-screen');
const finalScoreEl = document.getElementById('final-score');
const finalMbEl = document.getElementById('final-mb');
const bestScoreEl = document.getElementById('best-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const touchControls = document.getElementById('touch-controls');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnJump = document.getElementById('btn-jump');
const btnSlide = document.getElementById('btn-slide');

/* ---------------------------------------------------------------- */
/* renderer / scene / camera                                         */
/* ---------------------------------------------------------------- */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fc7e8);
scene.fog = new THREE.Fog(0xffb98c, 22, 150);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 5.0, 9.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.35, 0.4, 0.88
);
composer.addPass(bloomPass);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------------------------------------------------------------- */
/* lighting                                                           */
/* ---------------------------------------------------------------- */

scene.add(new THREE.HemisphereLight(0xbfe3ff, 0xd8b787, 0.95));
scene.add(new THREE.AmbientLight(0xffddbb, 0.35));

const dirLight = new THREE.DirectionalLight(0xffcf9e, 1.5);
dirLight.position.set(-9, 7, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.left = -9;
dirLight.shadow.camera.right = 9;
dirLight.shadow.camera.top = 12;
dirLight.shadow.camera.bottom = -4;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 30;
scene.add(dirLight);

/* ---------------------------------------------------------------- */
/* ground                                                             */
/* ---------------------------------------------------------------- */

const PLANE_WIDTH = 30;

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

const groundTexture = createRoadTexture();
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(PLANE_WIDTH, 520),
  new THREE.MeshStandardMaterial({ map: groundTexture, roughness: 0.9, metalness: 0.08 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, 0, -190);
ground.receiveShadow = true;
scene.add(ground);

/* ---------------------------------------------------------------- */
/* scenery (recycled pylons)                                         */
/* ---------------------------------------------------------------- */

const SCENERY_COUNT = 16;
const SCENERY_SPACING = 20;
const scenery = [];

const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x8a6642, roughness: 0.85 });
const palmFrondMat = new THREE.MeshStandardMaterial({ color: 0x2f7d3a, roughness: 0.55, side: THREE.DoubleSide });
const palmCocoMat = new THREE.MeshStandardMaterial({ color: 0x4a3320, roughness: 0.7 });

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
    const radiusTop = Math.max(0.24 - i * 0.03, 0.06);
    const radiusBottom = Math.max(0.28 - i * 0.03, 0.09);
    const segGeo = new THREE.CylinderGeometry(radiusTop, radiusBottom, segH, 8);
    const seg = new THREE.Mesh(segGeo, palmTrunkMat);
    seg.position.set(pos.x + Math.sin(angle) * segH / 2, pos.y + Math.cos(angle) * segH / 2, 0);
    seg.rotation.z = -angle;
    seg.castShadow = true;
    group.add(seg);
    pos = new THREE.Vector3(pos.x + Math.sin(angle) * segH, pos.y + Math.cos(angle) * segH, 0);
  }

  const frondCount = 9;
  for (let i = 0; i < frondCount; i++) {
    const yaw = new THREE.Group();
    yaw.position.copy(pos);
    yaw.rotation.y = (i / frondCount) * Math.PI * 2 + Math.random() * 0.3;
    const length = 2.0 + Math.random() * 0.8;
    const fGeo = new THREE.ConeGeometry(0.3, length, 5, 1);
    fGeo.scale(1, 1, 0.14);
    fGeo.translate(0, length / 2, 0);
    const frond = new THREE.Mesh(fGeo, palmFrondMat);
    frond.rotation.z = -Math.PI / 2 + 0.28 + Math.random() * 0.35;
    frond.castShadow = true;
    yaw.add(frond);
    group.add(yaw);
  }

  for (let i = 0; i < 4; i++) {
    const coco = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), palmCocoMat);
    coco.position.set(pos.x + (Math.random() - 0.5) * 0.3, pos.y - 0.12, pos.z + (Math.random() - 0.5) * 0.3);
    group.add(coco);
  }

  return group;
}

function initScenery() {
  for (let i = 0; i < SCENERY_COUNT; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const palm = createPalmTree();
    const bandOffset = 4.4 + Math.random() * 2.2;
    palm.position.set(side * bandOffset, 0, -i * SCENERY_SPACING - Math.random() * 6);
    palm.rotation.y = Math.random() * Math.PI * 2;
    const scale = 0.9 + Math.random() * 0.45;
    palm.scale.set(scale, scale, scale);
    scene.add(palm);
    scenery.push(palm);
  }
}
initScenery();

function updateScenery(dt) {
  const totalSpan = SCENERY_COUNT * SCENERY_SPACING;
  scenery.forEach((p) => {
    p.position.z += speed * dt;
    if (p.position.z > 15) p.position.z -= totalSpan;
  });
}

const BUILDING_COUNT = 14;
const BUILDING_SPACING = 22;
const buildings = [];

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

function initBuildings() {
  for (let i = 0; i < BUILDING_COUNT; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const b = createBuilding();
    const offset = 8 + Math.random() * 5;
    b.position.set(side * offset, 0, -i * BUILDING_SPACING - Math.random() * 8);
    b.rotation.y = (Math.random() - 0.5) * 0.3;
    scene.add(b);
    buildings.push(b);
  }
}
initBuildings();

function updateBuildings(dt) {
  const totalSpan = BUILDING_COUNT * BUILDING_SPACING;
  buildings.forEach((b) => {
    b.position.z += speed * dt;
    if (b.position.z > 15) b.position.z -= totalSpan;
  });
}

/* ---------------------------------------------------------------- */
/* starfield (parallax backdrop)                                     */
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
scene.add(createSkyDome());

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(9, 24, 24),
  new THREE.MeshBasicMaterial({ color: 0xfff2cf, fog: false, toneMapped: false })
);
sun.position.set(-14, 13, -260);
scene.add(sun);

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
const cloudTexture = makeCloudTexture();

const clouds = [];
function createCloud() {
  const mat = new THREE.SpriteMaterial({ map: cloudTexture, transparent: true, opacity: 0.85, depthWrite: false, fog: false, toneMapped: false });
  const sprite = new THREE.Sprite(mat);
  const scale = 14 + Math.random() * 18;
  sprite.scale.set(scale, scale * 0.5, 1);
  return sprite;
}
function initClouds() {
  for (let i = 0; i < 14; i++) {
    const c = createCloud();
    c.position.set((Math.random() - 0.5) * 160, 18 + Math.random() * 22, -40 - Math.random() * 250);
    scene.add(c);
    clouds.push(c);
  }
}
initClouds();

function updateClouds(dt) {
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
/* player (procedural scooter rider)                                 */
/* ---------------------------------------------------------------- */

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

function createPlayer() {
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

  model.rotation.y = Math.PI;

  const group = new THREE.Group();
  group.add(model);
  group.userData.wheels = [frontWheel, rearWheel];
  group.userData.legs = [leftLeg, rightLeg];
  group.userData.arms = [leftArm, rightArm];

  return group;
}

const player = createPlayer();
scene.add(player);

/* ---------------------------------------------------------------- */
/* text sprites                                                      */
/* ---------------------------------------------------------------- */

function makeTextSprite(text, colorHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const c = '#' + colorHex.toString(16).padStart(6, '0');
  ctx.shadowColor = c;
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 128, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.95, 0.48, 1);
  return sprite;
}

/* ---------------------------------------------------------------- */
/* obstacles                                                         */
/* ---------------------------------------------------------------- */

const lowObstacleMat = new THREE.MeshStandardMaterial({ color: 0xb5432f, roughness: 0.6 });
const highObstacleMat = new THREE.MeshStandardMaterial({ color: 0x6b5a3f, roughness: 0.6 });
const wallObstacleMat = new THREE.MeshStandardMaterial({ color: 0x7a4a2a, roughness: 0.65 });

function createObstacleMesh(kind) {
  let mesh;
  if (kind === 'low') {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 0.6), lowObstacleMat);
    mesh.position.y = 0.45;
  } else if (kind === 'high') {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.5), highObstacleMat);
    mesh.position.y = 1.55;
  } else {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.3, 0.5), wallObstacleMat);
    mesh.position.y = 1.15;
  }
  mesh.castShadow = true;
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color: 0x2a1c12, transparent: true, opacity: 0.4 })
  );
  mesh.add(edges);
  return mesh;
}

const obstacles = [];

function placeObstacle(laneIdx, kind, z) {
  const mesh = createObstacleMesh(kind);
  mesh.position.x = LANES[laneIdx];
  mesh.position.z = z;
  mesh.userData.lane = laneIdx;
  mesh.userData.kind = kind;
  scene.add(mesh);
  obstacles.push(mesh);
}

/* ---------------------------------------------------------------- */
/* collectibles                                                      */
/* ---------------------------------------------------------------- */

const collectibles = [];

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

function placeCollectible(laneIdx, value, z) {
  const mesh = createCollectibleMesh(value);
  mesh.position.x = LANES[laneIdx];
  mesh.position.z = z;
  mesh.userData.lane = laneIdx;
  scene.add(mesh);
  collectibles.push(mesh);
}

function weightedCollectibleValue() {
  const r = Math.random();
  if (r < 0.55) return 10;
  if (r < 0.85) return 20;
  return 30;
}

/* ---------------------------------------------------------------- */
/* section spawning                                                  */
/* ---------------------------------------------------------------- */

let distanceSinceSection = 0;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomKind() {
  const kinds = ['low', 'high', 'wall'];
  return kinds[randInt(0, 2)];
}

function spawnCollectibleRun(laneIdx, zStart) {
  const count = 3 + randInt(0, 3);
  const value = weightedCollectibleValue();
  for (let i = 0; i < count; i++) {
    placeCollectible(laneIdx, value, zStart - i * 1.6);
  }
}

function spawnSection() {
  const z = SPAWN_Z;
  const blockedLanes = new Set();
  const pattern = Math.random();

  if (pattern < 0.5) {
    const lane = randInt(0, 2);
    blockedLanes.add(lane);
    placeObstacle(lane, randomKind(), z);
  } else if (pattern < 0.82) {
    const lanes = shuffle([0, 1, 2]);
    const blocked = lanes.slice(0, 2);
    blocked.forEach((l) => {
      blockedLanes.add(l);
      placeObstacle(l, 'wall', z);
    });
  }

  const freeLanes = [0, 1, 2].filter((l) => !blockedLanes.has(l));
  freeLanes.forEach((l) => {
    if (Math.random() < 0.75) spawnCollectibleRun(l, z);
  });

  if (Math.random() < 0.12 && freeLanes.length > 0) {
    const l = freeLanes[randInt(0, freeLanes.length - 1)];
    placeCollectible(l, 40, z - 8);
  }
}

function maybeSpawnSection(dt) {
  distanceSinceSection += speed * dt;
  if (distanceSinceSection >= SECTION_LENGTH) {
    distanceSinceSection = 0;
    spawnSection();
  }
}

/* ---------------------------------------------------------------- */
/* particle bursts                                                   */
/* ---------------------------------------------------------------- */

const bursts = [];

function spawnBurst(pos, color) {
  const count = 16;
  const positions = new Float32Array(count * 3);
  const velocities = [];
  for (let i = 0; i < count; i++) {
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;
    velocities.push(new THREE.Vector3((Math.random() - 0.5) * 3.2, Math.random() * 3 + 1.2, (Math.random() - 0.5) * 3.2));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color, size: 0.13, transparent: true, opacity: 1 });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  bursts.push({ pts, geo, mat, velocities, life: 0 });
}

function updateBursts(dt) {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.life += dt;
    const pos = b.geo.attributes.position.array;
    for (let j = 0; j < b.velocities.length; j++) {
      pos[j * 3] += b.velocities[j].x * dt;
      pos[j * 3 + 1] += (b.velocities[j].y - 5 * b.life) * dt;
      pos[j * 3 + 2] += b.velocities[j].z * dt + speed * dt;
    }
    b.geo.attributes.position.needsUpdate = true;
    b.mat.opacity = Math.max(0, 1 - b.life / 0.6);
    if (b.life > 0.6) {
      scene.remove(b.pts);
      b.geo.dispose();
      b.mat.dispose();
      bursts.splice(i, 1);
    }
  }
}

/* ---------------------------------------------------------------- */
/* game state                                                        */
/* ---------------------------------------------------------------- */

let laneIndex = 1;
let speed = BASE_SPEED;
let elapsed = 0;
let scoreAccum = 0;
let mbTotal = 0;
let scoreMultiplier = 1;
let runCycle = 0;

const state = {
  running: false,
  crashed: false,
  jumping: false,
  sliding: false,
  jumpT: 0,
  slideT: 0,
  boostActive: false,
  boostT: 0,
};

let shakeTime = 0;
let shakeStrength = 0;
let cameraBaseX = 0;
let cameraBaseY = 5.0;

const HIGH_SCORE_KEY = 'scooterRush_highScore';

/* ---------------------------------------------------------------- */
/* controls                                                          */
/* ---------------------------------------------------------------- */

function changeLane(dir) {
  laneIndex = Math.min(2, Math.max(0, laneIndex + dir));
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

window.addEventListener('keydown', (e) => {
  if (!state.running) {
    if (e.code === 'Space' || e.code === 'Enter') startGame();
    return;
  }
  if (state.crashed) return;
  switch (e.code) {
    case 'ArrowLeft':
    case 'KeyA':
      changeLane(-1);
      break;
    case 'ArrowRight':
    case 'KeyD':
      changeLane(1);
      break;
    case 'ArrowUp':
    case 'KeyW':
    case 'Space':
      jump();
      break;
    case 'ArrowDown':
    case 'KeyS':
      slide();
      break;
  }
});

let touchStartX = 0;
let touchStartY = 0;

container.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
}, { passive: true });

container.addEventListener('touchend', (e) => {
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);

  if (!state.running) {
    startGame();
    return;
  }
  if (state.crashed) return;

  if (Math.max(adx, ady) < 24) return;

  if (adx > ady) {
    changeLane(dx > 0 ? 1 : -1);
  } else if (dy < 0) {
    jump();
  } else {
    slide();
  }
}, { passive: true });

function bindHold(el, fn) {
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!state.running) {
      startGame();
      return;
    }
    if (!state.crashed) fn();
  });
}
bindHold(btnLeft, () => changeLane(-1));
bindHold(btnRight, () => changeLane(1));
bindHold(btnJump, jump);
bindHold(btnSlide, slide);

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

if (window.matchMedia('(pointer: coarse)').matches) {
  touchControls.classList.remove('hidden');
}

/* ---------------------------------------------------------------- */
/* game flow                                                         */
/* ---------------------------------------------------------------- */

function clearDynamicObjects() {
  obstacles.forEach((o) => scene.remove(o));
  obstacles.length = 0;
  collectibles.forEach((c) => scene.remove(c));
  collectibles.length = 0;
  bursts.forEach((b) => {
    scene.remove(b.pts);
    b.geo.dispose();
    b.mat.dispose();
  });
  bursts.length = 0;
}

function resetGame() {
  clearDynamicObjects();
  laneIndex = 1;
  speed = BASE_SPEED;
  elapsed = 0;
  scoreAccum = 0;
  mbTotal = 0;
  scoreMultiplier = 1;
  distanceSinceSection = 0;
  runCycle = 0;
  state.crashed = false;
  state.jumping = false;
  state.sliding = false;
  state.jumpT = 0;
  state.slideT = 0;
  state.boostActive = false;
  state.boostT = 0;
  player.position.set(0, 0, 0);
  player.rotation.set(0, 0, 0);
  player.scale.set(1, 1, 1);
  boostWrap.classList.add('hidden');
}

function startGame() {
  resetGame();
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  state.running = true;
}

function crash() {
  if (state.crashed) return;
  state.crashed = true;
  shakeTime = 0.45;
  shakeStrength = 0.18;

  const finalScore = Math.floor(scoreAccum);
  const best = Math.max(finalScore, parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10));
  localStorage.setItem(HIGH_SCORE_KEY, String(best));

  setTimeout(() => {
    finalScoreEl.textContent = finalScore;
    finalMbEl.textContent = mbTotal;
    bestScoreEl.textContent = best;
    hud.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    state.running = false;
  }, 550);
}

function collectItem(mesh) {
  mbTotal += mesh.userData.value;
  const worldPos = new THREE.Vector3();
  mesh.userData.coconutMesh.getWorldPosition(worldPos);
  spawnBurst(worldPos, mesh.userData.color);
  if (mesh.userData.special) {
    state.boostActive = true;
    state.boostT = BOOST_DURATION;
    scoreMultiplier = 2;
    boostWrap.classList.remove('hidden');
  }
}

/* ---------------------------------------------------------------- */
/* per-frame updates                                                  */
/* ---------------------------------------------------------------- */

function updatePlayer(dt) {
  const targetX = LANES[laneIndex];
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

  const bob = state.jumping ? 0 : Math.abs(Math.sin(runCycle * 2)) * 0.018;
  player.position.y = baseY + slideOffset + bob;

  runCycle += dt * speed * 1.1;
  player.userData.wheels.forEach((w) => {
    w.rotation.x += dt * speed * 3;
  });
  const swing = Math.sin(runCycle) * 0.5;
  player.userData.legs[0].rotation.x = swing;
  player.userData.legs[1].rotation.x = -swing;
  player.userData.arms[0].rotation.x = -0.7 + swing * 0.3;
  player.userData.arms[1].rotation.x = -0.7 - swing * 0.3;
}

function updateObstacles(dt) {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.position.z += speed * dt;
    if (o.position.z > REMOVE_Z) {
      scene.remove(o);
      obstacles.splice(i, 1);
    }
  }
}

function updateCollectibles(dt) {
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
  boostFill.style.width = Math.max(0, (state.boostT / BOOST_DURATION) * 100) + '%';
  if (state.boostT <= 0) {
    state.boostActive = false;
    scoreMultiplier = 1;
    boostWrap.classList.add('hidden');
  }
}

function updateCameraFollow(dt) {
  cameraBaseX = THREE.MathUtils.lerp(cameraBaseX, player.position.x * 0.5, dt * 5);
  cameraBaseY = state.sliding ? 4.7 : 5.0;
  camera.position.x = cameraBaseX;
  camera.position.y = cameraBaseY;
  camera.position.z = 9.5;
  camera.lookAt(player.position.x * 0.3, 1.4, -14);
}

function updateShake(dt) {
  if (shakeTime > 0) {
    shakeTime -= dt;
    camera.position.x += (Math.random() - 0.5) * shakeStrength;
    camera.position.y += (Math.random() - 0.5) * shakeStrength;
  }
}

function updateCrashAnim(dt) {
  player.rotation.x = THREE.MathUtils.lerp(player.rotation.x, 1.3, dt * 4);
  player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, 0.6, dt * 4);
  updateShake(dt);
}

function updateHUD() {
  scoreValueEl.textContent = Math.floor(scoreAccum);
  mbValueEl.textContent = mbTotal;
}

/* ---------------------------------------------------------------- */
/* main loop                                                          */
/* ---------------------------------------------------------------- */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (state.running && !state.crashed) {
    elapsed += dt;
    const boostSpeedMul = state.boostActive ? 1.2 : 1;
    speed = (BASE_SPEED + Math.min(elapsed * SPEED_RAMP, MAX_SPEED_BONUS)) * boostSpeedMul;

    scoreAccum += speed * dt * scoreMultiplier;

    updatePlayer(dt);
    updateObstacles(dt);
    updateCollectibles(dt);
    updateScenery(dt);
    updateBuildings(dt);
    updateClouds(dt);
    maybeSpawnSection(dt);
    checkCollisions();
    updateBursts(dt);
    updateBoost(dt);
    updateCameraFollow(dt);
    updateHUD();
  } else if (state.crashed) {
    updateCrashAnim(dt);
    updateBursts(dt);
  }

  composer.render();
}

animate();
