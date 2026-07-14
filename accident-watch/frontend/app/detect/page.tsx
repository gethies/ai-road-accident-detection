"use client";

import { DetectionResultPanel } from "@/components/DetectionResult";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { detectImage, type DetectionResult } from "@/lib/api";
import { Loader2, MapPin, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export default function DetectPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function useGeolocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
    });
  }

  async function runDetection() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await detectImage(file, lat, lng);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">AI Detection Lab</h1>
        <p className="mt-2 text-dim-gray">
          Upload road traffic images for SSD-based accident detection. Results
          include bounding boxes, severity scoring, and optional emergency alerts.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition ${
                dragOver
                  ? "border-lane-yellow bg-lane-yellow/10"
                  : "border-white/20 hover:border-lane-yellow/50"
              }`}
              aria-label="Drop zone for accident image upload"
            >
              <Upload className="mb-3 h-10 w-10 text-dim-gray" aria-hidden />
              <p className="text-sm text-mist-white">
                Drag & drop JPG/PNG or click to browse
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>

            {preview && (
              <div className="relative aspect-video overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Upload preview" className="h-full w-full object-contain" />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={useGeolocation}>
                <MapPin className="mr-1 h-4 w-4" aria-hidden />
                Use GPS
              </Button>
              {lat != null && (
                <span className="font-mono text-xs text-dim-gray">
                  {lat.toFixed(4)}, {lng?.toFixed(4)}
                </span>
              )}
            </div>

            <Button
              onClick={runDetection}
              disabled={!file || loading}
              className="w-full"
              aria-live="polite"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Analyzing…
                </>
              ) : (
                "Run Detection"
              )}
            </Button>

            {error && (
              <p className="text-sm text-red-alert" role="alert">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {result ? (
          <DetectionResultPanel result={result} inputPreview={preview || undefined} />
        ) : (
          <Card className="flex items-center justify-center p-12">
            <p className="text-center text-dim-gray">
              Upload an image and run detection to see annotated results, severity
              scores, and recommended actions.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
