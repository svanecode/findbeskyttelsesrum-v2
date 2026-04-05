"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression, LatLngTuple } from "leaflet";

type ShelterDetailMapProps = {
  className?: string;
  latitude: number;
  longitude: number;
};

function MapViewport({ center }: { center: LatLngTuple }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);

  return null;
}

export function ShelterDetailMap({ className, latitude, longitude }: ShelterDetailMapProps) {
  const center: LatLngTuple = [latitude, longitude];

  return (
    <div className="overflow-hidden border border-border" style={{ borderRadius: "2px" }}>
      <div className={className ?? "h-[280px] w-full"}>
        <MapContainer
          center={center as LatLngExpression}
          className="search-results-map h-full w-full"
          scrollWheelZoom
          zoom={15}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewport center={center} />
          <CircleMarker
            center={center}
            pathOptions={{
              color: "#ff7a1a",
              fillColor: "#ff7a1a",
              fillOpacity: 0.2,
              weight: 2,
            }}
            radius={10}
          />
        </MapContainer>
      </div>
    </div>
  );
}
