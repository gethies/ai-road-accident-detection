"use client";

import { AlertCard } from "@/components/AlertCard";
import { getIncidents, type Incident } from "@/lib/api";
import { incidentWs } from "@/lib/websocket";
import { useEffect, useState } from "react";

export default function AlertsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState({ severity: "", status: "" });

  useEffect(() => {
    loadIncidents();
    incidentWs?.connect();
    const off = incidentWs?.onIncident((inc) => {
      setIncidents((prev) => [inc, ...prev.filter((p) => p.id !== inc.id)]);
    });
    return () => off?.();
  }, []);

  function loadIncidents() {
    const params: Record<string, string> = {};
    if (filter.severity) params.severity = filter.severity;
    if (filter.status) params.status = filter.status;
    getIncidents(params).then(setIncidents).catch(() => null);
  }

  useEffect(() => {
    loadIncidents();
  }, [filter]);

  function handleUpdate(updated: Incident) {
    setIncidents((prev) =>
      prev.map((i) => (i.id === updated.id ? updated : i))
    );
  }

  const filtered = incidents.filter((i) => {
    if (filter.severity && i.severity !== filter.severity.toUpperCase()) return false;
    if (filter.status && i.status !== filter.status.toUpperCase()) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 font-display text-3xl font-bold">Alert Management</h1>
      <p className="mb-6 text-dim-gray">
        Real-time inbox for police stations and emergency responders.
      </p>

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          className="rounded-lg border border-white/10 bg-night-road px-3 py-2 text-sm"
          value={filter.severity}
          onChange={(e) => setFilter((f) => ({ ...f, severity: e.target.value }))}
          aria-label="Filter by severity"
        >
          <option value="">All severities</option>
          <option value="MINOR">Minor</option>
          <option value="MODERATE">Moderate</option>
          <option value="SEVERE">Severe</option>
          <option value="FATAL">Fatal</option>
        </select>
        <select
          className="rounded-lg border border-white/10 bg-night-road px-3 py-2 text-sm"
          value={filter.status}
          onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      <div className="space-y-4" role="list" aria-label="Alert inbox">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-dim-gray">No alerts matching filters.</p>
        ) : (
          filtered.map((inc) => (
            <AlertCard key={inc.id} incident={inc} onUpdate={handleUpdate} />
          ))
        )}
      </div>

      <div className="mt-8 glass-panel p-4">
        <h2 className="mb-2 font-display text-sm font-semibold">Status Pipeline</h2>
        <p className="text-xs text-dim-gray">
          New → Acknowledged → Dispatched → Resolved
        </p>
        <p className="mt-2 text-xs text-dim-gray">
          Escalated alerts trigger additional SMS notifications to district coordinators.
        </p>
      </div>
    </div>
  );
}
