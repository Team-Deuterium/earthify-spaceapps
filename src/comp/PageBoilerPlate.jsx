const HeaderComp = ({ headerText, title, description }) => {
  return (
    <header className="mb-7">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-500">
        {headerText}
      </p>
      <h1 className="mt-2 text-3xl font-bold">{title}</h1>
      <p className="mt-2 w-fit p-1.5 text-sm text-gray-400 bg-black/80 rounded-lg">
        {description}
      </p>
    </header>
  );
};

const Metric = ({ label, value, detail }) => {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-2 wrap-break-word text-2xl font-semibold">{value}</p>
      {detail && <p className="mt-1 text-xs text-gray-500">{detail}</p>}
    </div>
  );
};

const AnalysisText = ({ history, parameter, analysis, unit, forecastEnd }) => {
  const isSeasonal = analysis.modelType === "seasonal";

  return (
    <div className="mt-6 rounded-xl bg-gray-800/70 p-4">
      <h3 className="text-sm font-semibold">Analysis</h3>
      <p className="mt-2 text-sm leading-6 text-gray-300">
        Across {history.length} valid daily observations, {parameter}{" "}
        {isSeasonal ? (
          <>
            shows an underlying linear trend that is {analysis.direction} at{" "}
            {analysis.slopePerYear.toFixed(3)} {unit}/year alongside a fitted
            annual cycle with ±{analysis.amplitude.toFixed(2)} {unit} seasonal
            amplitude. The least-squares seasonal + trend model explains{" "}
            {(analysis.r2 * 100).toFixed(1)}% of historical variance (RMSE{" "}
            {analysis.rmse.toFixed(2)} {unit}).
          </>
        ) : (
          <>
            shows a linear trend that is {analysis.direction}. The fitted slope
            is {analysis.slope.toFixed(4)} {unit} per day, and the model
            explains {(analysis.r2 * 100).toFixed(1)}% of the variation in the
            selected period.
          </>
        )}{" "}
        Projected value on {forecastEnd.date} is approximately{" "}
        {forecastEnd.value.toFixed(2)} {unit}.
      </p>
      <p className="mt-2 text-xs leading-5 text-gray-500">
        This is a statistical extrapolation of historical NASA POWER data, not
        an official weather forecast. It does not capture sudden extreme
        weather events or multi-year climate oscillations.
      </p>
    </div>
  );
};

export { HeaderComp, Metric, AnalysisText };
