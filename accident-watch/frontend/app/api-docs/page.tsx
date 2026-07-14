"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ApiDocsPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-b border-white/10 px-6 py-4">
        <h1 className="font-display text-2xl font-bold">API Documentation</h1>
        <p className="text-sm text-dim-gray">
          Interactive Swagger UI — try endpoints live in your browser.
        </p>
      </div>
      <iframe
        src={`${API_URL}/docs`}
        className="flex-1 w-full border-0 bg-white"
        title="AccidentWatch API Docs"
      />
      <div className="border-t border-white/10 px-6 py-4">
        <h2 className="mb-2 font-display text-sm font-semibold">Quick Integration</h2>
        <pre className="overflow-x-auto rounded-lg bg-night-road p-4 font-mono text-xs text-lane-yellow">
{`# CCTV integration — POST detection
curl -X POST ${API_URL}/api/detect \\
  -F "image=@road_camera_frame.jpg" \\
  -F "lat=13.0827" -F "lng=80.2707"

# Webhook for mobile apps
curl -X POST ${API_URL}/api/incidents \\
  -H "Content-Type: application/json" \\
  -d '{"lat":19.076,"lng":72.8777,"severity":"SEVERE","vehicleTypes":["Car"]}'`}
        </pre>
      </div>
    </div>
  );
}
