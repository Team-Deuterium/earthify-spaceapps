/* eslint-disable react-hooks/set-state-in-effect */
import React from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import PowerOverlay from "../comp/Overlay";
import { DashboardControls } from "../comp/DashboardControls";
import { TimeSlider } from "../comp/TimeSlider";
import { PointSparklinePopup } from "../comp/PointSparklinePopup";
import { useClimate } from "../context/ClimateContext";
import {
  PARAMS,
  isoDaysAgo,
  buildDateRange,
  pinView,
  fetchGridSeries,
  buildRaster,
  probe,
  geocode,
} from "../lib/APIhelper";

const createPinIcon = (label, color) =>
  L.divIcon({
    className: "custom-pin",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
    html: `<svg width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.3 0 0 6.3 0 14c0 9.6 14 22 14 22s14-12.4 14-22C28 6.3 21.7 0 14 0z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <text x="14" y="18" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700" font-family="sans-serif">${label}</text>
    </svg>`,
  });

const PIN_ICON_A = createPinIcon("1", "#2563eb");
const PIN_ICON_B = createPinIcon("2", "#d97706");

const readView = (map) => {
  const b = map.getBounds();
  return {
    south: b.getSouth(),
    north: b.getNorth(),
    west: b.getWest(),
    east: b.getEast(),
  };
};

const MapEvents = ({ flyTo, worldTick, onPick, onView, onHover }) => {
  const map = useMap();

  React.useEffect(() => {
    onView(readView(map));
  }, [map, onView]);

  React.useEffect(() => {
    if (flyTo) map.flyTo([flyTo.lat, flyTo.lng], Math.max(map.getZoom(), 6));
  }, [flyTo, map]);

  React.useEffect(() => {
    if (worldTick) map.setZoom(2).setView([20, 0]);
  }, [worldTick, map]);

  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
    moveend: () => onView(readView(map)),
    mousemove: (e) => onHover(e.latlng.lat, e.latlng.lng),
    mouseout: () => onHover(null),
  });
  return null;
};

