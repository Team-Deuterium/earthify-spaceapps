import React from "react";
import ViewfromISS from "../bg/ViewfromISS.jpg";
import { HeaderComp, Metric, AnalysisText } from "../comp/PageBoilerPlate";
import { TrendChart } from "../comp/PredictChart";
import { LocationSearch } from "../comp/LocationSearch";
import { useClimate } from "../context/ClimateContext";
import {
  PARAMS,
  isoDaysAgo,
  addDaysISO,
  daysBetweenISO,
  fetchHistory,
  predictTrend,
  predictSeasonal,
} from "../lib/APIhelper";

const MAX_DATA_DATE = isoDaysAgo(3);

export default function Predict() {
  const { primaryPlace, setPrimaryPlace } = useClimate();

  const [parameter, setParameter] = React.useState("T2M");
  const [modelType, setModelType] = React.useState("seasonal");
  const [horizonDays, setHorizonDays] = React.useState(30);
  const [startDate, setStartDate] = React.useState(
    addDaysISO(MAX_DATA_DATE, -4 * 365),
  );
  const [endDate, setEndDate] = React.useState(MAX_DATA_DATE);

  const [history, setHistory] = React.useState([]);
  const [resultPlace, setResultPlace] = React.useState(null);
  const [analysis, setAnalysis] = React.useState(null);
  const [status, setStatus] = React.useState(
    "Select a location or drop a pin on the Dashboard to generate a prediction.",
  );
  const [loading, setLoading] = React.useState(false);
  const requestController = React.useRef(null);

  React.useEffect(() => () => requestController.current?.abort(), []);

  function applyRangePreset(days) {
    setStartDate(addDaysISO(endDate, -days));
  }

  function handleModelChange(nextModel) {
    setModelType(nextModel);
    if (nextModel === "seasonal") {
      if (daysBetweenISO(startDate, endDate) < 365 * 3) {
        setStartDate(addDaysISO(endDate, -4 * 365));
      }
      if (horizonDays < 30) setHorizonDays(30);
    } else if (horizonDays > 30) {
      setHorizonDays(14);
    }
  }

  async function runPrediction(event) {
    event?.preventDefault();
    if (!primaryPlace) {
      setStatus(
        "Choose a location from suggestions or drop Pin 1 on the Dashboard.",
      );
      return;
    }
    if (startDate >= endDate) {
      setStatus("The start date must be earlier than the end date.");
      return;
    }

    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setLoading(true);
    setStatus("Retrieving historical NASA POWER data…");

    try {
      const result = await fetchHistory({
        param: parameter,
        lat: primaryPlace.lat,
        lng: primaryPlace.lng,
        start: startDate,
        end: endDate,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      const prediction =
        modelType === "seasonal"
          ? predictSeasonal(result, horizonDays)
          : predictTrend(result, horizonDays);

      if (!prediction) {
        setHistory([]);
        setAnalysis(null);
        setStatus("Not enough valid historical data to fit this model.");
        return;
      }

      setHistory(result);
      setAnalysis(prediction);
      setResultPlace(primaryPlace);
      setStatus(`Analysis complete · ${result.length} daily observations`);
    } catch (error) {
      if (error.name !== "AbortError") setStatus(error.message);
    } finally {
      if (requestController.current === controller) setLoading(false);
    }
  }

  const unit = PARAMS[parameter].unit;
  const firstValue = history[0]?.value;
  const latestValue = history[history.length - 1]?.value;
  const periodChange =
    firstValue == null || latestValue == null ? null : latestValue - firstValue;
  const forecastEnd = analysis?.forecast[analysis.forecast.length - 1];
  const daySpan = daysBetweenISO(startDate, endDate);

  return (
    <div
      className="min-h-screen px-5 py-8 text-white md:px-10"
      style={{
        backgroundImage: `url(${ViewfromISS})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto max-w-5xl">
        <HeaderComp
          headerText="Climate intelligence"
          title="Prediction & seasonal analysis"
          description="Explore historical NASA POWER observations with linear trend or 3–5 year least-squares seasonal harmonic models."
        />

        <form
          onSubmit={runPrediction}
          className="mb-6 grid gap-3 rounded-2xl border border-gray-800 bg-gray-900/95 p-4 md:grid-cols-6"
        >
          <div className="md:col-span-2">
            <LocationSearch
              label="Location (synced with Pin 1)"
              selected={primaryPlace}
              setSelected={setPrimaryPlace}
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Climate variable
              </label>
              <select
                value={parameter}
                onChange={(e) => setParameter(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
              >
                {Object.entries(PARAMS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Model & horizon
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={modelType}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-2 text-sm"
                >
                  <option value="seasonal">Seasonal + Trend</option>
                  <option value="linear">Linear Trend</option>
                </select>
                <select
                  value={horizonDays}
                  onChange={(e) => setHorizonDays(Number(e.target.value))}
                  className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-2 text-sm"
                >
                  <option value={14}>+14 days</option>
                  <option value={30}>+30 days</option>
                  <option value={90}>+90 days</option>
                  <option value={180}>+180 days</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3 md:col-span-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-gray-400">From</label>
                <input
                  type="date"
                  value={startDate}
                  min="1984-01-01"
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-2 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">To</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={MAX_DATA_DATE}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-2 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <span className="mb-1 block text-xs text-gray-400">
                History presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "90d", days: 90 },
                  { label: "1 yr", days: 365 },
                  { label: "3 yr", days: 3 * 365 },
                  { label: "4 yr", days: 4 * 365 },
                  { label: "5 yr", days: 5 * 365 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyRangePreset(preset.days)}
                    className="rounded border border-gray-700 bg-gray-800 hover:bg-gray-700 px-2.5 py-1 text-xs"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {modelType === "seasonal" && daySpan < 365 * 2 && (
            <p className="md:col-span-6 text-xs text-amber-400">
              Tip: Seasonal fitting works best with 3–5 years of history.
            </p>
          )}

          <button
            disabled={loading || !primaryPlace}
            className="rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-6"
          >
            {loading ? "Analyzing…" : "Generate prediction"}
          </button>
        </form>

        <div className="mb-5 text-xs text-gray-300" role="status">
          {status}
        </div>

        {analysis && (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Latest observed"
                value={`${latestValue.toFixed(1)} ${unit}`}
                detail={history[history.length - 1]?.date}
              />
              <Metric
                label={
                  analysis.modelType === "seasonal"
                    ? "Seasonal swing (±)"
                    : "Change over period"
                }
                value={
                  analysis.modelType === "seasonal"
                    ? `±${analysis.amplitude.toFixed(2)} ${unit}`
                    : `${periodChange > 0 ? "+" : ""}${periodChange.toFixed(1)} ${unit}`
                }
                detail={
                  analysis.modelType === "seasonal"
                    ? "Half peak-to-trough annual cycle"
                    : `${history[0]?.date} to ${history[history.length - 1]?.date}`
                }
              />
              <Metric
                label="Long-term trend"
                value={`${analysis.slopePerYear > 0 ? "+" : ""}${analysis.slopePerYear.toFixed(2)} ${unit}/yr`}
                detail={`${analysis.direction} (${analysis.slope.toFixed(4)} ${unit}/day)`}
              />
              <Metric
                label="Model fit (R²)"
                value={analysis.r2.toFixed(2)}
                detail={`RMSE ${analysis.rmse.toFixed(2)} ${unit}`}
              />
            </div>

            {analysis.statistics && (
              <section className="mb-5 rounded-2xl border border-gray-800 bg-gray-900 p-4 md:p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">Statistical trend significance</h2>
                  <p className="text-xs text-gray-400">
                    Tests the trend in monthly anomalies after removing each calendar month's average seasonal cycle.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric
                    label="Anomaly trend"
                    value={`${analysis.statistics.slopePerYear > 0 ? "+" : ""}${analysis.statistics.slopePerYear.toFixed(3)} ${unit}/yr`}
                    detail={`${analysis.statistics.sampleCount} monthly values`}
                  />
                  <Metric
                    label="Regression p-value"
                    value={analysis.statistics.pValue.toFixed(4)}
                    detail={analysis.statistics.significantAt05 ? "Below 0.05 threshold" : "Not below 0.05 threshold"}
                  />
                  <Metric
                    label="95% confidence interval"
                    value={`${analysis.statistics.confidence95[0].toFixed(3)} to ${analysis.statistics.confidence95[1].toFixed(3)}`}
                    detail={`${unit}/year`}
                  />
                  <Metric
                    label="Mann–Kendall p-value"
                    value={analysis.statistics.mannKendall ? analysis.statistics.mannKendall.pValue.toFixed(4) : "N/A"}
                    detail={analysis.statistics.mannKendall ? `Tau ${analysis.statistics.mannKendall.tau.toFixed(3)} · ${analysis.statistics.mannKendall.direction}` : "Insufficient monthly values"}
                  />
                </div>
                <p className={`mt-4 text-sm ${analysis.statistics.significantAt05 ? "text-emerald-300" : "text-amber-300"}`}>
                  {analysis.statistics.significantAt05
                    ? "The monthly-anomaly regression trend is statistically significant at the 5% level under ordinary least-squares assumptions."
                    : "The monthly-anomaly regression trend is not statistically significant at the 5% level under ordinary least-squares assumptions."}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-gray-400">
                  Important limitation: climate observations can be serially autocorrelated. These p-values and confidence intervals do not apply an autocorrelation correction, so treat them as exploratory rather than definitive evidence. The Mann–Kendall result is calculated on deseasonalized monthly anomalies.
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-gray-800 bg-gray-900 p-4 md:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">
                  Historical graph & {horizonDays}-day projection
                </h2>
                <p className="text-xs text-gray-500">
                  {resultPlace.displayName} · {PARAMS[parameter].label}
                </p>
              </div>
              <TrendChart
                rows={history}
                fitted={analysis.fitted}
                forecast={analysis.forecast}
                unit={unit}
                modelType={analysis.modelType}
              />
              <AnalysisText
                history={history}
                parameter={PARAMS[parameter].label.toLowerCase()}
                analysis={analysis}
                unit={unit}
                forecastEnd={forecastEnd}
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
