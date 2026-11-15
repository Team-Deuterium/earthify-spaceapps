import React from "react";
import { RAMP_CSS } from "../lib/APIhelper";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

export function TimeSlider({
  dates,
  frameIndex,
  setFrameIndex,
  windowDays,
  setWindowDays,
  playing,
  setPlaying,
  speedMs,
  setSpeedMs,
  data,
  unit,
  showWind,
  status,
  readoutRef,
}) {
  const activeDate = dates[frameIndex] || "";
  const hasFrames = dates.length > 1;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-1000 w-[min(92vw,34rem)] rounded-xl border border-gray-800 bg-gray-900/95 backdrop-blur p-3 text-xs text-white shadow-lg space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!hasFrames}
            onClick={() => setPlaying((p) => !p)}
            className="rounded bg-blue-800 hover:bg-blue-700 disabled:opacity-40 px-2.5 py-1 font-medium"
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            disabled={frameIndex <= 0}
            onClick={() => {
              setPlaying(false);
              setFrameIndex((i) => Math.max(0, i - 1));
            }}
            className="rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 px-2 py-1"
          >
            <ArrowLeftIcon className="h-3 w-3" />
          </button>
          <button
            type="button"
            disabled={frameIndex >= dates.length - 1}
            onClick={() => {
              setPlaying(false);
              setFrameIndex((i) => Math.min(dates.length - 1, i + 1));
            }}
            className="rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 px-2 py-1"
          >
            <ArrowRightIcon className="h-3 w-3" />
          </button>
          <span className="ml-1 font-mono text-gray-200">{activeDate}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={windowDays}
            onChange={(e) => {
              setPlaying(false);
              setWindowDays(Number(e.target.value));
            }}
            className="rounded bg-gray-800 px-1.5 py-1 text-gray-200"
            title="Time slider window"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>

          <button
            type="button"
            onClick={() => setSpeedMs((s) => (s === 650 ? 300 : 650))}
            className="rounded bg-gray-800 hover:bg-gray-700 px-2 py-1 text-gray-300"
            title="Playback speed"
          >
            {speedMs === 300 ? "2x" : "1x"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-400">{dates[0]}</span>
        <input
          type="range"
          min={0}
          max={Math.max(0, dates.length - 1)}
          value={frameIndex}
          onChange={(e) => {
            setPlaying(false);
            setFrameIndex(Number(e.target.value));
          }}
          className="flex-1 cursor-pointer accent-blue-600"
        />
        <span className="text-[11px] text-gray-400">
          {dates[dates.length - 1]}
        </span>
      </div>

      {status ? (
        <div className="text-gray-300">{status}</div>
      ) : data ? (
        <div>
          <div className="h-2.5 rounded" style={{ background: RAMP_CSS }} />
          <div className="mt-1 flex justify-between text-[11px] text-gray-300">
            <span>{data.min.toFixed(1)}</span>
            <span>{unit}</span>
            <span>{data.max.toFixed(1)}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span ref={readoutRef} className="text-gray-200">
              Hover the overlay for values
            </span>
            <span className="text-gray-400">
              {data.step}° grid
              {showWind ? " · arrows show wind direction" : ""}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
