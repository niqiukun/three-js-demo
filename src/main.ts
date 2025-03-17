import {
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  Points,
  PointsMaterial,
  LineBasicMaterial,
  LineSegments,
  BufferGeometry,
  BufferAttribute,
} from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import './style.css';

const gui = new GUI();
const configuration = {
  speed: 1,
  scanSpeed: 1,
  amplitude: 1,
};
const folder = gui.addFolder('Multiplier');
folder.add(configuration, 'speed', 0, 2).name('Scroll Speed');
folder.add(configuration, 'scanSpeed', 0, 2).name('Scanline Speed');
folder.add(configuration, 'amplitude', 0, 2).name('Amplitude');

const scene = new Scene();
scene.background = new Color('black');

const camera = new PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight
);
camera.position.set(0, 2, 4);
camera.lookAt(scene.position);

function createGridGeometry(
  width: number,
  height: number,
  widthSegments: number,
  heightSegments: number
) {
  const geometry = new BufferGeometry();
  const [cornerX, cornerY] = [-width / 2, -height / 2];
  const [stepX, stepY] = [width / widthSegments, height / heightSegments];

  const vertices = [];
  for (let i = 0; i <= widthSegments; i += 1) {
    const x = cornerX + i * stepX;
    for (let j = 0; j <= heightSegments; j += 1) {
      const y = cornerY + j * stepY;
      vertices.push(x, y, 0);
    }
  }
  const indices = [];
  for (let i = 0; i < widthSegments; i += 1) {
    for (let j = 0; j < heightSegments; j += 1) {
      const a = i * (heightSegments + 1) + j;
      const b = a + heightSegments + 1;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, b, d, d, c, c, a);
    }
  }

  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(vertices), 3)
  );
  geometry.setIndex(indices);

  return geometry;
}

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
    const z =
      ((Math.sin((x + (t * configuration.speed) / 2000) * 3) *
        Math.sin(y * 3)) /
        3) *
      configuration.amplitude;

    pos.setZ(i, z);

    const scanlineX = (((t * configuration.scanSpeed) / 1000) % 8) - 4; // -4 to 4
    const distance = Math.abs(x - scanlineX);
    const opacity = Math.exp(-distance * 12) * 255;
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
