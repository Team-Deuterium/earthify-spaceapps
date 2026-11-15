export function TrendChart({ rows, fitted = [], forecast, unit, modelType }) {
  const width = 900;
  const height = 340;
  const padding = { top: 24, right: 24, bottom: 42, left: 66 };
  const allValues = [
    ...rows.map((r) => r.value),
    ...fitted.map((r) => r.value),
    ...forecast.map((r) => r.value),
  ];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const span = max - min || 1;
  const total = rows.length + forecast.length;

  const x = (index) =>
    padding.left +
    (index / Math.max(total - 1, 1)) * (width - padding.left - padding.right);
  const y = (value) =>
    height -
    padding.bottom -
    ((value - min) / span) * (height - padding.top - padding.bottom);

  const actualPoints = rows
    .map((item, index) => `${x(index)},${y(item.value)}`)
    .join(" ");
  const fittedPoints = fitted
    .map((item, index) => `${x(index)},${y(item.value)}`)
    .join(" ");

  const anchorValue =
    fitted.length > 0
      ? fitted[fitted.length - 1].value
      : rows[rows.length - 1].value;
  const predictedPoints = [
    `${x(rows.length - 1)},${y(anchorValue)}`,
    ...forecast.map(
      (item, index) => `${x(rows.length + index)},${y(item.value)}`,
    ),
  ].join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-162.5"
        role="img"
        aria-label="Historical climate observations and trend projection"
      >
        {[0, 1, 2, 3, 4].map((tick) => {
          const value = min + (span * tick) / 4;
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

        <line
          x1={x(rows.length - 1)}
          x2={x(rows.length - 1)}
          y1={padding.top}
          y2={height - padding.bottom}
          stroke="#f59e0b"
          strokeDasharray="5 5"
        />

        <polyline
          points={actualPoints}
          fill="none"
          stroke="#60a5fa"
          strokeOpacity="0.85"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {fittedPoints && (
          <polyline
            points={fittedPoints}
            fill="none"
            stroke="#34d399"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}

        <polyline
          points={predictedPoints}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.5"
          strokeDasharray="7 5"
          strokeLinejoin="round"
        />

        <text x={padding.left} y={height - 12} fill="#9ca3af" fontSize="11">
          {rows[0]?.date}
        </text>
        <text
          x={width - padding.right}
          y={height - 12}
          textAnchor="end"
          fill="#9ca3af"
          fontSize="11"
        >
          {forecast[forecast.length - 1]?.date}
        </text>
        <text x={padding.left} y="14" fill="#9ca3af" fontSize="11">
          {unit}
        </text>
      </svg>

      <div className="mt-2 flex flex-wrap gap-5 text-xs text-gray-400">
        <span>
          <i className="mr-2 inline-block h-0.5 w-5 bg-blue-400 align-middle" />
          Historical observations
        </span>
        {fittedPoints && (
          <span>
            <i className="mr-2 inline-block h-0.5 w-5 bg-emerald-400 align-middle" />
            {modelType === "seasonal"
              ? "Fitted seasonal + trend curve"
              : "Fitted linear trend"}
          </span>
        )}
        <span>
          <i className="mr-2 inline-block h-0.5 w-5 border-t-2 border-dashed border-amber-400 align-middle" />
          {modelType === "seasonal"
            ? "Seasonal harmonic projection"
            : "Linear trend projection"}
        </span>
      </div>
    </div>
  );
}
