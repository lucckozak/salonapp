import type {
  Appointment,
  Database,
  DayOfWeek,
  Employee,
  Service,
} from "./types";
import { ACTIVE_STATUSES } from "./types";
import {
  addDays,
  atTime,
  dayOfWeek,
  isSameDay,
  minutesToTime,
  overlaps,
  startOfDay,
  timeToMinutes,
  toDate,
} from "./time";

export interface Interval {
  start: number; // minutes since midnight
  end: number;
  label?: string;
  kind?: "appointment" | "break" | "vacation" | "blocked";
}

export interface DaySlot {
  /** "HH:mm" */
  time: string;
  /** ISO datetime of the slot start */
  iso: string;
  /** employees who can take this slot */
  employeeIds: string[];
}

interface SlotContext {
  db: Pick<
    Database,
    | "appointments"
    | "employees"
    | "services"
    | "workingHours"
    | "recurringBreaks"
    | "timeBlocks"
    | "settings"
  >;
  /** ISO datetime treated as "now" for lead-time checks */
  now?: Date;
  /** appointment id to ignore (when rescheduling) */
  ignoreAppointmentId?: string;
}

/* ------------------------------------------------------------------ *
 * Building blocks
 * ------------------------------------------------------------------ */

export function salonWindow(
  ctx: SlotContext,
  day: Date,
): { open: number; close: number } | null {
  const oh = ctx.db.settings.openingHours.find(
    (o) => o.dayOfWeek === dayOfWeek(day),
  );
  if (!oh || !oh.open || !oh.close) return null;
  return { open: timeToMinutes(oh.open), close: timeToMinutes(oh.close) };
}

export function employeeWindow(
  ctx: SlotContext,
  employeeId: string,
  day: Date,
): { start: number; end: number } | null {
  const wh = ctx.db.workingHours.find(
    (w) => w.employeeId === employeeId && w.dayOfWeek === dayOfWeek(day),
  );
  if (!wh || !wh.startTime || !wh.endTime) return null;
  return { start: timeToMinutes(wh.startTime), end: timeToMinutes(wh.endTime) };
}

/** All hard-busy intervals (breaks, blocks, vacation) for an employee on a day. */
export function employeeBusyIntervals(
  ctx: SlotContext,
  employeeId: string,
  day: Date,
): Interval[] {
  const out: Interval[] = [];
  const dow = dayOfWeek(day) as DayOfWeek;

  for (const rb of ctx.db.recurringBreaks) {
    if (rb.employeeId === employeeId && rb.dayOfWeek === dow) {
      out.push({
        start: timeToMinutes(rb.startTime),
        end: timeToMinutes(rb.endTime),
        label: rb.label,
        kind: "break",
      });
    }
  }

  for (const tb of ctx.db.timeBlocks) {
    if (tb.employeeId !== employeeId) continue;
    const s = toDate(tb.start);
    const e = toDate(tb.end);
    if (e <= startOfDay(day) || s >= startOfDay(addDays(day, 1))) continue;
    const startMin = isSameDay(s, day) ? s.getHours() * 60 + s.getMinutes() : 0;
    const endMin = isSameDay(e, day) ? e.getHours() * 60 + e.getMinutes() : 24 * 60;
    out.push({
      start: startMin,
      end: endMin,
      label: tb.reason ?? tb.type,
      kind: tb.type === "VACATION" ? "vacation" : tb.type === "BLOCKED" ? "blocked" : "break",
    });
  }

  return out;
}

/** Appointment intervals for an employee on a day (active statuses only). */
export function employeeAppointmentIntervals(
  ctx: SlotContext,
  employeeId: string,
  day: Date,
): Interval[] {
  return ctx.db.appointments
    .filter(
      (a) =>
        a.employeeId === employeeId &&
        a.id !== ctx.ignoreAppointmentId &&
        ACTIVE_STATUSES.includes(a.status) &&
        isSameDay(toDate(a.start), day),
    )
    .map((a) => {
      const s = toDate(a.start);
      const e = toDate(a.end);
      return {
        start: s.getHours() * 60 + s.getMinutes(),
        end: e.getHours() * 60 + e.getMinutes(),
        kind: "appointment" as const,
      };
    });
}

