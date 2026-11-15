const YEAR_DAYS = 365.25;

// Abramowitz-Stegun approximation to the standard normal CDF.
function normalCdf(z) {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function monthlyAnomalies(rows) {
  const buckets = new Map();
  for (const row of rows) {
    const month = row.date.slice(5, 7);
    if (!buckets.has(month)) buckets.set(month, []);
    buckets.get(month).push(row.value);
  }
  const monthMeans = new Map([...buckets].map(([month, values]) => [month, mean(values)]));
  const monthly = new Map();
  for (const row of rows) {
    const month = row.date.slice(5, 7);
    const key = row.date.slice(0, 7);
    if (!monthly.has(key)) monthly.set(key, []);
    monthly.get(key).push(row.value - monthMeans.get(month));
  }
  return [...monthly.entries()]
    .map(([month, values]) => ({ date: `${month}-15`, value: mean(values) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function mannKendall(values) {
  const n = values.length;
  if (n < 8) return null;
  let score = 0;
  const ties = new Map();
  for (let i = 0; i < n - 1; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      score += Math.sign(values[j] - values[i]);
    }
  }
  for (const value of values) ties.set(value, (ties.get(value) || 0) + 1);
  let tieTerm = 0;
  for (const count of ties.values()) tieTerm += count * (count - 1) * (2 * count + 5);
  const variance = (n * (n - 1) * (2 * n + 5) - tieTerm) / 18;
  if (variance <= 0) return { tau: 0, z: 0, pValue: 1, direction: "no trend" };
  const z = score > 0 ? (score - 1) / Math.sqrt(variance) : score < 0 ? (score + 1) / Math.sqrt(variance) : 0;
  const pValue = Math.min(1, 2 * (1 - normalCdf(Math.abs(z))));
  return {
    tau: (2 * score) / (n * (n - 1)),
    z,
    pValue,
    direction: score > 0 ? "rising" : score < 0 ? "falling" : "no trend",
  };
}

/**
 * Trend inference on monthly anomalies (calendar-month means removed).
 * The slope t-test and 95% CI use ordinary least squares assumptions.
 * Daily/monthly climate data can be autocorrelated, so interpret p-values
 * cautiously; this implementation does not apply an autocorrelation correction.
 */
export function calculateTrendStatistics(rows) {
  const monthly = monthlyAnomalies((rows || []).filter((row) => Number.isFinite(row.value)));
  if (monthly.length < 24) return null;

  const origin = Date.parse(`${monthly[0].date}T00:00:00Z`);
  const x = monthly.map((row) => (Date.parse(`${row.date}T00:00:00Z`) - origin) / 86400000 / YEAR_DAYS);
  const y = monthly.map((row) => row.value);
  const xBar = mean(x);
  const yBar = mean(y);
  const sxx = x.reduce((sum, value) => sum + (value - xBar) ** 2, 0);
  if (sxx === 0) return null;
  const slope = x.reduce((sum, value, i) => sum + (value - xBar) * (y[i] - yBar), 0) / sxx;
  const intercept = yBar - slope * xBar;
  const residuals = y.map((value, i) => value - (intercept + slope * x[i]));
  const sse = residuals.reduce((sum, value) => sum + value ** 2, 0);
  const degreesFreedom = monthly.length - 2;
  const standardError = Math.sqrt((sse / degreesFreedom) / sxx);
  const tStatistic = standardError > 0 ? slope / standardError : 0;
  const pValue = Math.min(1, 2 * (1 - normalCdf(Math.abs(tStatistic))));
  const margin = 1.96 * standardError;
  const mk = mannKendall(y);

  return {
    method: "OLS trend on monthly anomalies",
    sampleCount: monthly.length,
    slopePerYear: slope,
    standardError,
    tStatistic,
    degreesFreedom,
    pValue,
    confidence95: [slope - margin, slope + margin],
    mannKendall: mk,
    significantAt05: pValue < 0.05,
    caveat: "Monthly anomalies remove the average seasonal cycle. Standard errors and p-values do not correct for serial autocorrelation; treat significance as exploratory.",
  };
}
