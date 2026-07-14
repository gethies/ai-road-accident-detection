"use client";

import { SeverityBadge } from "@/components/SeverityBadge";
import { resolveMediaUrl, type Incident } from "@/lib/api";
import { formatTimeAgo } from "@/lib/utils";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

interface LiveFeedProps {
  incidents: Incident[];
  onSelect?: (incident: Incident) => void;
  selectedId?: string;
}

export function LiveFeed({ incidents, onSelect, selectedId }: LiveFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(incidents.length);

  useEffect(() => {
    if (incidents.length > prevCount.current && feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
    prevCount.current = incidents.length;
  }, [incidents.length]);

  return (
    <div
      ref={feedRef}
      className="flex h-full flex-col gap-2 overflow-y-auto p-3"
      role="feed"
      aria-label="Live incident feed"
      aria-live="polite"
    >
      {incidents.length === 0 ? (
        <p className="py-8 text-center text-sm text-dim-gray">
          No incidents yet. Waiting for live updates…
        </p>
      ) : (
        incidents.map((incident) => (
          <button
            key={incident.id}
            type="button"
            onClick={() => onSelect?.(incident)}
            className={`w-full rounded-lg border p-3 text-left transition hover:bg-asphalt/80 ${
              selectedId === incident.id
                ? "border-lane-yellow bg-asphalt"
                : "border-white/10 bg-night-road/50"
            }`}
          >
            <div className="flex gap-3">
              {incident.photoUrl && (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                  <Image
                    src={resolveMediaUrl(incident.photoUrl)}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <SeverityBadge severity={incident.severity} />
                  <span className="text-xs text-dim-gray">
                    {formatTimeAgo(incident.createdAt)}
                  </span>
                </div>
                <p className="flex items-center gap-1 truncate text-xs">
                  <MapPin className="h-3 w-3 shrink-0 text-red-alert" aria-hidden />
                  {incident.address ||
                    `${incident.lat.toFixed(4)}, ${incident.lng.toFixed(4)}`}
                </p>
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
