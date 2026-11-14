import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const Dashboard = () => {
  // Removed the extra single quotes inside the string
  const mapUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <MapContainer center={[20, 0]} zoom={3} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url={mapUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
      </MapContainer>
    </div>
  );
};

export default Dashboard;