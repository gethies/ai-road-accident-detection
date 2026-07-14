"use client";

import type { Hotspot, Incident } from "@/lib/api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

// Fix default marker icons in Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina.src,
  iconUrl: icon.src,
  shadowUrl: shadow.src,
});

interface MapInnerProps {
  incidents: Incident[];
  activeIncidents: Incident[];
  hotspots?: Hotspot[];
  initialCenter?: [number, number];
  zoom?: number;
  showHeatmap?: boolean;
  showLiveMarkers?: boolean;
  selectedIncident?: Incident | null;
  onSelectIncident?: (incident: Incident | null) => void;
}

function FlyToSelected({
  incident,
}: {
  incident: Incident | null | undefined;
}) {
  const map = useMap();
  useEffect(() => {
    if (incident) {
      map.flyTo([incident.lat, incident.lng], 12, { duration: 1 });
    }
  }, [incident, map]);
  return null;
}

function HeatmapLayer({ incidents }: { incidents: Incident[] }) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (incidents.length === 0) return;

    import("leaflet.heat").then(() => {
      const points: [number, number, number][] = incidents.map((i) => [
        i.lat,
        i.lng,
        i.severity === "SEVERE" || i.severity === "FATAL" ? 1 : 0.5,
      ]);
      // @ts-expect-error leaflet.heat extends L
      const heat = L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        gradient: {
          0.2: "#F5C842",
          0.5: "#D9232D",
          1.0: "#ff0000",
        },
      });
      heat.addTo(map);
      layerRef.current = heat;
    });

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [incidents, map]);

  return null;
}

function PulsingMarker({
  incident,
  isActive,
  onClick,
}: {
  incident: Incident;
  isActive: boolean;
  onClick: () => void;
}) {
  const color =
    incident.severity === "SEVERE" || incident.severity === "FATAL"
      ? "#D9232D"
      : incident.severity === "MODERATE"
        ? "#F5C842"
        : "#22C55E";

  return (
    <>
      {isActive && (
        <Circle
          center={[incident.lat, incident.lng]}
          radius={500}
          pathOptions={{
            color,
            fillColor: color,
            fillOpacity: 0.1,
            weight: 1,
            className: "radar-marker",
          }}
        />
      )}
      <CircleMarker
        center={[incident.lat, incident.lng]}
        radius={8}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 2 }}
        eventHandlers={{ click: onClick }}
      >
        <Popup>
          <div className="text-sm">
            <strong>{incident.severity}</strong>
            <br />
            {incident.address || `${incident.lat.toFixed(4)}, ${incident.lng.toFixed(4)}`}
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
}

export default function IncidentMapInner({
  incidents,
  activeIncidents,
  hotspots = [],
  initialCenter = [20.5937, 78.9629],
  zoom = 5,
  showHeatmap = false,
  showLiveMarkers = true,
  selectedIncident,
  onSelectIncident,
}: MapInnerProps) {
  const activeIds = new Set(activeIncidents.map((i) => i.id));

  return (
    <MapContainer
      center={initialCenter}
      zoom={zoom}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <FlyToSelected incident={selectedIncident} />
      {showHeatmap && <HeatmapLayer incidents={incidents} />}
      {showLiveMarkers &&
        incidents.map((incident) => (
          <PulsingMarker
            key={incident.id}
            incident={incident}
            isActive={activeIds.has(incident.id)}
            onClick={() => onSelectIncident?.(incident)}
          />
        ))}
      {hotspots.map((spot) => (
        <Circle
          key={spot.id}
          center={[spot.lat, spot.lng]}
          radius={spot.radius}
          pathOptions={{
            color: "#D9232D",
            fillColor: "#D9232D",
            fillOpacity: 0.15,
            weight: 1,
            dashArray: "4",
          }}
        >
          <Popup>
            <strong>{spot.label}</strong>
            <br />
            Risk: {spot.risk_score.toFixed(0)}% ({spot.incident_count} incidents)
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
}
