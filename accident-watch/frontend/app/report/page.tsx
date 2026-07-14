"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeverityBadge } from "@/components/SeverityBadge";
import { createIncident } from "@/lib/api";
import { CheckCircle, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

const MiniMap = dynamic(
  () => import("@/components/MiniMap").then((m) => m.MiniMap),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-lg bg-asphalt" /> }
);

const VEHICLE_TYPES = ["Car", "Truck", "Bus", "Two-wheeler", "Auto", "Pedestrian"];
const SEVERITIES = ["Minor", "Moderate", "Severe", "Fatal"];

export default function ReportPage() {
  const [lat, setLat] = useState(20.5937);
  const [lng, setLng] = useState(78.9629);
  const [severity, setSeverity] = useState("Moderate");
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [onScene, setOnScene] = useState("Unknown");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);

  function toggleVehicle(v: string) {
    setVehicles((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }

  function useGps() {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createIncident({
        lat,
        lng,
        severity: severity.toUpperCase(),
        vehicleTypes: vehicles,
        notes: notes + (onScene !== "Unknown" ? ` | Emergency on scene: ${onScene}` : ""),
        anonymous,
      });
      setSubmitted(result as Record<string, unknown>);
    } catch {
      // show error in production
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-safe-green" aria-hidden />
        <h1 className="font-display text-2xl font-bold">Report Submitted</h1>
        <p className="mt-2 text-dim-gray">Incident ID:</p>
        <p className="font-mono text-lane-yellow">{String(submitted.id)}</p>
        <SeverityBadge severity={String(submitted.severity)} className="mt-4" />
        {submitted.nearest && (
          <div className="mt-6 space-y-3 text-left glass-panel p-4">
            <p className="text-sm font-medium">Nearest Emergency Services</p>
            {Object.entries(submitted.nearest as Record<string, { name: string; distance_km: number; phone: string }>).map(
              ([key, val]) => (
                <div key={key} className="text-sm">
                  <span className="capitalize text-dim-gray">{key}:</span>{" "}
                  {val.name} — {val.distance_km} km —{" "}
                  <a href={`tel:${val.phone}`} className="text-lane-yellow">
                    {val.phone}
                  </a>
                </div>
              )
            )}
          </div>
        )}
        <Button className="mt-6" variant="secondary" onClick={() => setSubmitted(null)}>
          Report Another
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 font-display text-3xl font-bold">Report an Accident</h1>
      <p className="mb-8 text-dim-gray">
        No account required. Help emergency services respond faster.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MiniMap lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln); }} />
            <Button type="button" variant="outline" size="sm" onClick={useGps}>
              <MapPin className="mr-1 h-4 w-4" aria-hidden />
              Auto-detect GPS
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="lat">Latitude</Label>
                <Input id="lat" type="number" step="any" value={lat} onChange={(e) => setLat(+e.target.value)} />
              </div>
              <div>
                <Label htmlFor="lng">Longitude</Label>
                <Input id="lng" type="number" step="any" value={lng} onChange={(e) => setLng(+e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incident Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Severity (witness estimate)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      severity === s
                        ? "border-lane-yellow bg-lane-yellow/20 text-lane-yellow"
                        : "border-white/10 text-dim-gray"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Vehicle types involved</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {VEHICLE_TYPES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleVehicle(v)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      vehicles.includes(v)
                        ? "border-red-alert bg-red-alert/20 text-red-alert"
                        : "border-white/10 text-dim-gray"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Additional notes</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe what happened…" />
            </div>

            <div>
              <Label>Ambulance/police on scene?</Label>
              <div className="mt-2 flex gap-2">
                {["Yes", "No", "Unknown"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setOnScene(v)}
                    className={`rounded-lg border px-3 py-1 text-sm ${
                      onScene === v ? "border-safe-green text-safe-green" : "border-white/10 text-dim-gray"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              Submit anonymously
            </label>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? "Submitting…" : "Submit Report"}
        </Button>
      </form>
    </div>
  );
}
