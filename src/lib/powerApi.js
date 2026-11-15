const historyCache = new Map();
const pointGridCache = new Map();

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const toCompact = (iso) => iso.replaceAll("-", "");
const fromCompact = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

export function pinView(lat, lng, radius = 6) {
  return {
    south: clamp(lat - radius, -85, 85),
    north: clamp(lat + radius, -85, 85),
    west: clamp(lng - radius, -180, 180),
    east: clamp(lng + radius, -180, 180),
  };
}

async function fetchPowerPoint({ params, lat, lng, start, end, signal }) {
  const rLat = Number(lat.toFixed(3));
  const rLng = Number(lng.toFixed(3));
  const key = `${params.join(",")}|${rLat}|${rLng}|${start}|${end}`;
  if (pointGridCache.has(key)) return pointGridCache.get(key);

  const url =
    `https://power.larc.nasa.gov/api/temporal/daily/point` +
    `?parameters=${params.join(",")}` +
    `&community=RE&longitude=${rLng}&latitude=${rLat}` +
    `&start=${toCompact(start)}&end=${toCompact(end)}&format=JSON`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`NASA POWER request failed (${res.status}).`);
  }
  const json = await res.json();
  const parameterMap = json?.properties?.parameter || {};
  pointGridCache.set(key, parameterMap);
  return parameterMap;
}

export async function fetchHistory({ param, lat, lng, start, end, signal }) {
  const key = `${param}|${lat.toFixed(3)}|${lng.toFixed(3)}|${start}|${end}`;
  if (historyCache.has(key)) return historyCache.get(key);

  const parameterMap = await fetchPowerPoint({
    params: [param],
    lat,
    lng,
    start,
    end,
    signal,
  });

  const series = parameterMap[param] || {};
  const rows = Object.entries(series)
    .filter(([, v]) => typeof v === "number" && v > -900)
    .map(([compactDate, value]) => ({
      date: fromCompact(compactDate),
      value,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  historyCache.set(key, rows);
  return rows;
}

function chooseStep(view) {
  const latSpan = Math.max(1, view.north - view.south);
  const lngSpan = Math.max(1, view.east - view.west);
  const candidates = [1, 2, 5, 10, 20];
  for (const step of candidates) {
    const nx = Math.floor(lngSpan / step) + 1;
    const ny = Math.floor(latSpan / step) + 1;
    if (nx * ny <= 30) return step;
  }
  return 20;
}

function buildGridCoords(view, step) {
  const south = clamp(Math.floor(view.south / step) * step, -85, 85);
  const north = clamp(Math.ceil(view.north / step) * step, -85, 85);
  const west = clamp(Math.floor(view.west / step) * step, -179, 179);
  const east = clamp(Math.ceil(view.east / step) * step, -179, 179);

  const coords = [];
  for (let lat = south; lat <= north + 1e-6; lat += step) {
    for (let lng = west; lng <= east + 1e-6; lng += step) {
      coords.push({ lat: Number(lat.toFixed(2)), lng: Number(lng.toFixed(2)) });
    }
  }
  return coords;
}

export async function fetchGridSeries({
  param,
  startDate,
  endDate,
  view,
  wind = false,
  signal,
  onProgress,
}) {
  const step = chooseStep(view);
  const coords = buildGridCoords(view, step);
  const params = wind ? [param, "WS10M", "WD10M"] : [param];
  const byDate = {};

  let done = 0;
  let cursor = 0;
  const concurrency = 4;

  async function worker() {
    while (cursor < coords.length) {
      if (signal?.aborted) return;
      const idx = cursor++;
      const { lat, lng } = coords[idx];
      try {
        const map = await fetchPowerPoint({
          params,
          lat,
          lng,
          start: startDate,
          end: endDate,
          signal,
        });
        const valSeries = map[param] || {};
        const wsSeries = map.WS10M || {};
        const wdSeries = map.WD10M || {};

        for (const [compactDate, value] of Object.entries(valSeries)) {
          if (typeof value !== "number" || value <= -900) continue;
          const iso = fromCompact(compactDate);
          if (!byDate[iso]) byDate[iso] = [];
          const ws = wsSeries[compactDate];
          const wd = wdSeries[compactDate];
          byDate[iso].push({
            lat,
            lng,
            value,
            wind:
              wind &&
              typeof ws === "number" &&
              ws > -900 &&
              typeof wd === "number" &&
              wd > -900
                ? { speed: ws, dir: wd }
                : undefined,
          });
        }
      } catch (err) {
        if (err.name === "AbortError") throw err;
      } finally {
        done += 1;
        onProgress?.(done, coords.length);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, coords.length) }, worker),
  );

  return { step, byDate };
}

export async function fetchData({
  param,
  date,
  view,
  wind = false,
  signal,
  onProgress,
}) {
  const { step, byDate } = await fetchGridSeries({
    param,
    startDate: date,
    endDate: date,
    view,
    wind,
    signal,
    onProgress,
  });
  return { step, cells: byDate[date] || [] };
}
