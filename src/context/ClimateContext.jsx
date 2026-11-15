/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { reverseGeocode } from "../lib/APIhelper";

const ClimateContext = React.createContext(null);

export function ClimateProvider({ children }) {
  const [primaryPlace, setPrimaryPlace] = React.useState(null);
  const [secondaryPlace, setSecondaryPlace] = React.useState(null);
  const [activeSlot, setActiveSlot] = React.useState("auto");
  const [lastUpdatedSlot, setLastUpdatedSlot] = React.useState(null);
  const geoAbortRef = React.useRef({ A: null, B: null });

  const assignPinFromMap = React.useCallback(
    ({ lat, lng }) => {
      let target = activeSlot;
      if (activeSlot === "auto") {
        target = !primaryPlace ? "A" : !secondaryPlace ? "B" : "A";
      }

      const coords = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
      const provisional = {
        lat,
        lng,
        name: coords,
        country: "Resolving…",
        displayName: `Coordinates (${coords})`,
      };

      const setter = target === "A" ? setPrimaryPlace : setSecondaryPlace;
      setter(provisional);
      setLastUpdatedSlot(target);

      geoAbortRef.current[target]?.abort();
      const ctrl = new AbortController();
      geoAbortRef.current[target] = ctrl;

      reverseGeocode(lat, lng, ctrl.signal)
        .then((resolved) => {
          if (ctrl.signal.aborted) return;
          setter((current) => {
            if (!current || current.lat !== lat || current.lng !== lng) {
              return current;
            }
            return resolved;
          });
        })
        .catch(() => {});

      return target;
    },
    [activeSlot, primaryPlace, secondaryPlace],
  );

  const swapPlaces = React.useCallback(() => {
    setPrimaryPlace(secondaryPlace);
    setSecondaryPlace(primaryPlace);
  }, [primaryPlace, secondaryPlace]);

  const clearPins = React.useCallback(() => {
    geoAbortRef.current.A?.abort();
    geoAbortRef.current.B?.abort();
    setPrimaryPlace(null);
    setSecondaryPlace(null);
    setLastUpdatedSlot(null);
  }, []);

  const value = React.useMemo(
    () => ({
      primaryPlace,
      setPrimaryPlace,
      secondaryPlace,
      setSecondaryPlace,
      activeSlot,
      setActiveSlot,
      lastUpdatedSlot,
      assignPinFromMap,
      swapPlaces,
      clearPins,
    }),
    [
      primaryPlace,
      secondaryPlace,
      activeSlot,
      lastUpdatedSlot,
      assignPinFromMap,
      swapPlaces,
      clearPins,
    ],
  );

  return (
    <ClimateContext.Provider value={value}>{children}</ClimateContext.Provider>
  );
}

export function useClimate() {
  const ctx = React.useContext(ClimateContext);
  if (!ctx) throw new Error("useClimate must be used inside ClimateProvider");
  return ctx;
}