function employeeOffAllDay(ctx: SlotContext, employeeId: string, day: Date) {
  return ctx.db.timeBlocks.some((tb) => {
    if (tb.employeeId !== employeeId || tb.type !== "VACATION") return false;
    const s = toDate(tb.start);
    const e = toDate(tb.end);
    return s <= startOfDay(day) && e >= startOfDay(addDays(day, 1));
  });
}

/** Does this employee have any working hours on `day` (and isn't on all-day leave)? */
export function employeeWorksOn(
  ctx: SlotContext,
  employeeId: string,
  day: Date,
): boolean {
  if (employeeOffAllDay(ctx, employeeId, day)) return false;
  const emp = employeeWindow(ctx, employeeId, day);
  const salon = salonWindow(ctx, day);
  if (!emp || !salon) return false;
  return Math.min(salon.close, emp.end) > Math.max(salon.open, emp.start);
}

/**
 * Free time windows for an employee on a day — working hours intersected with
 * the salon's, minus appointments (+ buffer), breaks, and blocks. Treatment-
 * agnostic: use this to *browse* a specialist's openings before choosing a
 * service. Gaps shorter than `minMinutes` are dropped.
 */
export function getFreeWindows(
  ctx: SlotContext,
  employeeId: string,
  day: Date,
  minMinutes = 15,
): { start: number; end: number }[] {
  if (!employeeWorksOn(ctx, employeeId, day)) return [];
  const salon = salonWindow(ctx, day)!;
  const emp = employeeWindow(ctx, employeeId, day)!;

  let windowStart = Math.max(salon.open, emp.start);
  const windowEnd = Math.min(salon.close, emp.end);

  const now = ctx.now ?? new Date();
  if (isSameDay(now, day)) {
    const step = ctx.db.settings.slotIntervalMinutes;
    const earliest =
      now.getHours() * 60 +
      now.getMinutes() +
      ctx.db.settings.minLeadTimeHours * 60;
    // round the earliest bookable moment up to the slot grid so browsing
    // windows read cleanly (e.g. 14:00 rather than 13:51)
    windowStart = Math.max(windowStart, Math.ceil(earliest / step) * step);
  }
  if (windowEnd - windowStart < minMinutes) return [];

  const buffer = ctx.db.settings.bufferMinutes;
  const busy = [
    ...employeeBusyIntervals(ctx, employeeId, day),
    ...employeeAppointmentIntervals(ctx, employeeId, day).map((iv) => ({
      start: iv.start - buffer,
      end: iv.end + buffer,
    })),
  ]
    .map((iv) => ({
      start: Math.max(iv.start, windowStart),
      end: Math.min(iv.end, windowEnd),
    }))
    .filter((iv) => iv.end > iv.start)
    .sort((a, b) => a.start - b.start);

  const merged: { start: number; end: number }[] = [];
  for (const iv of busy) {
    const last = merged[merged.length - 1];
    if (last && iv.start <= last.end) last.end = Math.max(last.end, iv.end);
    else merged.push({ ...iv });
  }

  const free: { start: number; end: number }[] = [];
  let cursor = windowStart;
  for (const iv of merged) {
    if (iv.start - cursor >= minMinutes) free.push({ start: cursor, end: iv.start });
    cursor = Math.max(cursor, iv.end);
  }
  if (windowEnd - cursor >= minMinutes) free.push({ start: cursor, end: windowEnd });
  return free;
}

/* ------------------------------------------------------------------ *
 * Core: slots for one employee
 * ------------------------------------------------------------------ */

