"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";

interface MiniMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export function MiniMap({ lat, lng, onChange }: MiniMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={12}
      className="h-48 w-full rounded-lg"
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <ClickHandler onChange={onChange} />
      <Recenter lat={lat} lng={lng} />
      <Marker
        position={[lat, lng]}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const { lat: la, lng: ln } = e.target.getLatLng();
            onChange(la, ln);
          },
        }}
      />
    </MapContainer>
  );
}
