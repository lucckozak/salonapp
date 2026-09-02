"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  buildDayTimeline,
  employeeWindow,
  salonWindow,
} from "@/lib/availability";
import { addDays, fmt, startOfDay } from "@/lib/time";
import { fullName } from "@/lib/utils";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Avatar } from "@/components/ui/avatar";
import {
  ScheduleTimeline,
  TimeAxis,
  type TimelineBlock,
} from "@/components/calendar/schedule-timeline";
import { AppointmentEditorDialog } from "@/components/appointments/appointment-editor-dialog";

export default function AdminCalendarPage() {
  const { db } = useStore();
  const [day, setDay] = useState(startOfDay(new Date()));
  const [editorId, setEditorId] = useState<string | null>(null);
  const [preset, setPreset] = useState<{ employeeId: string; startIso: string } | null>(
    null,
  );

  const ctx = useMemo(() => ({ db }), [db]);
  const employees = db.employees.filter((e) => e.active);
  const salon = salonWindow(ctx, day);

  const bounds = useMemo(() => {
    if (!salon) return null;
    let start = salon.open;
    let end = salon.close;
    for (const e of employees) {
      const w = employeeWindow(ctx, e.id, day);
      if (w) {
        start = Math.min(start, w.start);
        end = Math.max(end, w.end);
      }
    }
    return { start: start - 15, end: end + 15 };
  }, [ctx, employees, day, salon]);

  return (
    <div>
      <PageHeading
        title="Salon calendar"
        description="Every specialist's day at a glance."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDay(addDays(day, -1))}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDay(startOfDay(new Date()))}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDay(addDays(day, 1))}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        }
      />

      <p className="mb-5 font-serif text-lg text-foreground">
        {fmt.fullDate(day)}
      </p>

      {!salon || !bounds ? (
        <EmptyState
          title="Salon closed"
          description="No opening hours are set for this day."
        />
      ) : (
        <div className="overflow-x-auto pb-4">
          <div
            className="flex gap-4"
            style={{ minWidth: employees.length * 190 + 90 }}
          >
            <div className="shrink-0 pt-[52px]">
              <TimeAxis startMin={bounds.start} endMin={bounds.end} />
            </div>
            {employees.map((e) => {
              const u = db.users.find((x) => x.id === e.userId)!;
              const win = employeeWindow(ctx, e.id, day);
              const rows = buildDayTimeline({ ...ctx, db }, e.id, day);
              const blocks: TimelineBlock[] = rows.map((iv, i) => ({
                id: `${e.id}-${i}`,
                startMin: iv.start,
                endMin: iv.end,
                kind: iv.kind ?? "appointment",
                title:
                  iv.kind === "appointment"
                    ? (iv.customerLabel ?? "Appointment")
                    : (iv.label ?? "Blocked"),
                subtitle: iv.serviceLabel,
                onClick: iv.appointmentId
                  ? () => setEditorId(iv.appointmentId!)
                  : undefined,
              }));

              return (
                <div key={e.id} className="w-[220px] shrink-0">
                  <div className="mb-2 flex items-center gap-2">
                    <Avatar src={e.profileImage} name={fullName(u)} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {u.firstName}
                      </p>
                      <p className="truncate text-[11px] text-muted">
                        {win ? `${win.start / 60 | 0}:00–${win.end / 60 | 0}:00` : "Off"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setPreset({
                          employeeId: e.id,
                          startIso: day.toISOString(),
                        });
                      }}
                      className="ml-auto rounded-lg p-1.5 text-muted hover:bg-surface-sunken hover:text-foreground"
                      aria-label="Add"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  {win ? (
                    <ScheduleTimeline
                      startMin={bounds.start}
                      endMin={bounds.end}
                      blocks={blocks}
                      emptyLabel="Free"
                      compact
                      hideAxis
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted">
                      Day off
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AppointmentEditorDialog
        open={!!editorId}
        appointmentId={editorId}
        onClose={() => setEditorId(null)}
      />
      <AppointmentEditorDialog
        open={!!preset}
        presets={preset ?? undefined}
        onClose={() => setPreset(null)}
      />
    </div>
  );
}
