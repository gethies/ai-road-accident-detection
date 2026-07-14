import { cn, SEVERITY_COLORS } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Skull, Shield } from "lucide-react";

const ICONS: Record<string, React.ReactNode> = {
  MINOR: <Shield className="h-3 w-3" aria-hidden />,
  MODERATE: <AlertCircle className="h-3 w-3" aria-hidden />,
  SEVERE: <AlertTriangle className="h-3 w-3" aria-hidden />,
  FATAL: <Skull className="h-3 w-3" aria-hidden />,
};

interface SeverityBadgeProps {
  severity: string;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const key = severity.toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase",
        SEVERITY_COLORS[key] || SEVERITY_COLORS.MINOR,
        className
      )}
      role="status"
      aria-label={`Severity: ${key}`}
    >
      {ICONS[key]}
      {key}
    </span>
  );
}
