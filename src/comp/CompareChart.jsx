import React from "react";
export { LocationSearch } from "./LocationSearch";

function ComparisonChart({ first, second, unit }) {
  const width = 900;
  const height = 350;
  const padding = { top: 25, bottom: 45, left: 65, right: 25 };

  const allRows = [...first.rows, ...second.rows];
  const min = Math.min(...allRows.map((row) => row.value));
  const max = Math.max(...allRows.map((row) => row.value));
  const range = max - min || 1;
  const dates = [...new Set(allRows.map((row) => row.date))].sort();

  const x = (date) => {
    const index = dates.indexOf(date);
    return (
      padding.left +
      (index / Math.max(dates.length - 1, 1)) *
        (width - padding.left - padding.right)
    );
  };

  const y = (value) =>
    height -
    padding.bottom -
    ((value - min) / range) * (height - padding.top - padding.bottom);

  const makePoints = (rows) =>
    rows.map((row) => `${x(row.date)},${y(row.value)}`).join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-162.5">
        {[0, 1, 2, 3, 4].map((tick) => {
          const value = min + (range * tick) / 4;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y(value)}
                y2={y(value)}
                stroke="#374151"
                strokeDasharray="4 5"
              />
              <text
                x={padding.left - 10}
                y={y(value) + 4}
                textAnchor="end"
                fill="#9ca3af"
                fontSize="11"
              >
                {value.toFixed(1)}
              </text>
            </g>
          );
        })}

        <polyline
          points={makePoints(first.rows)}
          fill="none"
          stroke="#60a5fa"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polyline
          points={makePoints(second.rows)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <text x={padding.left} y={height - 12} fill="#9ca3af" fontSize="11">
          {dates[0]}
        </text>
        <text
          x={width - padding.right}
          y={height - 12}
          textAnchor="end"
          fill="#9ca3af"
          fontSize="11"
        >
          {dates[dates.length - 1]}
        </text>
        <text x={padding.left} y="14" fill="#9ca3af" fontSize="11">
          {unit}
        </text>
      </svg>

      <div className="mt-2 flex flex-wrap gap-5 text-xs text-gray-400">
        <span>
          <i className="mr-2 inline-block h-0.5 w-5 bg-blue-400 align-middle" />
          {first.place.name}
        </span>
        <span>
          <i className="mr-2 inline-block h-0.5 w-5 bg-amber-400 align-middle" />
          {second.place.name}
        </span>
      </div>
    </div>
  );
}

export { ComparisonChart };
