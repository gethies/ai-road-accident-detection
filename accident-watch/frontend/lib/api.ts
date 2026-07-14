const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface DetectionBox {
  box: number[];
  score: number;
  class_id: number;
  label: string;
}

export interface DetectionResult {
  boxes: DetectionBox[];
  scores: number[];
  classes: number[];
  severity: string;
  vehicle_count: number;
  recommended_action: string;
  annotated_image_url: string;
  incident_id?: string;
  confidence: number;
  accident_detected: boolean;
}

export interface Incident {
  id: string;
  createdAt: string;
  lat: number;
  lng: number;
  severity: string;
  status: string;
  photoUrl?: string;
  confidence?: number;
  detectedBy: string;
  vehicleTypes: string[];
  notes?: string;
  address?: string;
}

export interface StatsOverview {
  total_this_week: number;
  avg_response_minutes: number;
  most_dangerous_hour: number;
  top_district: string;
  detected_today: number;
  lives_potentially_saved: number;
  active_zones: number;
  hourly_series: { hour: string; count: number }[];
  daily_series: { date: string; count: number }[];
  state_density: { state: string; count: number }[];
  road_type_breakdown: { type: string; count: number }[];
  peak_hours: { day: number; hour: number; count: number }[];
  confidence_histogram: { bucket: string; count: number }[];
  month_over_month: { month: string; count: number }[];
}

export interface Hotspot {
  id: string;
  lat: number;
  lng: number;
  radius: number;
  risk_score: number;
  label: string;
  incident_count: number;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export async function detectImage(
  file: File,
  lat?: number,
  lng?: number
): Promise<DetectionResult> {
  const form = new FormData();
  form.append("image", file);
  if (lat != null) form.append("lat", String(lat));
  if (lng != null) form.append("lng", String(lng));

  const res = await fetch(`${API_URL}/api/detect`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Detection failed");
  }
  return res.json();
}

export async function getIncidents(params?: Record<string, string>): Promise<Incident[]> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return request<Incident[]>(`/api/incidents${qs}`);
}

export async function getIncident(id: string): Promise<Incident> {
  return request<Incident>(`/api/incidents/${id}`);
}

export async function createIncident(data: Record<string, unknown>): Promise<Incident> {
  return request<Incident>("/api/incidents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateIncidentStatus(
  id: string,
  status: string,
  userId?: string
): Promise<Incident> {
  return request<Incident>(`/api/incidents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, userId: userId || "system" }),
  });
}

export async function getStats(): Promise<StatsOverview> {
  return request<StatsOverview>("/api/stats");
}

export async function getHotspots(): Promise<Hotspot[]> {
  return request<Hotspot[]>("/api/hotspots");
}

export async function sendAlert(incidentId: string): Promise<{ success: boolean }> {
  return request(`/api/alerts/${incidentId}/dispatch`, { method: "POST" });
}

export function getWsUrl(): string {
  const base = API_URL.replace(/^http/, "ws");
  return `${base}/ws/incidents`;
}

export function resolveMediaUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}
