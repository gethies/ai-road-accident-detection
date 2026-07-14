"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "@/components/SeverityBadge";
import { resolveMediaUrl, sendAlert, type DetectionResult } from "@/lib/api";
import { Bell, Share2 } from "lucide-react";
import { useState } from "react";

interface DetectionResultProps {
  result: DetectionResult;
  inputPreview?: string;
}

export function DetectionResultPanel({
  result,
  inputPreview,
}: DetectionResultProps) {
  const [showAnnotated, setShowAnnotated] = useState(true);
  const [alertSent, setAlertSent] = useState(false);
  const [alertLoading, setAlertLoading] = useState(false);

  const imageUrl = showAnnotated
    ? resolveMediaUrl(result.annotated_image_url)
    : inputPreview || resolveMediaUrl(result.annotated_image_url);

  async function handleSendAlert() {
    if (!result.incident_id) return;
    setAlertLoading(true);
    try {
      await sendAlert(result.incident_id);
      setAlertSent(true);
    } catch {
      // user can retry
    } finally {
      setAlertLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden" role="region" aria-label="Detection results">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Detection Results</CardTitle>
          <SeverityBadge severity={result.severity} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-night-road">
          <Image
            src={imageUrl}
            alt={showAnnotated ? "Annotated detection result" : "Original upload"}
            fill
            className="object-contain"
            unoptimized
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={showAnnotated ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAnnotated(true)}
          >
            Annotated
          </Button>
          {inputPreview && (
            <Button
              variant={!showAnnotated ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAnnotated(false)}
            >
              Original
            </Button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="Confidence" value={`${Math.round(result.confidence * 100)}%`} />
          <Stat label="Vehicles" value={String(result.vehicle_count)} />
          <Stat label="Detections" value={String(result.boxes.length)} />
          <Stat label="Action" value={result.recommended_action} />
        </div>

        {result.boxes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Per-detection confidence</p>
            {result.boxes.map((box, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs text-dim-gray">
                  <span>{box.label}</span>
                  <span className="font-mono">{Math.round(box.score * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-night-road">
                  <div
                    className="h-full rounded-full bg-lane-yellow"
                    style={{ width: `${box.score * 100}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(box.score * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {result.incident_id && result.accident_detected && (
            <Button
              onClick={handleSendAlert}
              disabled={alertSent || alertLoading}
              aria-live="polite"
            >
              <Bell className="mr-2 h-4 w-4" aria-hidden />
              {alertSent ? "Alert Sent" : "Send Alert to Nearest Station"}
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" aria-hidden />
            Share
          </Button>
        </div>

        {result.incident_id && (
          <p className="font-mono text-xs text-dim-gray">
            Incident ID: {result.incident_id}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-night-road p-3">
      <p className="text-xs text-dim-gray">{label}</p>
      <p className="font-display text-lg font-bold">{value}</p>
    </div>
  );
}
