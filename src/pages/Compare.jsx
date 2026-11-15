import React from "react";
import EarthbehindMoon from "../bg/EarthbehindMoon.jpg";
import { PARAMS, fetchHistory } from "../lib/APIhelper";
import { HeaderComp } from "../comp/PageBoilerPlate";
import { LocationSearch } from "../comp/LocationSearch";
import CompareAnalysis from "../comp/CompareAnalysis";
import { getStats } from "../comp/CompareStat";
import { useClimate } from "../context/ClimateContext";

const toISO = (date) => date.toISOString().slice(0, 10);
const MAX_DATE = toISO(new Date(Date.now() - 3 * 86400000));
const DEFAULT_START = toISO(new Date(Date.now() - 90 * 86400000));

export default function Compare() {
  const {
    primaryPlace: locationA,
    setPrimaryPlace: setLocationA,
    secondaryPlace: locationB,
    setSecondaryPlace: setLocationB,
    swapPlaces,
  } = useClimate();

  const [parameter, setParameter] = React.useState("T2M");
  const [startDate, setStartDate] = React.useState(DEFAULT_START);
  const [endDate, setEndDate] = React.useState(MAX_DATE);
  const [comparison, setComparison] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const requestController = React.useRef(null);

  React.useEffect(() => () => requestController.current?.abort(), []);

  async function handleCompare(event) {
    event.preventDefault();
    if (!locationA || !locationB) {
      setError("Select both locations or drop Pin 1 & Pin 2 on the Dashboard.");
      return;
    }
    if (startDate >= endDate) {
      setError("The start date must be earlier than the end date.");
      return;
    }

    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;

    setLoading(true);
    setError("");
    setComparison(null);

    try {
      const [rowsA, rowsB] = await Promise.all([
        fetchHistory({
          param: parameter,
          lat: locationA.lat,
          lng: locationA.lng,
          start: startDate,
          end: endDate,
          signal: controller.signal,
        }),
        fetchHistory({
          param: parameter,
          lat: locationB.lat,
          lng: locationB.lng,
          start: startDate,
          end: endDate,
          signal: controller.signal,
        }),
      ]);

      if (controller.signal.aborted) return;
      if (rowsA.length < 2 || rowsB.length < 2) {
        throw new Error(
          "Not enough historical data was found for one or both locations.",
        );
      }

      setComparison({
        first: { place: locationA, rows: rowsA, stats: getStats(rowsA) },
        second: { place: locationB, rows: rowsB, stats: getStats(rowsB) },
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Unable to retrieve comparison data.");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  const parameterInfo = PARAMS[parameter];
  const status = loading
    ? "Retrieving historical climate data…"
    : error ||
      "Locations stay synced with Dashboard Pin 1 & Pin 2. Requests are cached.";

  return (
    <div
      className="min-h-screen px-5 py-8 text-white md:px-10"
      style={{
        backgroundImage: `url(${EarthbehindMoon})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto max-w-5xl">
        <HeaderComp
          headerText="Climate analysis"
          title="Compare locations"
          description="Compare historical climate observations between two locations using NASA POWER data."
        />

        <form
          onSubmit={handleCompare}
          className="mb-6 grid gap-3 rounded-2xl border border-gray-800 bg-gray-900/95 p-4 md:grid-cols-6"
        >
          <div className="md:col-span-3">
            <LocationSearch
              label="Location A (Pin 1)"
              selected={locationA}
              setSelected={setLocationA}
            />
          </div>

          <div className="md:col-span-3">
            <LocationSearch
              label="Location B (Pin 2)"
              selected={locationB}
              setSelected={setLocationB}
            />
          </div>

          <div className="md:col-span-2">
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

          <div className="md:col-span-2">
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

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-gray-400">To</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={MAX_DATE}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-2 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2 md:col-span-6">
            <button
              type="button"
              onClick={swapPlaces}
              disabled={!locationA && !locationB}
              className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700 disabled:opacity-40"
            >
              Swap A ↔ B
            </button>
            <button
              disabled={loading || !locationA || !locationB}
              className="flex-1 rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Comparing…" : "Compare locations"}
            </button>
          </div>
        </form>

        <div
          className={`mb-5 text-xs ${error && !loading ? "text-red-400" : "text-gray-300"}`}
          role={error && !loading ? "alert" : "status"}
        >
          {status}
        </div>

        {comparison && (
          <CompareAnalysis
            startDate={startDate}
            endDate={endDate}
            parameterInfo={parameterInfo}
            comparison={comparison}
          />
        )}
      </div>
    </div>
  );
}
