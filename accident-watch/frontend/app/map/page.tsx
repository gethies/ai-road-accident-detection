"use client";

import { IncidentMap } from "@/components/IncidentMap";
import { LiveFeed } from "@/components/LiveFeed";
import { Button } from "@/components/ui/button";
import { getHotspots, getIncidents, type Hotspot, type Incident } from "@/lib/api";
import { incidentWs } from "@/lib/websocket";
import { Download, Layers } from "lucide-react";
import { useEffect, useState } from "react";

export default function MapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [layers, setLayers] = useState({
    active: true,
    recent: true,
    heatmap: false,
    hotspots: true,
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    getIncidents().then(setIncidents).catch(() => null);
    getHotspots().then(setHotspots).catch(() => null);

    incidentWs?.connect();
    const offConnect = incidentWs?.onConnect(() => setConnected(true));
    const offDisconnect = incidentWs?.onDisconnect(() => setConnected(false));
    const offIncident = incidentWs?.onIncident((inc) => {
      setIncidents((prev) => [inc, ...prev.filter((p) => p.id !== inc.id)]);
    });

    return () => {
      offConnect?.();
      offDisconnect?.();
      offIncident?.();
    };
  }, []);

  const filtered = incidents.filter((i) => {
    const age = Date.now() - new Date(i.createdAt).getTime();
    if (layers.active && age < 3600000) return true;
    if (layers.recent && age >= 3600000 && age < 86400000) return true;
    return !layers.active && !layers.recent;
  });

  function exportCsv() {
    const headers = ["id", "lat", "lng", "severity", "status", "createdAt", "address"];
    const rows = filtered.map((i) =>
      [i.id, i.lat, i.lng, i.severity, i.status, i.createdAt, i.address || ""].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "incidents.csv";
    a.click();
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      <div className="relative flex-1">
        <IncidentMap
          incidents={filtered}
          hotspots={layers.hotspots ? hotspots : []}
          showHeatmap={layers.heatmap}
          showLiveMarkers={layers.active}
          selectedIncident={selected}
          onSelectIncident={setSelected}
          className="h-full min-h-[50vh]"
        />

        <div className="absolute left-4 top-4 z-[1000] space-y-2">
          <div className="glass-panel flex items-center gap-2 px-3 py-2 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${connected ? "bg-safe-green" : "bg-red-alert"}`}
              aria-hidden
            />
            {connected ? "Live" : "Connecting…"}
          </div>
          <div className="glass-panel p-3">
            <p className="mb-2 flex items-center gap-1 text-xs font-medium">
              <Layers className="h-3 w-3" aria-hidden /> Layers
            </p>
            {(
              [
                ["active", "Active (< 1h)"],
                ["recent", "Recent (1–24h)"],
                ["heatmap", "Historical heatmap"],
                ["hotspots", "High-risk zones"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 py-1 text-xs">
                <input
                  type="checkbox"
                  checked={layers[key]}
                  onChange={(e) =>
                    setLayers((l) => ({ ...l, [key]: e.target.checked }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <Button size="sm" variant="secondary" onClick={exportCsv}>
            <Download className="mr-1 h-3 w-3" aria-hidden />
            Export CSV
          </Button>
        </div>
      </div>

      <aside className="flex w-full flex-col border-l border-white/10 bg-asphalt/50 lg:w-80">
        <div className="border-b border-white/10 p-4">
          <h2 className="font-display font-semibold">Live Incident Feed</h2>
          <p className="text-xs text-dim-gray">Newest first · auto-refresh</p>
        </div>
        <LiveFeed
          incidents={incidents}
          selectedId={selected?.id}
          onSelect={setSelected}
        />
      </aside>
    </div>
  );
}
