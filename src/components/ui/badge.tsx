import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

type Tone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "accent";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-sunken text-muted-strong",
  primary: "bg-primary-soft text-primary-hover",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  accent: "bg-accent-soft text-accent",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusTone: Record<AppointmentStatus, Tone> = {
  PENDING: "warning",
  CONFIRMED: "info",
  COMPLETED: "success",
  CANCELLED: "neutral",
  NO_SHOW: "danger",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus;
  className?: string;
}) {
  return (
    <Badge tone={statusTone[status]} className={className}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "PENDING" && "bg-warning",
          status === "CONFIRMED" && "bg-info",
          status === "COMPLETED" && "bg-success",
          status === "CANCELLED" && "bg-muted",
          status === "NO_SHOW" && "bg-danger",
        )}
      />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
