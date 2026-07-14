"use client";

import { SeverityBadge } from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { updateIncidentStatus, resolveMediaUrl, type Incident } from "@/lib/api";
import { cn, formatTimeAgo, STATUS_COLORS } from "@/lib/utils";
import { CheckCircle, Send, TrendingUp } from "lucide-react";
import Image from "next/image";

interface AlertCardProps {
  incident: Incident;
  onUpdate?: (incident: Incident) => void;
}

export function AlertCard({ incident, onUpdate }: AlertCardProps) {
  const statusKey = incident.status.toUpperCase();

  async function handleAction(action: string) {
    try {
      const updated = await updateIncidentStatus(incident.id, action);
      onUpdate?.(updated);
    } catch {
      // silent fail — user can retry
    }
  }

  return (
    <article className="glass-panel overflow-hidden">
      <div className="flex gap-3 p-4">
        {incident.photoUrl && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={resolveMediaUrl(incident.photoUrl)}
              alt="Incident photo"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={incident.severity} />
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                STATUS_COLORS[statusKey] || STATUS_COLORS.NEW
              )}
            >
              {statusKey}
            </span>
            <span className="text-xs text-dim-gray">
              {formatTimeAgo(incident.createdAt)}
            </span>
          </div>
          <p className="truncate text-sm">
            {incident.address ||
              `${incident.lat.toFixed(4)}, ${incident.lng.toFixed(4)}`}
          </p>
          {incident.confidence != null && (
            <p className="font-mono text-xs text-dim-gray">
              AI confidence: {Math.round(incident.confidence * 100)}%
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 border-t border-white/10 p-2">
        {statusKey === "NEW" && (
          <Button size="sm" variant="secondary" onClick={() => handleAction("ACK")}>
            <CheckCircle className="mr-1 h-3 w-3" aria-hidden />
            Acknowledge
          </Button>
        )}
        {(statusKey === "NEW" || statusKey === "ACK" || statusKey === "ACKNOWLEDGED") && (
          <Button size="sm" variant="default" onClick={() => handleAction("DISPATCHED")}>
            <Send className="mr-1 h-3 w-3" aria-hidden />
            Dispatch
          </Button>
        )}
        {statusKey !== "RESOLVED" && (
          <Button size="sm" variant="outline" onClick={() => handleAction("ESCALATED")}>
            <TrendingUp className="mr-1 h-3 w-3" aria-hidden />
            Escalate
          </Button>
        )}
        {statusKey !== "RESOLVED" && (
          <Button size="sm" variant="ghost" onClick={() => handleAction("RESOLVED")}>
            Mark Resolved
          </Button>
        )}
      </div>
    </article>
  );
}
