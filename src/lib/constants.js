export const PARAMS = {
  T2M: { label: "Temperature (2m)", unit: "°C" },
  T2M_MAX: { label: "Max temperature (2m)", unit: "°C" },
  T2M_MIN: { label: "Min temperature (2m)", unit: "°C" },
  PRECTOTCORR: { label: "Precipitation", unit: "mm/day" },
  RH2M: { label: "Relative humidity", unit: "%" },
  ALLSKY_SFC_SW_DWN: { label: "Solar irradiance", unit: "kWh/m²/day" },
  WS10M: { label: "Wind speed (10m)", unit: "m/s" },
};

export const RAMP = [
  [0.0, [30, 58, 138]],
  [0.25, [37, 99, 235]],
  [0.5, [16, 185, 129]],
  [0.75, [245, 158, 11]],
  [1.0, [220, 38, 38]],
];

export const RAMP_CSS = `linear-gradient(to right, ${RAMP.map(
  ([stop, [r, g, b]]) => `rgb(${r},${g},${b}) ${stop * 100}%`,
).join(", ")})`;

export const toISO = (date) => date.toISOString().slice(0, 10);

export const isoDaysAgo = (days) =>
  toISO(new Date(Date.now() - days * 86400000));

export function parseUTCDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDaysISO(iso, days) {
  return toISO(new Date(parseUTCDate(iso) + days * 86400000));
}

export function daysBetweenISO(startIso, endIso) {
  return Math.round((parseUTCDate(endIso) - parseUTCDate(startIso)) / 86400000);
}

export function buildDateRange(endIso, count) {
  const dates = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    dates.push(addDaysISO(endIso, -i));
  }
  return dates;
}
