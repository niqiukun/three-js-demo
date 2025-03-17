import {
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  Points,
  PointsMaterial,
  LineBasicMaterial,
  LineSegments,
  BufferAttribute,
} from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { createGridGeometry, gaussian } from './helper';
import './style.css';

const gui = new GUI();
const configuration = {
  speed: 1,
  scanSpeed: 1,
  amplitude: 0.5,
  localAmplitude: 0,
};
const folder = gui.addFolder('Multiplier');
folder.add(configuration, 'speed', 0, 2).name('Scroll Speed');
folder.add(configuration, 'scanSpeed', 0, 2).name('Scanline Speed');
folder.add(configuration, 'amplitude', 0, 2).name('Amplitude');
folder.add(configuration, 'localAmplitude', 0, 3).name('Local Amplitude');

const scene = new Scene();
scene.background = new Color('black');

const camera = new PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight
);
camera.position.set(0, 2, 4);
camera.lookAt(scene.position);

const geometry = createGridGeometry(6, 4, 120, 80);
const pos = geometry.getAttribute('position');

const points = new Points(
  geometry,
  new PointsMaterial({ color: new Color('white'), size: 0.02 })
);
points.rotation.x = -Math.PI / 2;
scene.add(points);

const material = new LineBasicMaterial({ vertexColors: true });
const wireframe = new LineSegments(geometry, material);
wireframe.rotation.x = -Math.PI / 2;
scene.add(wireframe);

const colors = new Float32Array(geometry.attributes.position.count * 3);
geometry.setAttribute('color', new BufferAttribute(colors, 3));

const renderer = new WebGLRenderer({ antialias: true });
const stats = new Stats();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop((t: number) => {
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);

    const distanceToCenter = Math.sqrt(x ** 2 + y ** 2);
    const gaussianValue =
      gaussian(distanceToCenter, 1, 0, 0.6) * configuration.localAmplitude;

    const z =
      ((Math.sin((x + (t * configuration.speed) / 2000) * 3) *
        Math.sin(y * 3)) /
        3) *
      configuration.amplitude *
      (1 + gaussianValue);

    pos.setZ(i, z);
    // pos.setZ(i, gaussianValue);

    const scanlineX = (((t * configuration.scanSpeed) / 1000) % 8) - 4; // -4 to 4
    const distanceToScanline = Math.abs(x - scanlineX);
    const opacity = Math.exp(-distanceToScanline * 12) * 255;
    colors[i * 3] = opacity;
    colors[i * 3 + 1] = opacity;
    colors[i * 3 + 2] = opacity;
  }
  pos.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;

  stats.begin();
  renderer.render(scene, camera);
  stats.end();
});
document.body.appendChild(renderer.domElement);
document.body.appendChild(stats.dom);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
