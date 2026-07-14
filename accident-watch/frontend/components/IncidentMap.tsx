"use client";

import { SeverityBadge } from "@/components/SeverityBadge";
import { resolveMediaUrl, type Hotspot, type Incident } from "@/lib/api";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const MapInner = dynamic(() => import("./IncidentMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-night-road text-dim-gray">
      Loading map…
    </div>
  ),
});

export interface IncidentMapProps {
  incidents: Incident[];
  hotspots?: Hotspot[];
  initialCenter?: [number, number];
  zoom?: number;
  showHeatmap?: boolean;
  showLiveMarkers?: boolean;
  selectedIncident?: Incident | null;
  onSelectIncident?: (incident: Incident | null) => void;
  className?: string;
}

export function IncidentMap(props: IncidentMapProps) {
  const activeIncidents = useMemo(() => {
    const oneHourAgo = Date.now() - 3600000;
    return props.incidents.filter(
      (i) => new Date(i.createdAt).getTime() > oneHourAgo
    );
  }, [props.incidents]);

  return (
    <div className={props.className || "relative h-full min-h-[400px] w-full"}>
      <MapInner {...props} activeIncidents={activeIncidents} />
      {props.selectedIncident && (
        <div className="absolute bottom-4 left-4 z-[1000] max-w-xs glass-panel p-4">
          <SeverityBadge severity={props.selectedIncident.severity} />
          <p className="mt-2 text-sm font-medium">
            {props.selectedIncident.address ||
              `${props.selectedIncident.lat.toFixed(4)}, ${props.selectedIncident.lng.toFixed(4)}`}
          </p>
          {props.selectedIncident.photoUrl && (
            <img
              src={resolveMediaUrl(props.selectedIncident.photoUrl)}
              alt="Incident"
              className="mt-2 max-h-24 rounded object-cover"
            />
          )}
        </div>
      )}
    </div>
  );
}
