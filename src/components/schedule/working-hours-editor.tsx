"use client";

import type { DayOfWeek, WorkingHour } from "@/lib/types";
import { DAY_LABELS } from "@/lib/types";
import { Switch } from "@/components/ui/misc";

export type HoursMap = Record<DayOfWeek, [string, string] | null>;

const ORDER: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

export function hoursFromRows(rows: WorkingHour[]): HoursMap {
  const map = {} as HoursMap;
  for (let d = 0 as DayOfWeek; d <= 6; d = (d + 1) as DayOfWeek) {
    const row = rows.find((r) => r.dayOfWeek === d);
    map[d] = row && row.startTime && row.endTime ? [row.startTime, row.endTime] : null;
  }
  return map;
}

export function WorkingHoursEditor({
  value,
  onChange,
}: {
  value: HoursMap;
  onChange: (next: HoursMap) => void;
}) {
  function set(day: DayOfWeek, next: [string, string] | null) {
    onChange({ ...value, [day]: next });
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {ORDER.map((day) => {
        const v = value[day];
        return (
          <div
            key={day}
            className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap"
          >
            <div className="w-24 shrink-0 text-sm font-medium text-foreground">
              {DAY_LABELS[day]}
            </div>
            <Switch
              checked={!!v}
              onChange={(on) => set(day, on ? ["09:00", "17:00"] : null)}
            />
            {v ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={v[0]}
                  onChange={(e) => set(day, [e.target.value, v[1]])}
                  className="h-9 rounded-lg border border-border-strong bg-surface px-2 text-sm"
                />
                <span className="text-muted">–</span>
                <input
                  type="time"
                  value={v[1]}
                  onChange={(e) => set(day, [v[0], e.target.value])}
                  className="h-9 rounded-lg border border-border-strong bg-surface px-2 text-sm"
                />
              </div>
            ) : (
              <span className="text-sm text-muted">Day off</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
