import React from "react";
import { PARAMS, isoDaysAgo } from "../lib/APIhelper";

export function DashboardControls({
  param,
  setParam,
  endDate,
  setEndDate,
  mode,
  setMode,
  onWorld,
  placeQuery,
  setPlaceQuery,
  onSearch,
  showWind,
  setShowWind,
  opacity,
  setOpacity,
  activeSlot,
  setActiveSlot,
  hasPins,
  onSwapPins,
  onClearPins,
}) {
  return (
    <form
      onSubmit={onSearch}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 flex max-w-[92vw] flex-wrap items-center justify-center gap-2 rounded-xl border border-gray-800 bg-gray-900/95 backdrop-blur px-3 py-2 text-xs text-white shadow-lg"
    >
      <select
        value={param}
        onChange={(e) => setParam(e.target.value)}
        className="rounded bg-gray-800 px-2 py-1"
      >
        {Object.entries(PARAMS).map(([k, p]) => (
          <option key={k} value={k}>
            {p.label}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={endDate}
        min="1984-01-01"
        max={isoDaysAgo(2)}
        onChange={(e) => setEndDate(e.target.value)}
        className="rounded bg-gray-800 px-2 py-1"
      />

      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="rounded bg-gray-800 px-2 py-1"
      >
        <option value="pin">Around pin</option>
        <option value="view">Current view</option>
      </select>

      <button
        type="button"
        onClick={onWorld}
        className="rounded bg-gray-700 hover:bg-gray-600 px-2 py-1"
      >
        World
      </button>

      <div className="flex items-center gap-1">
        <input
          value={placeQuery}
          onChange={(e) => setPlaceQuery(e.target.value)}
          placeholder="Search a place…"
          className="w-32 sm:w-40 rounded bg-gray-800 px-2 py-1"
        />
        <button className="rounded bg-blue-900 hover:bg-blue-800 px-2 py-1">
          Go
        </button>
      </div>

      <div className="flex items-center gap-1 rounded bg-gray-800 p-0.5">
        <span className="px-1 text-gray-400">Pin:</span>
        {[
          { id: "auto", label: "Auto" },
          { id: "A", label: "1 (A)" },
          { id: "B", label: "2 (B)" },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setActiveSlot(opt.id)}
            className={`rounded px-1.5 py-0.5 ${
              activeSlot === opt.id
                ? "bg-blue-800 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {hasPins && (
          <>
            <button
              type="button"
              onClick={onSwapPins}
              title="Swap Pin 1 and Pin 2"
              className="rounded px-1.5 py-0.5 text-gray-300 hover:bg-gray-700"
            >
              ⇄
            </button>
            <button
              type="button"
              onClick={onClearPins}
              title="Clear pins"
              className="rounded px-1.5 py-0.5 text-gray-400 hover:text-red-300"
            >
              ✕
            </button>
          </>
        )}
      </div>

      <label className="flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          checked={showWind}
          onChange={(e) => setShowWind(e.target.checked)}
        />
        Wind
      </label>

      <label className="flex items-center gap-1.5">
        <span>Opacity</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={opacity}
          onChange={(e) => setOpacity(+e.target.value)}
          style={{
            background: `linear-gradient(to right, #1e40af ${opacity * 100}%, #374151 ${opacity * 100}%)`,
          }}
          className="w-16 appearance-none bg-gray-700 h-1.5 rounded-lg cursor-pointer accent-blue-900"
        />
      </label>
    </form>
  );
}
