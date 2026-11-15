import React from "react";
import { searchPlaces } from "../lib/APIhelper";

export function LocationSearch({
  label,
  selected,
  setSelected,
  showCountry = true,
}) {
  const [query, setQuery] = React.useState(selected?.name || "");
  const [results, setResults] = React.useState([]);
  const [searching, setSearching] = React.useState(false);

  const prevSelected = React.useRef(selected);
  const isTypingRef = React.useRef(false);

  React.useEffect(() => {
    if (selected && selected !== prevSelected.current) {
      setQuery(selected.name || "");
      setResults([]);
    } else if (!selected && prevSelected.current && !isTypingRef.current) {
      setQuery("");
      setResults([]);
    }
    prevSelected.current = selected;
    isTypingRef.current = false;
  }, [selected]);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3 || selected?.name === query) {
      setResults([]);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const places = await searchPlaces(trimmed, controller.signal);
        setResults(places);
      } catch (err) {
        if (err.name !== "AbortError") setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selected]);

  function selectPlace(place) {
    setSelected(place);
    setQuery(place.name);
    setResults([]);
  }

  return (
    <div className="min-w-0">
      <div className="relative">
        <label className="mb-1 block text-xs text-gray-400">{label}</label>
        <input
          value={query}
          onChange={(e) => {
            isTypingRef.current = true;
            setQuery(e.target.value);
            setSelected(null);
          }}
          placeholder="Search city or country…"
          autoComplete="off"
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm outline-none focus:border-blue-700"
        />

        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
            {results.map((place, index) => (
              <button
                key={`${place.lat}-${place.lng}-${index}`}
                type="button"
                onClick={() => selectPlace(place)}
                className="block w-full border-b border-gray-800 px-3 py-2 text-left hover:bg-gray-800"
              >
                <span className="block text-sm">{place.name}</span>
                <span className="block truncate text-xs text-gray-500">
                  {place.displayName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {searching && (
        <p className="mt-1 text-xs text-gray-500">Searching locations…</p>
      )}

      {showCountry && (
        <div className="mt-3">
          <label className="mb-1 block text-xs text-gray-400">
            Country / Coordinates
          </label>
          <input
            value={
              selected
                ? `${selected.country || "Unknown"} (${selected.lat.toFixed(2)}, ${selected.lng.toFixed(2)})`
                : ""
            }
            readOnly
            placeholder="Select a location or drop a pin"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300"
          />
        </div>
      )}
    </div>
  );
}
