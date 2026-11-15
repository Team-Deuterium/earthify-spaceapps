import { addDaysISO, daysBetweenISO } from "./constants";
import { calculateTrendStatistics } from "./statistics";

const YEAR_DAYS = 365.25;

function summarizeMetrics(rows, fitted) {
  const n = rows.length;
  const mean = rows.reduce((s, r) => s + r.value, 0) / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i += 1) {
    ssTot += (rows[i].value - mean) ** 2;
    ssRes += (rows[i].value - fitted[i].value) ** 2;
  }
  const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
  const rmse = Math.sqrt(ssRes / n);
  return { r2, rmse };
}

export function predictTrend(rows, horizonDays = 14) {
  if (!rows || rows.length < 2) return null;
  const origin = rows[0].date;
  const t = rows.map((r) => daysBetweenISO(origin, r.date));
  const y = rows.map((r) => r.value);
  const n = rows.length;

  const meanT = t.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (t[i] - meanT) * (y[i] - meanY);
    den += (t[i] - meanT) ** 2;
  }
  if (den === 0) return null;

  const slope = num / den;
  const intercept = meanY - slope * meanT;
  const fitted = rows.map((r, i) => ({
    date: r.date,
    value: intercept + slope * t[i],
  }));
  const { r2, rmse } = summarizeMetrics(rows, fitted);

  const lastDate = rows[n - 1].date;
  const lastT = t[n - 1];
  const forecast = Array.from({ length: horizonDays }, (_, i) => {
    const step = i + 1;
    return {
      date: addDaysISO(lastDate, step),
      value: intercept + slope * (lastT + step),
    };
  });

  const direction =
    Math.abs(slope) < 0.0005 ? "stable" : slope > 0 ? "rising" : "falling";

  return {
    modelType: "linear",
    slope,
    slopePerYear: slope * YEAR_DAYS,
    intercept,
    r2,
    rmse,
    direction,
    fitted,
    forecast,
    statistics: calculateTrendStatistics(rows),
  };
}

export function predictSeasonal(rows, horizonDays = 30) {
  if (!rows || rows.length < 12) return null;
  const origin = rows[0].date;
  const omega = (2 * Math.PI) / YEAR_DAYS;
  const A = Array.from({ length: 4 }, () => Array(4).fill(0));
  const b = Array(4).fill(0);

  const times = rows.map((r) => daysBetweenISO(origin, r.date));
  for (let idx = 0; idx < rows.length; idx += 1) {
    const t = times[idx];
    const y = rows[idx].value;
    const basis = [1, t / YEAR_DAYS, Math.sin(omega * t), Math.cos(omega * t)];
    for (let i = 0; i < 4; i += 1) {
      b[i] += basis[i] * y;
      for (let j = 0; j < 4; j += 1) A[i][j] += basis[i] * basis[j];
    }
  }

  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < 4; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < 4; r += 1) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-10) return null;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = col + 1; r < 4; r += 1) {
      const factor = M[r][col] / M[col][col];
      for (let c = col; c <= 4; c += 1) M[r][c] -= factor * M[col][c];
    }
  }

  const beta = Array(4).fill(0);
  for (let r = 3; r >= 0; r -= 1) {
    let sum = M[r][4];
    for (let c = r + 1; c < 4; c += 1) sum -= M[r][c] * beta[c];
    beta[r] = sum / M[r][r];
  }

  const [intercept, slopePerYear, sinCoeff, cosCoeff] = beta;
  const evalAt = (t) =>
    intercept +
    slopePerYear * (t / YEAR_DAYS) +
    sinCoeff * Math.sin(omega * t) +
    cosCoeff * Math.cos(omega * t);

  const fitted = rows.map((r, i) => ({ date: r.date, value: evalAt(times[i]) }));
  const { r2, rmse } = summarizeMetrics(rows, fitted);
  const lastDate = rows[rows.length - 1].date;
  const lastT = times[times.length - 1];
  const forecast = Array.from({ length: horizonDays }, (_, i) => ({
    date: addDaysISO(lastDate, i + 1),
    value: evalAt(lastT + i + 1),
  }));

  const amplitude = Math.hypot(sinCoeff, cosCoeff);
  const direction =
    Math.abs(slopePerYear) < 0.05
      ? "stable"
      : slopePerYear > 0
        ? "rising"
        : "falling";

  return {
    modelType: "seasonal",
    intercept,
    slope: slopePerYear / YEAR_DAYS,
    slopePerYear,
    sinCoeff,
    cosCoeff,
    amplitude,
    r2,
    rmse,
    direction,
    fitted,
    forecast,
    statistics: calculateTrendStatistics(rows),
  };
}
