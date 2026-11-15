const searchCache = new Map();
const reverseCache = new Map();

function normalizePlace(item, fallbackLat, fallbackLng) {
  const addr = item.address || {};
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.state ||
    item.name;
  const country = addr.country || "";
  const lat = Number(item.lat ?? fallbackLat);
  const lng = Number(item.lon ?? fallbackLng);

  return {
    name: city || `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
    country,
    displayName: item.display_name || `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
    lat,
    lng,
  };
}

export async function searchPlaces(query, signal) {
  const key = query.trim().toLowerCase();
  if (key.length < 2) return [];
  if (searchCache.has(key)) return searchCache.get(key);

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(
    query.trim(),
  )}`;
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Location search failed (${res.status}).`);

  const json = await res.json();
  const places = json.map((item) => normalizePlace(item));
  searchCache.set(key, places);
  return places;
}

export async function geocode(query, signal) {
  const hits = await searchPlaces(query, signal);
  return hits[0] || null;
}

export async function reverseGeocode(lat, lng, signal) {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  if (reverseCache.has(key)) return { ...reverseCache.get(key), lat, lng };

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Reverse geocode failed");
    const json = await res.json();
    if (json.error) throw new Error(json.error);

    const place = normalizePlace(json, lat, lng);
    reverseCache.set(key, place);
    return place;
  } catch (err) {
    if (err.name === "AbortError") throw err;
    const coords = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
    return {
      name: coords,
      country: "Ocean / Unlisted",
      displayName: `Coordinates (${coords})`,
      lat,
      lng,
    };
  }
}
