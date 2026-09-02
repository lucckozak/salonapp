"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  buildDayTimeline,
  employeeWindow,
  salonWindow,
} from "@/lib/availability";
import { addDays, fmt, isSameDay, startOfDay, toDate } from "@/lib/time";
import { DAY_LABELS_SHORT } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Segmented, EmptyState } from "@/components/ui/misc";
import {
  ScheduleTimeline,
  TimeAxis,
  type TimelineBlock,
} from "@/components/calendar/schedule-timeline";

type ViewMode = "day" | "week" | "month";

export function EmployeeSchedule({
  employeeId,
  onSelectAppointment,
  defaultMode = "week",
  dayOffLabel = "Not scheduled to work this day.",
}: {
  employeeId: string;
  onSelectAppointment?: (appointmentId: string) => void;
  defaultMode?: ViewMode;
  dayOffLabel?: string;
}) {
  const { db } = useStore();
  const ctx = useMemo(() => ({ db }), [db]);
  const [mode, setMode] = useState<ViewMode>(defaultMode);
  const [anchor, setAnchor] = useState(startOfDay(new Date()));

  const windowFor = (day: Date) => {
    const emp = employeeWindow(ctx, employeeId, day);
    const salon = salonWindow(ctx, day);
    if (!emp || !salon) return null;
    return {
      start: Math.max(emp.start, salon.open) - 30,
      end: Math.min(emp.end, salon.close) + 30,
    };
  };

  const blocksFor = (day: Date): TimelineBlock[] =>
    buildDayTimeline({ ...ctx, db }, employeeId, day).map((iv, i) => ({
      id: `${day.toISOString()}-${i}`,
      startMin: iv.start,
      endMin: iv.end,
      kind: iv.kind ?? "appointment",
      title:
        iv.kind === "appointment"
          ? (iv.customerLabel ?? "Appointment")
          : (iv.label ?? "Blocked"),
      subtitle: iv.serviceLabel,
      status:
        iv.appointmentId != null
          ? db.appointments.find((a) => a.id === iv.appointmentId)?.status
          : undefined,
      onClick:
        iv.appointmentId && onSelectAppointment
          ? () => onSelectAppointment(iv.appointmentId!)
          : undefined,
    }));

  const step = mode === "day" ? 1 : mode === "week" ? 7 : 30;
  const wkStart = weekStart(anchor);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAnchor(addDays(anchor, -step))}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAnchor(addDays(anchor, step))}
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAnchor(startOfDay(new Date()))}
          >
            Today
          </Button>
        </div>
        <p className="font-serif text-lg text-foreground">
          {mode === "month"
            ? fmt.monthYear(anchor)
            : mode === "week"
              ? `Week of ${fmt.dayMonth(wkStart)}`
              : fmt.fullDate(anchor)}
        </p>
        <div className="ml-auto">
          <Segmented
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
        </div>
      </div>

      {mode === "day" && (
        <DayView day={anchor} windowFor={windowFor} blocksFor={blocksFor} dayOffLabel={dayOffLabel} />
      )}
      {mode === "week" && (
        <WeekView start={wkStart} windowFor={windowFor} blocksFor={blocksFor} />
      )}
      {mode === "month" && (
        <MonthView
          anchor={anchor}
          employeeId={employeeId}
          onPick={(d) => {
            setAnchor(d);
            setMode("day");
          }}
        />
      )}
    </div>
  );
}

function weekStart(d: Date) {
  const s = startOfDay(d);
  s.setDate(s.getDate() - s.getDay());
  return s;
}

function DayView({
  day,
  windowFor,
  blocksFor,
  dayOffLabel,
}: {
  day: Date;
  windowFor: (d: Date) => { start: number; end: number } | null;
  blocksFor: (d: Date) => TimelineBlock[];
  dayOffLabel: string;
}) {
  const win = windowFor(day);
  if (!win)
    return <EmptyState title="Day off" description={dayOffLabel} />;
  return (
    <div className="max-w-xl">
      <ScheduleTimeline
        startMin={win.start}
        endMin={win.end}
        blocks={blocksFor(day)}
        emptyLabel="No bookings"
      />
    </div>
  );
}

function WeekView({
  start,
  windowFor,
  blocksFor,
}: {
  start: Date;
  windowFor: (d: Date) => { start: number; end: number } | null;
  blocksFor: (d: Date) => TimelineBlock[];
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const bounds = days.reduce(
    (acc, d) => {
      const w = windowFor(d);
      if (!w) return acc;
      return {
        start: Math.min(acc.start, w.start),
        end: Math.max(acc.end, w.end),
      };
    },
    { start: 24 * 60, end: 0 },
  );
  if (bounds.end <= bounds.start)
    return <EmptyState title="No working days this week" />;

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[760px] gap-2">
        <div className="pt-7">
          <TimeAxis startMin={bounds.start} endMin={bounds.end} />
        </div>
        <div className="grid flex-1 grid-cols-7 gap-2">
          {days.map((d) => (
            <div key={d.toISOString()}>
              <p
                className={`mb-2 text-center text-xs font-medium ${
                  isSameDay(d, new Date()) ? "text-primary" : "text-muted"
                }`}
              >
                {DAY_LABELS_SHORT[d.getDay() as 0]} {d.getDate()}
              </p>
              <ScheduleTimeline
                startMin={bounds.start}
                endMin={bounds.end}
                blocks={blocksFor(d)}
                emptyLabel="—"
                compact
                hideAxis
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthView({
  anchor,
  employeeId,
  onPick,
}: {
  anchor: Date;
  employeeId: string;
  onPick: (d: Date) => void;
}) {
  const { db } = useStore();
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const lead = first.getDay();
  const daysInMonth = new Date(
    anchor.getFullYear(),
    anchor.getMonth() + 1,
    0,
  ).getDate();
  const cells = Array.from(
    { length: Math.ceil((lead + daysInMonth) / 7) * 7 },
    (_, i) => {
      const n = i - lead + 1;
      return n >= 1 && n <= daysInMonth
        ? new Date(anchor.getFullYear(), anchor.getMonth(), n)
        : null;
    },
  );

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {[0, 1, 2, 3, 4, 5, 6].map((d) => (
        <div
          key={d}
          className="pb-1 text-center text-[11px] font-medium text-muted"
        >
          {DAY_LABELS_SHORT[d as 0]}
        </div>
      ))}
      {cells.map((d, i) => {
        if (!d) return <div key={i} />;
        const dayAppts = db.appointments.filter(
          (a) =>
            a.employeeId === employeeId &&
            a.status !== "CANCELLED" &&
            isSameDay(toDate(a.start), d),
        );
        const isToday = isSameDay(d, new Date());
        return (
          <button
            key={i}
            onClick={() => onPick(d)}
            className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-sm transition-colors ${
              isToday
                ? "border-primary bg-primary-soft/50"
                : "border-border bg-surface hover:border-primary/40"
            }`}
          >
            <span className="font-medium text-foreground">{d.getDate()}</span>
            {dayAppts.length > 0 ? (
              <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {dayAppts.length}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
