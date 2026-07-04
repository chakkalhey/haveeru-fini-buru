import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function initScene(container) {
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

  return { scene, camera, renderer, composer };
}
