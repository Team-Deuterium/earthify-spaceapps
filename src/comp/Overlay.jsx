import React from "react";
import L from "leaflet";
import { ImageOverlay, Marker } from "react-leaflet";

const arrowIcon = (dir, speed) => {
  const size = Math.round(Math.min(44, 16 + speed * 3));
  const rotate = (dir + 180) % 360;
  return L.divIcon({
    className: "wind-arrow",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="transform:rotate(${rotate}deg)"><path d="M12 2 L18 20 L12 16 L6 20 Z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  });
};

const Overlay = React.memo(({ data, opacity = 0.7, showWind = false }) => {
  if (!data) return null;
  return (
    <>
      <ImageOverlay
        url={data.url}
        bounds={data.bounds}
        opacity={opacity}
        zIndex={10}
      />
      {showWind &&
        data.nodes
          .filter((n) => n.wind)
          .map((n) => (
            <Marker
              key={`w${n.lat},${n.lng},${n.wind.dir},${n.wind.speed}`}
              position={[n.lat, n.lng]}
              icon={arrowIcon(n.wind.dir, n.wind.speed)}
              interactive={false}
            />
          ))}
    </>
  );
});

export default Overlay;
