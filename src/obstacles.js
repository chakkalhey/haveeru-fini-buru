import * as THREE from 'three';
import { LANES, REMOVE_Z } from './constants.js';

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

export const obstacles = [];

export function placeObstacle(scene, laneIdx, kind, z) {
  const mesh = createObstacleMesh(kind);
  mesh.position.x = LANES[laneIdx];
  mesh.position.z = z;
  mesh.userData.lane = laneIdx;
  mesh.userData.kind = kind;
  scene.add(mesh);
  obstacles.push(mesh);
}

export function updateObstacles(scene, dt, speed) {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.position.z += speed * dt;
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
