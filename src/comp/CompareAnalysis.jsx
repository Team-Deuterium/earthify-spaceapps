import { ComparisonChart } from "./CompareChart";
import { Metric } from "./PageBoilerPlate";

const CompareAnalysis = ({ startDate, endDate, parameterInfo, comparison }) => {
  const formatValue = (value) => `${value.toFixed(2)} ${parameterInfo.unit}`;
  const { first, second } = comparison;
  const label = parameterInfo.label.toLowerCase();

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Historical comparison</h2>
          <p className="text-xs text-gray-500">
            {startDate} to {endDate} · {parameterInfo.label}
          </p>
        </div>

        <ComparisonChart first={first} second={second} unit={parameterInfo.unit} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {[first, second].map((item, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-800 bg-gray-900 p-4 md:p-6"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{item.place.name}</h3>
              <p className="text-xs text-gray-500">{item.place.country}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Metric
                label="Period average"
                value={formatValue(item.stats.average)}
              />
              <Metric
                label="Latest observation"
                value={formatValue(item.stats.latest)}
              />
              <Metric label="Minimum" value={formatValue(item.stats.min)} />
              <Metric label="Maximum" value={formatValue(item.stats.max)} />
            </div>

            <p className="mt-4 text-xs text-gray-500">
              {item.rows.length} daily observations
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 md:p-6">
        <h2 className="text-lg font-semibold">Comparison analysis</h2>

        <div className="mt-4 rounded-xl bg-gray-800/70 p-4">
          <p className="text-sm leading-6 text-gray-300">
            {first.place.name} recorded an average of{" "}
            <span className="font-medium text-blue-400">
              {formatValue(first.stats.average)}
            </span>
            , compared with{" "}
            <span className="font-medium text-amber-400">
              {formatValue(second.stats.average)}
            </span>{" "}
            in {second.place.name}. The difference between the two averages is{" "}
            <span className="font-medium text-white">
              {formatValue(Math.abs(first.stats.average - second.stats.average))}
            </span>
            .{" "}
            {first.stats.average > second.stats.average
              ? `${first.place.name} has the higher average ${label}.`
              : first.stats.average < second.stats.average
                ? `${second.place.name} has the higher average ${label}.`
                : "Both locations have the same average for this parameter."}
          </p>

          <p className="mt-2 text-xs leading-5 text-gray-500">
            Data source: NASA POWER. These are historical gridded environmental
            observations, not exact street-level measurements or weather
            forecasts.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CompareAnalysis;
