"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  employeeWindow,
  employeeWorksOn,
  getDaySlots,
  getFreeWindows,
} from "@/lib/availability";
import { addDays, fmt, minutesToTime, startOfDay } from "@/lib/time";
import { formatDuration, formatPrice } from "@/lib/utils";
import { Select } from "@/components/ui/field";

const DAYS_AHEAD = 14;

export function AvailabilityExplorer({ employeeId }: { employeeId: string }) {
  const { db } = useStore();
  const ctx = useMemo(() => ({ db }), [db]);
  const today = startOfDay(new Date());

  const employee = db.employees.find((e) => e.id === employeeId);
  const services = useMemo(
    () =>
      db.services.filter(
        (s) => s.active && employee?.serviceIds.includes(s.id),
      ),
    [db.services, employee],
  );

  const days = useMemo(
    () =>
      Array.from({ length: DAYS_AHEAD }, (_, i) => {
        const d = addDays(today, i);
        return { date: d, works: employeeWorksOn(ctx, employeeId, d) };
      }),
    [ctx, employeeId],
  );

  const firstWorking = days.find((d) => d.works)?.date ?? today;
  const [selected, setSelected] = useState<Date>(firstWorking);
  const [serviceId, setServiceId] = useState<string>("");

  const service = serviceId
    ? db.services.find((s) => s.id === serviceId)
    : null;

  const win = employeeWindow(ctx, employeeId, selected);
  const works = employeeWorksOn(ctx, employeeId, selected);

  const slots = useMemo(
    () =>
      serviceId ? getDaySlots(ctx, serviceId, employeeId, selected) : [],
    [ctx, serviceId, employeeId, selected],
  );
  const windows = useMemo(
    () => (!serviceId ? getFreeWindows(ctx, employeeId, selected, 15) : []),
    [ctx, serviceId, employeeId, selected],
  );

  const isoDate = fmt.isoDate(selected);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <CalendarClock size={16} className="text-primary" />
        Check availability
      </div>

      {/* day strip */}
      <div className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {days.map(({ date, works: dayWorks }) => {
          const active = fmt.isoDate(date) === isoDate;
          return (
            <button
              key={date.toISOString()}
              onClick={() => dayWorks && setSelected(date)}
              disabled={!dayWorks}
              className={`flex min-w-[3.75rem] shrink-0 flex-col items-center rounded-xl border px-2 py-2 text-xs transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : dayWorks
                    ? "border-border bg-surface text-foreground hover:border-primary/50"
                    : "border-transparent bg-surface-muted text-muted/50"
              }`}
            >
              <span className="font-medium">
                {fmt.isoDate(date) === fmt.isoDate(today)
                  ? "Today"
                  : fmt.isoDate(date) === fmt.isoDate(addDays(today, 1))
                    ? "Tmrw"
                    : fmt.weekdayShort(date)}
              </span>
              <span className="mt-0.5 text-[15px] font-semibold leading-none">
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* treatment filter */}
      <div className="mt-3">
        <Select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="h-10 text-sm"
        >
          <option value="">Any treatment — show open times</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {formatDuration(s.durationMinutes)} ·{" "}
              {formatPrice(s.price, db.settings.currency)}
            </option>
          ))}
        </Select>
      </div>

      {/* result */}
      <div className="mt-4">
        <p className="text-xs text-muted">
          {fmt.fullDate(selected)}
          {works && win
            ? ` · works ${minutesToTime(win.start)}–${minutesToTime(win.end)}`
            : ""}
        </p>

        {!works ? (
          <p className="mt-3 rounded-xl bg-surface-sunken px-3 py-6 text-center text-sm text-muted">
            Not working this day.
          </p>
        ) : service ? (
          slots.length === 0 ? (
            <p className="mt-3 rounded-xl bg-surface-sunken px-3 py-6 text-center text-sm text-muted">
              Fully booked — no {formatDuration(service.durationMinutes)} openings
              on this day.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <Link
                  key={slot.time}
                  href={`/book?employee=${employeeId}&service=${serviceId}&date=${isoDate}&time=${slot.time}`}
                  className="rounded-xl border border-border bg-surface py-2 text-center text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {fmt.time(slot.iso)}
                </Link>
              ))}
            </div>
          )
        ) : windows.length === 0 ? (
          <p className="mt-3 rounded-xl bg-surface-sunken px-3 py-6 text-center text-sm text-muted">
            Fully booked on this day.
          </p>
        ) : (
          <>
            <div className="mt-3 space-y-2">
              {windows.map((w, i) => (
                <Link
                  key={i}
                  href={`/book?employee=${employeeId}&date=${isoDate}&time=${minutesToTime(
                    w.start,
                  )}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm transition-colors hover:border-primary/50"
                >
                  <span className="font-medium text-foreground">
                    {minutesToTime(w.start)} – {minutesToTime(w.end)}
                    <span className="ml-2 font-normal text-muted">
                      {formatDuration(w.end - w.start)} free
                    </span>
                  </span>
                  <ArrowRight size={15} className="text-primary" />
                </Link>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Pick a treatment above for exact appointment times, or tap a window
              to start booking.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
