import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export const SEVERITY_COLORS: Record<string, string> = {
  MINOR: "bg-safe-green/20 text-safe-green border-safe-green/40",
  MODERATE: "bg-lane-yellow/20 text-lane-yellow border-lane-yellow/40",
  SEVERE: "bg-red-alert/20 text-red-alert border-red-alert/40",
  FATAL: "bg-red-900/40 text-red-300 border-red-500/40",
};

export const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-red-alert/20 text-red-alert",
  ACK: "bg-lane-yellow/20 text-lane-yellow",
  ACKNOWLEDGED: "bg-lane-yellow/20 text-lane-yellow",
  DISPATCHED: "bg-blue-500/20 text-blue-400",
  RESOLVED: "bg-safe-green/20 text-safe-green",
};
