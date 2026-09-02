"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { minutesToTime } from "@/lib/time";

export interface TimelineBlock {
  id: string;
  startMin: number;
  endMin: number;
  kind: "appointment" | "break" | "vacation" | "blocked";
  title: string;
  subtitle?: string;
  status?: string;
  onClick?: () => void;
}

const PX_PER_MIN = 1.1;

const kindStyles: Record<TimelineBlock["kind"], string> = {
  appointment: "bg-primary-soft border-primary/30 text-primary-hover",
  break: "bg-warning-soft border-warning/30 text-warning",
  vacation: "bg-surface-sunken border-border-strong text-muted-strong",
  blocked:
    "bg-[repeating-linear-gradient(45deg,var(--surface-sunken),var(--surface-sunken)_6px,transparent_6px,transparent_12px)] border-border-strong text-muted-strong",
};

export function TimeAxis({
  startMin,
  endMin,
}: {
  startMin: number;
  endMin: number;
}) {
  const height = Math.max((endMin - startMin) * PX_PER_MIN, 120);
  const marks: number[] = [];
  const first = Math.ceil(startMin / 60) * 60;
  for (let m = first; m <= endMin; m += 60) marks.push(m);
  return (
    <div className="relative w-12 shrink-0 pt-1 text-right" style={{ height }}>
      {marks.map((m) => (
        <span
          key={m}
          className="absolute right-0 -translate-y-1/2 text-[11px] font-medium text-muted"
          style={{ top: (m - startMin) * PX_PER_MIN }}
        >
          {minutesToTime(m)}
        </span>
      ))}
    </div>
  );
}

export function ScheduleTimeline({
  startMin,
  endMin,
  blocks,
  emptyLabel = "No bookings",
  compact,
  hideAxis,
}: {
  startMin: number;
  endMin: number;
  blocks: TimelineBlock[];
  emptyLabel?: string;
  compact?: boolean;
  hideAxis?: boolean;
}) {
  const height = Math.max((endMin - startMin) * PX_PER_MIN, 120);

  const hourMarks = useMemo(() => {
    const marks: number[] = [];
    const first = Math.ceil(startMin / 60) * 60;
    for (let m = first; m <= endMin; m += 60) marks.push(m);
    return marks;
  }, [startMin, endMin]);

  return (
    <div className="flex gap-3">
      {!hideAxis ? <TimeAxis startMin={startMin} endMin={endMin} /> : null}

      <div
        className="relative flex-1 rounded-xl border border-border bg-surface"
        style={{ height }}
      >
        {hourMarks.map((m) => (
          <div
            key={m}
            className="absolute inset-x-0 border-t border-border/70"
            style={{ top: (m - startMin) * PX_PER_MIN }}
          />
        ))}

        {blocks.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
            {emptyLabel}
          </div>
        ) : null}

        {blocks.map((b) => {
          const top = Math.max(b.startMin - startMin, 0) * PX_PER_MIN;
          const rawH = (Math.min(b.endMin, endMin) - Math.max(b.startMin, startMin)) *
            PX_PER_MIN;
          const h = Math.max(rawH, 22);
          return (
            <button
              key={b.id}
              onClick={b.onClick}
              disabled={!b.onClick}
              className={cn(
                "absolute inset-x-1.5 overflow-hidden rounded-lg border px-2.5 py-1 text-left transition-shadow",
                kindStyles[b.kind],
                b.onClick && "hover:shadow-[var(--shadow-card)]",
                b.status === "CANCELLED" && "opacity-50 line-through",
              )}
              style={{ top, height: h }}
            >
              <p className={cn("truncate font-medium", compact ? "text-[11px]" : "text-xs")}>
                {b.title}
              </p>
              {b.subtitle && !compact ? (
                <p className="truncate text-[11px] opacity-80">{b.subtitle}</p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
