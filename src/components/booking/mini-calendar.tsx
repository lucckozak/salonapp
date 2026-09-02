"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DAY_LABELS_SHORT } from "@/lib/types";
import { addDays, fmt, startOfDay } from "@/lib/time";

interface MiniCalendarProps {
  value: Date | null;
  onSelect: (day: Date) => void;
  /** yyyy-MM-dd strings that are selectable */
  enabledDays: Set<string>;
  minDate?: Date;
  maxDate?: Date;
  loading?: boolean;
}

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function MiniCalendar({
  value,
  onSelect,
  enabledDays,
  minDate,
  maxDate,
  loading,
}: MiniCalendarProps) {
  const today = startOfDay(new Date());
  const [cursor, setCursor] = useState(
    startOfDay(value ?? minDate ?? today),
  );

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

  const cells = useMemo(() => {
    const leading = monthStart.getDay(); // 0 = Sun
    const total = leading + monthEnd.getDate();
    const rows = Math.ceil(total / 7) * 7;
    return Array.from({ length: rows }, (_, i) => {
      const dayNum = i - leading + 1;
      if (dayNum < 1 || dayNum > monthEnd.getDate()) return null;
      return new Date(cursor.getFullYear(), cursor.getMonth(), dayNum);
    });
  }, [cursor, monthStart, monthEnd]);

  const canPrev =
    !minDate ||
    new Date(cursor.getFullYear(), cursor.getMonth(), 1) > startOfDay(minDate);
  const canNext =
    !maxDate ||
    new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) <=
      startOfDay(maxDate);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between px-1 pb-3">
        <p className="font-serif text-lg text-foreground">
          {fmt.monthYear(cursor)}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() =>
              canPrev &&
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
            disabled={!canPrev}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-sunken hover:text-foreground disabled:opacity-30"
            aria-label="Previous month"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            onClick={() =>
              canNext &&
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
            disabled={!canNext}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-sunken hover:text-foreground disabled:opacity-30"
            aria-label="Next month"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted">
        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
          <div key={d} className="py-1">
            {DAY_LABELS_SHORT[d as 0].charAt(0)}
          </div>
        ))}
      </div>

      <div
        className={cn(
          "mt-1 grid grid-cols-7 gap-1",
          loading && "pointer-events-none opacity-50",
        )}
      >
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const key = iso(day);
          const isPast = day < today;
          const belowMin = minDate && day < startOfDay(minDate);
          const aboveMax = maxDate && day > startOfDay(maxDate);
          const enabled =
            enabledDays.has(key) && !isPast && !belowMin && !aboveMax;
          const selected = value && iso(value) === key;
          const isToday = iso(today) === key;

          return (
            <button
              key={i}
              disabled={!enabled}
              onClick={() => enabled && onSelect(day)}
              className={cn(
                "relative aspect-square rounded-xl text-sm font-medium transition-colors",
                selected
                  ? "bg-primary text-primary-foreground"
                  : enabled
                    ? "text-foreground hover:bg-primary-soft"
                    : "text-muted/40",
                isToday && !selected && "ring-1 ring-border-strong",
              )}
            >
              {day.getDate()}
              {enabled && !selected ? (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary/50" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
