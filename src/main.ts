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
  Fog,
} from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { createGridGeometry, gaussian, getAudioAmplitude } from './helper';
import './style.css';

const scene = new Scene();
scene.background = new Color('black');
const fog = new Fog(new Color('black'), 4, 6);
scene.fog = fog;
let animationStarted = false;
let openAnimationStart = 0;
let scanningStart = performance.now();

const configuration = {
  speed: 1,
  scanSpeed: 1.6,
  amplitude: 0.6,
  frequency: 0.4,
  localAmplitude: 0,
  localFrequency: 1.6,
  cameraX: 1.16,
  cameraY: 1.64,
  cameraZ: 3.6,
  fogNear: 4,
  fogFar: 6,
  mode: 'Points',
  openingDuration: 5,
  handleOpening: playOpenAnimation,
  handleRecord: () => setupAudioCapture(false),
  handleRecordSystem: () => setupAudioCapture(true),
};

let analyser: AnalyserNode | undefined;
let source: MediaStreamAudioSourceNode | undefined;
let stream: MediaStream | undefined;
async function setupAudioCapture(fromSystem: boolean) {
  if (!analyser) {
    if (!fromSystem) {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } else {
      stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
      });
    }

    // Create an Audio Context
    const audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256; // Small FFT size for smooth waveform

    // Create a source from the microphone stream
    source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
  } else {
    stream?.getTracks().forEach((track) => track.stop());
    source?.disconnect();
    analyser = undefined;
    configuration.localAmplitude = 0;
  }
}

const camera = new PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight
);

function updateCameraPosition() {
  camera.position.set(
    configuration.cameraX,
    configuration.cameraY,
    configuration.cameraZ
  );
  camera.lookAt(scene.position);
}
updateCameraPosition();

function playOpenAnimation() {
  openAnimationStart = performance.now();
  animationStarted = true;
}

const geometry = createGridGeometry(6, 6, 120, 120);
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
function setColor(i: number, r: number, g: number, b: number) {
  colors[i * 3] = r;
  colors[i * 3 + 1] = g;
  colors[i * 3 + 2] = b;
}

const renderer = new WebGLRenderer({ antialias: true });
const stats = new Stats();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop((t: number) => {
  let volume = 0;
  if (analyser) {
    volume = getAudioAmplitude(analyser) / 100;
    configuration.localAmplitude = volume * 3;
  }

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);

    if (!animationStarted) {
      pos.setZ(i, 0);
      continue;
    }

    const distanceToCenter = Math.sqrt(x ** 2 + y ** 2);
    const gaussianValue =
      gaussian(distanceToCenter, 1, 0, 0.6) * configuration.localAmplitude;

    const tSpeed = t * configuration.speed;
    let amplitude = configuration.amplitude / 6;

    if (openAnimationStart) {
      const progress = Math.max(
        0,
        (t - openAnimationStart - configuration.openingDuration * 0.1 * 1000) /
          (configuration.openingDuration * 0.2 * 1000)
      );
      if (progress >= 1) {
        openAnimationStart = 0;
        scanningStart = performance.now();
      }
      amplitude *= progress;
    }

    const { frequency } = configuration;
    const z =
      amplitude * Math.sin(2 * Math.PI * frequency * (x + y + tSpeed / 1000)) +
      0.5 *
        amplitude *
        Math.sin(4 * Math.PI * frequency * (x - y + (tSpeed / 1000) * 0.5)) +
      0.3 *
        amplitude *
        Math.sin(
          8 * Math.PI * frequency * (x * 0.5 + y * 0.7 + (tSpeed / 1000) * 0.3)
        );
    const localZ =
      0.1 *
        Math.sin(
          2 *
            Math.PI *
            configuration.localFrequency *
            (x + (tSpeed / 1000) * 1.2)
        ) *
        gaussianValue +
      0.2 * gaussianValue;

    pos.setZ(i, z + localZ);

    if (openAnimationStart) {
      const progress =
        (t - openAnimationStart) / (configuration.openingDuration * 0.6 * 1000);
      const openingScanDistance = Math.sqrt(6 ** 2 * 2) * progress;
      const distanceToOpeningScan = Math.abs(
        distanceToCenter - openingScanDistance
      );
      const opacity = Math.exp(-distanceToOpeningScan * 30) * 255;
      setColor(i, opacity, opacity, opacity);
    } else if (configuration.mode === 'Scanning') {
      const scanlineX =
        ((((t - scanningStart) * configuration.scanSpeed) / 1000) % 8) - 4; // -4 to 4
      const distanceToScanline = Math.abs(x - scanlineX);
      const opacity = Math.exp(-distanceToScanline * 12) * 255;
      setColor(i, opacity, opacity, opacity);
    } else if (configuration.mode === 'Wireframe') {
      setColor(i, 255, 255, 255);
    } else {
      setColor(i, 0, 0, 0);
    }
  }
  pos.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;

  stats.begin();
  renderer.render(scene, camera);
  stats.end();
});
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.onmessage = function handleMessage(e) {
  if (e.data.message === 'playOpenAnimation') {
    playOpenAnimation();
  } else if (e.data.message === 'setMode') {
    configuration.mode = e.data.payload;
    if (configuration.mode === 'Scanning') {
      scanningStart = performance.now();
    }
  } else if (e.data.message === 'setLocalAmplitude') {
    configuration.localAmplitude = e.data.payload;
  }
};

