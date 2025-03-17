import { BufferAttribute, BufferGeometry } from 'three';

export function createGridGeometry(
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

export function getAudioAmplitude(analyser: AnalyserNode) {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  const sum = dataArray.reduce((a, b) => a + b, 0);
  return sum / dataArray.length; // Average volume
}

export function gaussian(x: number, a = 1, mu = 0, sigma = 1) {
  return a * Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2));
}
