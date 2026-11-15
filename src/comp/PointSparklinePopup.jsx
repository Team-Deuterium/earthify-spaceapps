/* eslint-disable react-hooks/set-state-in-effect */
import React from "react";
import { useNavigate } from "react-router";
import { addDaysISO, fetchHistory, PARAMS } from "../lib/APIhelper";

function Sparkline({ rows }) {
  const width = 220;
  const height = 64;
  const pad = 6;
  const values = rows.map((r) => r.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const points = rows
    .map((r, i) => {
      const x = pad + (i / Math.max(rows.length - 1, 1)) * (width - pad * 2);
      const y = height - pad - ((r.value - min) / span) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16">
      <polyline
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

export function PointSparklinePopup({
  place,
  slotLabel,
  param,
  endDate,
  onSetSlot,
  canCompare,
}) {
  const navigate = useNavigate();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!place) return undefined;
    const ctrl = new AbortController();
    setLoading(true);
    setError("");

    fetchHistory({
      param,
      lat: place.lat,
      lng: place.lng,
      start: addDaysISO(endDate, -29),
      end: endDate,
      signal: ctrl.signal,
    })
      .then((res) => {
        if (!ctrl.signal.aborted) setRows(res);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [place.lat, place.lng, param, endDate, place]);

  const unit = PARAMS[param]?.unit || "";
  const values = rows.map((r) => r.value);
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;
  const latest = values.length ? values[values.length - 1] : null;

  const stop = (e) => e.stopPropagation();

  return (
    <div className="w-60 text-gray-900 space-y-2" onClick={stop}>
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm truncate">{place.name}</span>
          <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold">
            {slotLabel}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 truncate">
          {place.country} · {place.lat.toFixed(2)}, {place.lng.toFixed(2)}
        </p>
      </div>

      <div className="rounded border border-gray-200 bg-gray-50 p-2">
        <p className="text-[10px] font-medium text-gray-500 mb-1">
          Last 30 days · {PARAMS[param]?.label}
        </p>
        {loading ? (
          <p className="text-xs text-gray-500 py-4 text-center">
            Loading 30-day sparkline…
          </p>
        ) : error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : rows.length < 2 ? (
          <p className="text-xs text-gray-500">No observations available.</p>
        ) : (
          <>
            <Sparkline rows={rows} />
            <div className="mt-1 flex justify-between text-[10px] text-gray-600">
              <span>Min {min.toFixed(1)}</span>
              <span>
                Now {latest.toFixed(1)} {unit}
              </span>
              <span>Max {max.toFixed(1)}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            onSetSlot?.();
            navigate("/predict");
          }}
          className="flex-1 rounded bg-blue-700 hover:bg-blue-800 px-2 py-1 text-[11px] font-medium text-white"
        >
          Predict →
        </button>
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            navigate("/compare");
          }}
          className="flex-1 rounded bg-amber-600 hover:bg-amber-700 px-2 py-1 text-[11px] font-medium text-white"
        >
          {canCompare ? "Compare →" : "Set B & Compare"}
        </button>
      </div>
    </div>
  );
}
