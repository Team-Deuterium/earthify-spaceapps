import { RAMP } from "./constants";

function sampleColor(t) {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < RAMP.length - 1; i += 1) {
    const [t0, c0] = RAMP[i];
    const [t1, c1] = RAMP[i + 1];
    if (clamped >= t0 && clamped <= t1) {
      const f = (clamped - t0) / (t1 - t0 || 1);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * f),
        Math.round(c0[1] + (c1[1] - c0[1]) * f),
        Math.round(c0[2] + (c1[2] - c0[2]) * f),
      ];
    }
  }
  return RAMP[RAMP.length - 1][1];
}

export function buildRaster(cells, step) {
  if (!cells || cells.length === 0) return null;

  let min = Infinity;
  let max = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const c of cells) {
    if (c.value < min) min = c.value;
    if (c.value > max) max = c.value;
    if (c.lat < minLat) minLat = c.lat;
    if (c.lat > maxLat) maxLat = c.lat;
    if (c.lng < minLng) minLng = c.lng;
    if (c.lng > maxLng) maxLng = c.lng;
  }

  const south = Math.max(-90, minLat - step / 2);
  const north = Math.min(90, maxLat + step / 2);
  const west = Math.max(-180, minLng - step / 2);
  const east = Math.min(180, maxLng + step / 2);

  const width = 96;
  const height = 96;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(width, height);
  const span = max - min || 1;
  const maxDistSq = (step * 1.6) ** 2;

  for (let py = 0; py < height; py += 1) {
    const lat = north - ((py + 0.5) / height) * (north - south);
    for (let px = 0; px < width; px += 1) {
      const lng = west + ((px + 0.5) / width) * (east - west);

      let weightSum = 0;
      let valSum = 0;
      for (const c of cells) {
        const dSq = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
        if (dSq < 1e-6) {
          weightSum = 1;
          valSum = c.value;
          break;
        }
        if (dSq <= maxDistSq) {
          const w = 1 / dSq;
          weightSum += w;
          valSum += w * c.value;
        }
      }

      const offset = (py * width + px) * 4;
      if (weightSum === 0) {
        img.data[offset + 3] = 0;
      } else {
        const [r, g, b] = sampleColor((valSum / weightSum - min) / span);
        img.data[offset] = r;
        img.data[offset + 1] = g;
        img.data[offset + 2] = b;
        img.data[offset + 3] = 220;
      }
    }
  }

  ctx.putImageData(img, 0, 0);

  return {
    url: canvas.toDataURL(),
    bounds: [
      [south, west],
      [north, east],
    ],
    min,
    max,
    step,
    nodes: cells,
  };
}

export function probe(data, lat, lng) {
  if (!data || !data.nodes?.length) return null;
  const [[south, west], [north, east]] = data.bounds;
  if (lat < south || lat > north || lng < west || lng > east) return null;

  let best = null;
  let bestDist = Infinity;
  let wSum = 0;
  let vSum = 0;
  const maxDistSq = (data.step * 1.5) ** 2;

  for (const node of data.nodes) {
    const dSq = (node.lat - lat) ** 2 + (node.lng - lng) ** 2;
    if (dSq < bestDist) {
      bestDist = dSq;
      best = node;
    }
    if (dSq < 1e-6) return { value: node.value, wind: node.wind };
    if (dSq <= maxDistSq) {
      const w = 1 / dSq;
      wSum += w;
      vSum += w * node.value;
    }
  }

  if (!best || wSum === 0) return null;
  return { value: vSum / wSum, wind: best.wind };
}