function setupGUI() {
  document.body.appendChild(stats.dom);
  const gui = new GUI();
  const actions = gui.addFolder('Actions');
  actions.add(configuration, 'handleOpening').name('Play Open Animation');
  actions
    .add(configuration, 'handleRecord')
    .name('Toggle Audio Capture (Microphone)');
  actions
    .add(configuration, 'handleRecordSystem')
    .name('Toggle Audio Capture (System)');
  const cameraConfig = gui.addFolder('Camera');
  cameraConfig
    .add(configuration, 'cameraX', -10, 10)
    .name('X')
    .onChange(() => updateCameraPosition());
  cameraConfig
    .add(configuration, 'cameraY', -10, 10)
    .name('Y')
    .onChange(() => updateCameraPosition());
  cameraConfig
    .add(configuration, 'cameraZ', -10, 10)
    .name('Z')
    .onChange(() => updateCameraPosition());
  const sceneConfig = gui.addFolder('Scene');
  sceneConfig
    .add(configuration, 'mode', ['Points', 'Scanning', 'Wireframe'])
    .name('Mode')
    .onChange(() => {
      if (configuration.mode === 'Scanning') {
        scanningStart = performance.now();
      }
    });
  const movementConfig = gui.addFolder('Movement');
  movementConfig.add(configuration, 'speed', 0, 2).name('Wave Speed');
  movementConfig.add(configuration, 'scanSpeed', 0, 2).name('Scanline Speed');
  movementConfig.add(configuration, 'amplitude', 0, 2).name('Amplitude');
  movementConfig.add(configuration, 'frequency', 0, 1).name('Frequency');
  movementConfig
    .add(configuration, 'localAmplitude', 0, 3)
    .name('Local Amplitude')
    .listen();
  movementConfig
    .add(configuration, 'localFrequency', 0, 2)
    .name('Local Frequency');
  const durationConfig = gui.addFolder('Duration');
  durationConfig
    .add(configuration, 'openingDuration', 0, 10)
    .name('Opening Animation');
  const fogConfig = gui.addFolder('Fog');
  fogConfig
    .add(configuration, 'fogNear', 0, 10)
    .name('Near')
    .onChange(() => {
      fog.near = configuration.fogNear;
    });
  fogConfig
    .add(configuration, 'fogFar', 0, 10)
    .name('Far')
    .onChange(() => {
      fog.far = configuration.fogFar;
    });
}

const params = new URLSearchParams(window.location.search);
if (!params.has('hideUI')) {
  setupGUI();
}
