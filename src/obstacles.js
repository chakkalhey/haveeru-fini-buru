import * as THREE from 'three';
import { LANES, REMOVE_Z } from './constants.js';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const lowObstacleMat = new THREE.MeshStandardMaterial({ color: 0xb5432f, roughness: 0.6 });
const highObstacleMat = new THREE.MeshStandardMaterial({ color: 0x6b5a3f, roughness: 0.6 });
const wallObstacleMat = new THREE.MeshStandardMaterial({ color: 0x7a4a2a, roughness: 0.65 });

function createBoxObstacle(kind) {
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
  return { mesh, wheels: [] };
}

/* ---------------------------------------------------------------- */
/* car                                                                */
/* ---------------------------------------------------------------- */

const CAR_COLORS = [0xd64550, 0x3a6ea5, 0xe8e4d8, 0x2e2e35, 0xd9a441];
const carGlassMat = new THREE.MeshStandardMaterial({ color: 0x1a2530, roughness: 0.2, metalness: 0.5 });
const carWheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
const carHeadlightMat = new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff6d8, emissiveIntensity: 1.0 });
const carTaillightMat = new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff3b3b, emissiveIntensity: 0.8 });

function createCarObstacle() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: CAR_COLORS[randInt(0, CAR_COLORS.length - 1)],
    roughness: 0.45,
    metalness: 0.3,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 2.2), bodyMat);
  body.position.y = 0.5;

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.42, 1.1), bodyMat);
  cabin.position.set(0, 0.98, -0.1);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.36, 0.96), carGlassMat);
  windshield.position.set(0, 0.98, -0.1);

  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.22, 12);
  const wheelPositions = [
    [-0.72, 0.28, 0.75], [0.72, 0.28, 0.75],
    [-0.72, 0.28, -0.75], [0.72, 0.28, -0.75],
  ];
  const wheels = wheelPositions.map(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeo, carWheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, y, z);
    return w;
  });

  // Traffic travels the same direction as the player (matches the
  // same-direction lane markings), so the front (headlights) faces away
  // down the road (-Z) and the rear (taillights) faces the player (+Z).
  const headlightL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), carHeadlightMat);
  headlightL.position.set(-0.55, 0.5, -1.12);
  const headlightR = headlightL.clone();
  headlightR.position.x = 0.55;

  const tailL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), carTaillightMat);
  tailL.position.set(-0.55, 0.5, 1.12);
  const tailR = tailL.clone();
  tailR.position.x = 0.55;

  group.add(body, cabin, windshield, headlightL, headlightR, tailL, tailR, ...wheels);
  group.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });

  return { mesh: group, wheels };
}

/* ---------------------------------------------------------------- */
/* motorbike                                                          */
/* ---------------------------------------------------------------- */

const BIKE_COLORS = [0x2e2e35, 0xd64550, 0x3a6ea5, 0x1f8f43];
const bikeRiderMat = new THREE.MeshStandardMaterial({ color: 0x23272e, roughness: 0.5 });
const bikeHelmetMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.3, metalness: 0.3 });
const bikeWheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
const bikeHeadlightMat = new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff6d8, emissiveIntensity: 1.0 });

function createMotorbikeObstacle() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: BIKE_COLORS[randInt(0, BIKE_COLORS.length - 1)],
    roughness: 0.4,
    metalness: 0.4,
  });

  const bodyBlock = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 1.3), bodyMat);
  bodyBlock.position.y = 0.5;

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.5), bikeRiderMat);
  seat.position.set(0, 0.68, 0.15);

  const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), bodyMat);
  handlebar.position.set(0, 0.92, -0.55);

  const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), bikeHeadlightMat);
  headlight.position.set(0, 0.62, -0.68);

  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.1, 14);
  const frontWheel = new THREE.Mesh(wheelGeo, bikeWheelMat);
  frontWheel.rotation.z = Math.PI / 2;
  frontWheel.position.set(0, 0.28, 0.58);
  const rearWheel = frontWheel.clone();
  rearWheel.position.set(0, 0.28, -0.58);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.24), bikeRiderMat);
  torso.position.set(0, 0.95, -0.05);
  torso.rotation.x = -0.25;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), bikeHelmetMat);
  head.position.set(0, 1.32, 0.05);

  const wheels = [frontWheel, rearWheel];
  group.add(bodyBlock, seat, handlebar, headlight, frontWheel, rearWheel, torso, head);
  group.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });

  return { mesh: group, wheels };
}

/* ---------------------------------------------------------------- */
/* obstacle factory                                                   */
/* ---------------------------------------------------------------- */

function pickWallVariant() {
  const r = Math.random();
  if (r < 0.45) return 'car';
  if (r < 0.75) return 'motorbike';
  return 'plain';
}

function createObstacleMesh(kind) {
  if (kind === 'low' || kind === 'high') {
    return createBoxObstacle(kind);
  }
  const variant = pickWallVariant();
  if (variant === 'car') return createCarObstacle();
  if (variant === 'motorbike') return createMotorbikeObstacle();
  return createBoxObstacle('wall');
}

export const obstacles = [];

export function placeObstacle(scene, laneIdx, kind, z) {
  const { mesh, wheels } = createObstacleMesh(kind);
  mesh.position.x = LANES[laneIdx];
  mesh.position.z = z;
  mesh.userData.lane = laneIdx;
  mesh.userData.kind = kind;
  mesh.userData.wheels = wheels;
  scene.add(mesh);
  obstacles.push(mesh);
}

export function updateObstacles(scene, dt, speed) {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.position.z += speed * dt;
    o.userData.wheels.forEach((w) => {
      w.rotation.x += dt * speed * 3;
    });
    if (o.position.z > REMOVE_Z) {
      scene.remove(o);
      obstacles.splice(i, 1);
    }
  }
}

export function clearObstacles(scene) {
  obstacles.forEach((o) => scene.remove(o));
  obstacles.length = 0;
}