export function slotsForEmployee(
  ctx: SlotContext,
  employee: Employee,
  service: Service,
  day: Date,
): string[] {
  if (!employee.active) return [];
  if (!employee.serviceIds.includes(service.id)) return [];
  if (employeeOffAllDay(ctx, employee.id, day)) return [];

  const salon = salonWindow(ctx, day);
  if (!salon) return [];
  const emp = employeeWindow(ctx, employee.id, day);
  if (!emp) return [];

  const windowStart = Math.max(salon.open, emp.start);
  const windowEnd = Math.min(salon.close, emp.end);
  if (windowEnd - windowStart < service.durationMinutes) return [];

  const step = ctx.db.settings.slotIntervalMinutes;
  const buffer = ctx.db.settings.bufferMinutes;
  const hardBusy = employeeBusyIntervals(ctx, employee.id, day);
  const apptBusy = employeeAppointmentIntervals(ctx, employee.id, day);

  const now = ctx.now ?? new Date();
  const minStartToday = isSameDay(now, day)
    ? now.getHours() * 60 +
      now.getMinutes() +
      ctx.db.settings.minLeadTimeHours * 60
    : -Infinity;

  const slots: string[] = [];
  for (
    let s = windowStart;
    s + service.durationMinutes <= windowEnd;
    s += step
  ) {
    if (s < minStartToday) continue;
    const e = s + service.durationMinutes;

    // hard-busy: service body must not overlap
    if (hardBusy.some((iv) => overlaps(s, e, iv.start, iv.end))) continue;

    // appointments: need `buffer` clearance on each side
    if (
      apptBusy.some((iv) =>
        overlaps(s - buffer, e + buffer, iv.start, iv.end),
      )
    ) {
      continue;
    }

    slots.push(minutesToTime(s));
  }
  return slots;
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

export function getDaySlots(
  ctx: SlotContext,
  serviceId: string,
  employeeSelection: string | "any",
  day: Date,
): DaySlot[] {
  const service = findService(ctx, serviceId);
  if (!service || !service.active) return [];

  const candidates =
    employeeSelection === "any"
      ? ctx.db.employees.filter(
          (e) => e.active && e.serviceIds.includes(serviceId),
        )
      : ctx.db.employees.filter((e) => e.id === employeeSelection);

  const byTime = new Map<string, string[]>();
  for (const emp of candidates) {
    for (const time of slotsForEmployee(ctx, emp, service, day)) {
      const arr = byTime.get(time) ?? [];
      arr.push(emp.id);
      byTime.set(time, arr);
    }
  }

  return [...byTime.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, employeeIds]) => ({
      time,
      iso: atTime(day, time).toISOString(),
      employeeIds,
    }));
}

/** Which days in [from, to] have at least one slot — used to enable calendar days. */
export function getAvailableDates(
  ctx: SlotContext,
  serviceId: string,
  employeeSelection: string | "any",
  from: Date,
  to: Date,
): Set<string> {
  const out = new Set<string>();
  let cursor = startOfDay(from);
  const end = startOfDay(to);
  while (cursor <= end) {
    if (getDaySlots(ctx, serviceId, employeeSelection, cursor).length > 0) {
      out.add(isoDay(cursor));
    }
    cursor = addDays(cursor, 1);
  }
  return out;
}

/** Validate a concrete booking request (used on confirm + admin manual create). */
export function isSlotBookable(
  ctx: SlotContext,
  serviceId: string,
  employeeId: string,
  start: Date,
): boolean {
  const service = findService(ctx, serviceId);
  if (!service) return false;
  const emp = ctx.db.employees.find((e) => e.id === employeeId);
  if (!emp) return false;
  const time = `${String(start.getHours()).padStart(2, "0")}:${String(
    start.getMinutes(),
  ).padStart(2, "0")}`;
  return slotsForEmployee(ctx, emp, service, start).includes(time);
}

/** Pick the best employee for an "any specialist" booking (lightest load that day). */
export function pickEmployeeForSlot(
  ctx: SlotContext,
  serviceId: string,
  start: Date,
  preferred?: string[],
): string | null {
  const pool =
    preferred && preferred.length
      ? preferred
      : ctx.db.employees
          .filter((e) => e.active && e.serviceIds.includes(serviceId))
          .map((e) => e.id);

  const bookable = pool.filter((id) =>
    isSlotBookable(ctx, serviceId, id, start),
  );
  if (!bookable.length) return null;

  return bookable
    .map((id) => ({
      id,
      load: ctx.db.appointments.filter(
        (a) =>
          a.employeeId === id &&
          ACTIVE_STATUSES.includes(a.status) &&
          isSameDay(toDate(a.start), start),
      ).length,
    }))
    .sort((a, b) => a.load - b.load)[0].id;
}