const Dashboard = () => {
  const {
    primaryPlace,
    setPrimaryPlace,
    secondaryPlace,
    activeSlot,
    setActiveSlot,
    lastUpdatedSlot,
    assignPinFromMap,
    swapPlaces,
    clearPins,
  } = useClimate();

  const [param, setParam] = React.useState("T2M");
  const [endDate, setEndDate] = React.useState(isoDaysAgo(5));
  const [windowDays, setWindowDays] = React.useState(14);
  const [frameIndex, setFrameIndex] = React.useState(13);
  const [playing, setPlaying] = React.useState(false);
  const [speedMs, setSpeedMs] = React.useState(650);

  const [mode, setMode] = React.useState("pin");
  const [showWind, setShowWind] = React.useState(false);
  const [flyTo, setFlyTo] = React.useState(null);
  const [view, setView] = React.useState(null);
  const [worldTick, setWorldTick] = React.useState(0);
  const [placeQuery, setPlaceQuery] = React.useState("");
  const [opacity, setOpacity] = React.useState(0.7);
  const [rasterByDate, setRasterByDate] = React.useState({});
  const [status, setStatus] = React.useState("");

  const dataRef = React.useRef(null);
  const readoutRef = React.useRef(null);
  const markerARef = React.useRef(null);
  const markerBRef = React.useRef(null);

  const dates = React.useMemo(
    () => buildDateRange(endDate, windowDays),
    [endDate, windowDays],
  );

  React.useEffect(() => {
    setFrameIndex(dates.length - 1);
  }, [dates.length, endDate]);

  React.useEffect(() => {
    if (lastUpdatedSlot === "A" && primaryPlace) {
      markerARef.current?.openPopup();
    } else if (lastUpdatedSlot === "B" && secondaryPlace) {
      markerBRef.current?.openPopup();
    }
  }, [lastUpdatedSlot, primaryPlace, secondaryPlace]);

  const activePin =
    lastUpdatedSlot === "B" && secondaryPlace
      ? secondaryPlace
      : primaryPlace || secondaryPlace;

  const request = React.useMemo(() => {
    if (mode === "pin") {
      return activePin ? pinView(activePin.lat, activePin.lng) : null;
    }
    return view;
  }, [mode, activePin, view]);

  React.useEffect(() => {
    if (!request) {
      setRasterByDate({});
      setStatus(mode === "pin" ? "Click the map or search a place." : "");
      return undefined;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setStatus(`Loading ${dates.length}-day window…`);
        const { step, byDate } = await fetchGridSeries({
          param,
          startDate: dates[0],
          endDate: dates[dates.length - 1],
          view: request,
          wind: showWind,
          signal: ctrl.signal,
          onProgress: (done, total) =>
            setStatus(`Loading ${dates.length}-day window… ${done}/${total}`),
        });

        const built = {};
        for (const d of dates) {
          const raster = buildRaster(byDate[d], step);
          if (raster) built[d] = raster;
        }
        setRasterByDate(built);
        setStatus(
          Object.keys(built).length
            ? ""
            : "NASA has no data for this date/location. Try an earlier date.",
        );
      } catch (err) {
        if (err.name !== "AbortError") setStatus(err.message);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [param, dates, showWind, request, mode]);

  React.useEffect(() => {
    if (!playing || dates.length < 2) return undefined;
    const id = setInterval(() => {
      setFrameIndex((i) => (i + 1) % dates.length);
    }, speedMs);
    return () => clearInterval(id);
  }, [playing, speedMs, dates.length]);

  const activeDate = dates[frameIndex] || endDate;
  const activeData = rasterByDate[activeDate] || null;

  React.useEffect(() => {
    dataRef.current = activeData;
  }, [activeData]);

  const unit = PARAMS[param].unit;

  const onHover = React.useCallback(
    (lat, lng) => {
      const el = readoutRef.current;
      if (!el) return;
      const hit = lat == null ? null : probe(dataRef.current, lat, lng);
      el.textContent = hit
        ? `${hit.value.toFixed(1)} ${unit}${
            hit.wind
              ? ` · wind ${hit.wind.speed.toFixed(1)} m/s from ${Math.round(hit.wind.dir)}°`
              : ""
          }`
        : "Hover the overlay for values";
    },
    [unit],
  );

  async function onSearch(e) {
    e.preventDefault();
    if (!placeQuery.trim()) return;
    const hit = await geocode(placeQuery).catch(() => null);
    if (hit) {
      setPrimaryPlace(hit);
      setFlyTo(hit);
      setTimeout(() => markerARef.current?.openPopup(), 250);
    } else {
      setStatus("Place not found.");
    }
  }

  function showWorld() {
    setMode("view");
    setWorldTick((n) => n + 1);
  }

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <DashboardControls
        param={param}
        setParam={setParam}
        endDate={endDate}
        setEndDate={setEndDate}
        mode={mode}
        setMode={setMode}
        onWorld={showWorld}
        placeQuery={placeQuery}
        setPlaceQuery={setPlaceQuery}
        onSearch={onSearch}
        showWind={showWind}
        setShowWind={setShowWind}
        opacity={opacity}
        setOpacity={setOpacity}
        activeSlot={activeSlot}
        setActiveSlot={setActiveSlot}
        hasPins={Boolean(primaryPlace || secondaryPlace)}
        onSwapPins={swapPlaces}
        onClearPins={clearPins}
      />

      <TimeSlider
        dates={dates}
        frameIndex={frameIndex}
        setFrameIndex={setFrameIndex}
        windowDays={windowDays}
        setWindowDays={setWindowDays}
        playing={playing}
        setPlaying={setPlaying}
        speedMs={speedMs}
        setSpeedMs={setSpeedMs}
        data={activeData}
        unit={unit}
        showWind={showWind}
        status={status}
        readoutRef={readoutRef}
      />

      <MapContainer
        center={[20, 0]}
        zoom={3}
        minZoom={2}
        maxBounds={[
          [-90, -180],
          [90, 180],
        ]}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={13}
          noWrap={true}
          referrerPolicy="strict-origin-when-cross-origin"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <PowerOverlay data={activeData} opacity={opacity} showWind={showWind} />

        {primaryPlace && (
          <Marker
            ref={markerARef}
            position={[primaryPlace.lat, primaryPlace.lng]}
            icon={PIN_ICON_A}
          >
            <Popup>
              <PointSparklinePopup
                place={primaryPlace}
                slotLabel="Pin 1 (A)"
                param={param}
                endDate={activeDate}
                canCompare={Boolean(secondaryPlace)}
              />
            </Popup>
          </Marker>
        )}

        {secondaryPlace && (
          <Marker
            ref={markerBRef}
            position={[secondaryPlace.lat, secondaryPlace.lng]}
            icon={PIN_ICON_B}
          >
            <Popup>
              <PointSparklinePopup
                place={secondaryPlace}
                slotLabel="Pin 2 (B)"
                param={param}
                endDate={activeDate}
                onSetSlot={() => setPrimaryPlace(secondaryPlace)}
                canCompare={Boolean(primaryPlace)}
              />
            </Popup>
          </Marker>
        )}

        <MapEvents
          flyTo={flyTo}
          worldTick={worldTick}
          onPick={assignPinFromMap}
          onView={setView}
          onHover={onHover}
        />
        <ZoomControl position="topright" />
      </MapContainer>
    </div>
  );
};

export default Dashboard;
