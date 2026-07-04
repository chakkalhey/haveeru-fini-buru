import * as THREE from 'three';

export function makeTextSprite(text, colorHex) {
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

const bursts = [];

export function spawnBurst(scene, pos, color) {
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

export function updateBursts(scene, dt, speed) {
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

export function clearBursts(scene) {
  bursts.forEach((b) => {
    scene.remove(b.pts);
    b.geo.dispose();
    b.mat.dispose();
  });
  bursts.length = 0;
}