export function nextAvailableDate(
  ctx: SlotContext,
  serviceId: string,
  employeeSelection: string | "any",
  from: Date = new Date(),
): Date | null {
  let cursor = startOfDay(from);
  const limit = addDays(cursor, ctx.db.settings.maxAdvanceDays);
  while (cursor <= limit) {
    if (getDaySlots(ctx, serviceId, employeeSelection, cursor).length > 0) {
      return cursor;
    }
    cursor = addDays(cursor, 1);
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function findService(ctx: SlotContext, id: string): Service | undefined {
  return ctx.db.services.find((s) => s.id === id);
}

function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Build the visual timeline for an employee's day (calendar views). */
export function buildDayTimeline(
  ctx: SlotContext & { db: Database },
  employeeId: string,
  day: Date,
): (Interval & { customerLabel?: string; serviceLabel?: string; appointmentId?: string })[] {
  const rows: (Interval & {
    customerLabel?: string;
    serviceLabel?: string;
    appointmentId?: string;
  })[] = [];

  for (const iv of employeeBusyIntervals(ctx, employeeId, day)) rows.push(iv);

  const appts = ctx.db.appointments.filter(
    (a) =>
      a.employeeId === employeeId &&
      isSameDay(toDate(a.start), day) &&
      a.status !== "CANCELLED",
  );
  for (const a of appts) {
    const s = toDate(a.start);
    const e = toDate(a.end);
    const customer = ctx.db.users.find((u) => u.id === a.customerId);
    const service = ctx.db.services.find((sv) => sv.id === a.serviceId);
    rows.push({
      start: s.getHours() * 60 + s.getMinutes(),
      end: e.getHours() * 60 + e.getMinutes(),
      kind: "appointment",
      appointmentId: a.id,
      customerLabel: customer
        ? `${customer.firstName} ${customer.lastName}`
        : "Customer",
      serviceLabel: service?.name,
    });
  }

  return rows.sort((a, b) => a.start - b.start);
}

/**
 * Utilization for one employee over [from, to): booked minutes (active
 * appointments) as a share of available working minutes (working hours minus
 * breaks/blocks — the time they *could* have been booked).
 */
export function employeeUtilization(
  ctx: SlotContext,
  employeeId: string,
  from: Date,
  to: Date,
): { bookedMinutes: number; availableMinutes: number; percent: number } {
  let bookedMinutes = 0;
  let availableMinutes = 0;

  let cursor = startOfDay(from);
  const end = startOfDay(to);
  while (cursor < end) {
    const emp = employeeWindow(ctx, employeeId, cursor);
    const salon = salonWindow(ctx, cursor);
    if (emp && salon && !ctx.db.timeBlocks.some((tb) => {
      if (tb.employeeId !== employeeId || tb.type !== "VACATION") return false;
      const s = toDate(tb.start);
      const e = toDate(tb.end);
      return s <= cursor && e >= addDays(cursor, 1);
    })) {
      const windowStart = Math.max(emp.start, salon.open);
      const windowEnd = Math.min(emp.end, salon.close);
      if (windowEnd > windowStart) {
        const busyMinutes = employeeBusyIntervals(ctx, employeeId, cursor)
          .map((iv) => ({
            start: Math.max(iv.start, windowStart),
            end: Math.min(iv.end, windowEnd),
          }))
          .filter((iv) => iv.end > iv.start)
          .reduce((s, iv) => s + (iv.end - iv.start), 0);
        availableMinutes += windowEnd - windowStart - busyMinutes;
      }
    }

    bookedMinutes += employeeAppointmentIntervals(ctx, employeeId, cursor).reduce(
      (s, iv) => s + (iv.end - iv.start),
      0,
    );

    cursor = addDays(cursor, 1);
  }

  return {
    bookedMinutes,
    availableMinutes,
    percent:
      availableMinutes > 0
        ? Math.round((bookedMinutes / availableMinutes) * 100)
        : 0,
  };
}
