import type { Appointment, Database, Service, User } from "./types";
import { isSameDay, startOfDay, toDate } from "./time";
import { employeeUtilization } from "./availability";

export interface AppointmentView {
  appt: Appointment;
  customer?: User;
  employeeUser?: User;
  employeeId: string;
  service?: Service;
  start: Date;
  end: Date;
}

export function viewAppointment(
  db: Pick<Database, "users" | "employees" | "services">,
  appt: Appointment,
): AppointmentView {
  const employee = db.employees.find((e) => e.id === appt.employeeId);
  return {
    appt,
    customer: db.users.find((u) => u.id === appt.customerId),
    employeeUser: employee
      ? db.users.find((u) => u.id === employee.userId)
      : undefined,
    employeeId: appt.employeeId,
    service: db.services.find((s) => s.id === appt.serviceId),
    start: toDate(appt.start),
    end: toDate(appt.end),
  };
}

interface Filter {
  customerId?: string;
  employeeId?: string;
}

function match(a: Appointment, f: Filter) {
  if (f.customerId && a.customerId !== f.customerId) return false;
  if (f.employeeId && a.employeeId !== f.employeeId) return false;
  return true;
}

export function upcomingAppointments(
  db: Database,
  f: Filter = {},
  now: Date = new Date(),
): Appointment[] {
  return db.appointments
    .filter(
      (a) =>
        match(a, f) &&
        toDate(a.end) >= now &&
        a.status !== "CANCELLED" &&
        a.status !== "COMPLETED" &&
        a.status !== "NO_SHOW",
    )
    .sort((a, b) => +toDate(a.start) - +toDate(b.start));
}

export function pastAppointments(
  db: Database,
  f: Filter = {},
  now: Date = new Date(),
): Appointment[] {
  return db.appointments
    .filter(
      (a) =>
        match(a, f) &&
        (toDate(a.end) < now ||
          a.status === "CANCELLED" ||
          a.status === "COMPLETED" ||
          a.status === "NO_SHOW"),
    )
    .sort((a, b) => +toDate(b.start) - +toDate(a.start));
}

export function appointmentsOn(
  db: Database,
  day: Date,
  f: Filter = {},
): Appointment[] {
  return db.appointments
    .filter((a) => match(a, f) && isSameDay(toDate(a.start), day))
    .sort((a, b) => +toDate(a.start) - +toDate(b.start));
}

export function revenueForDay(db: Database, day: Date): number {
  return appointmentsOn(db, day)
    .filter((a) => a.status === "COMPLETED" || a.status === "CONFIRMED")
    .reduce(
      (sum, a) =>
        sum + (db.services.find((s) => s.id === a.serviceId)?.price ?? 0),
      0,
    );
}

export function customerStats(db: Database, customerId: string) {
  const all = db.appointments.filter((a) => a.customerId === customerId);
  const completed = all.filter((a) => a.status === "COMPLETED");
  const spend = completed.reduce(
    (s, a) => s + (db.services.find((x) => x.id === a.serviceId)?.price ?? 0),
    0,
  );
  const last = [...completed].sort(
    (a, b) => +toDate(b.start) - +toDate(a.start),
  )[0];

  // most-booked treatment (completed or upcoming), for a friendly profile stat
  const counts = new Map<string, number>();
  for (const a of all) {
    if (a.status === "CANCELLED") continue;
    counts.set(a.serviceId, (counts.get(a.serviceId) ?? 0) + 1);
  }
  const topServiceId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const favouriteService =
    topServiceId && (counts.get(topServiceId) ?? 0) > 1
      ? (db.services.find((s) => s.id === topServiceId)?.name ?? null)
      : null;

  return {
    total: all.length,
    completed: completed.length,
    upcoming: all.filter(
      (a) => toDate(a.start) > new Date() && a.status !== "CANCELLED",
    ).length,
    spend,
    lastVisit: last ? toDate(last.start) : null,
    favouriteService,
  };
}

/** Customers whose birthday (month + day) falls on `now`. */
export function todaysBirthdays(db: Database, now: Date = new Date()): User[] {
  const m = now.getMonth();
  const d = now.getDate();
  return db.users.filter((u) => {
    if (u.role !== "CUSTOMER" || !u.dateOfBirth) return false;
    const dob = toDate(u.dateOfBirth);
    return dob.getMonth() === m && dob.getDate() === d;
  });
}

export function groupServicesByCategory(services: Service[]) {
  const map = new Map<string, Service[]>();
  for (const s of services) {
    const arr = map.get(s.category) ?? [];
    arr.push(s);
    map.set(s.category, arr);
  }
  return [...map.entries()];
}

export function isCancellable(
  appt: Appointment,
  windowHours: number,
  now: Date = new Date(),
): boolean {
  if (appt.status === "CANCELLED" || appt.status === "COMPLETED") return false;
  const hoursUntil = (+toDate(appt.start) - +now) / 36e5;
  return hoursUntil >= windowHours;
}

export function nextVisit(db: Database, customerId: string, now = new Date()) {
  return upcomingAppointments(db, { customerId }, now)[0] ?? null;
}

export function todayRange(now = new Date()) {
  return startOfDay(now);
}

/* ------------------------------------------------------------------ *
 * Revenue
 * ------------------------------------------------------------------ */

export function priceOf(db: Database, a: Appointment): number {
  return db.services.find((s) => s.id === a.serviceId)?.price ?? 0;
}

/** Appointments whose start falls in [from, to). */
export function appointmentsInRange(
  db: Database,
  from: Date,
  to: Date,
): Appointment[] {
  return db.appointments.filter((a) => {
    const s = toDate(a.start);
    return s >= from && s < to;
  });
}

export interface RevenueGroup {
  id: string;
  label: string;
  count: number;
  revenue: number;
  /** employee groups only — their cut of the revenue, from Employee.commissionPercent */
  commission?: number;
  /** employee groups only — booked vs. available working minutes, 0-100 */
  utilizationPercent?: number;
}

export interface RevenueReport {
  /** COMPLETED appointments in range */
  realised: number;
  realisedCount: number;
  /** CONFIRMED appointments in range (money still to come in) */
  booked: number;
  bookedCount: number;
  noShowLost: number;
  avgTicket: number;
  byEmployee: RevenueGroup[];
  byService: RevenueGroup[];
}

/** Revenue analysis for a date window. "Realised" = COMPLETED, "booked" = CONFIRMED. */
export function revenueReport(
  db: Database,
  from: Date,
  to: Date,
): RevenueReport {
  const inRange = appointmentsInRange(db, from, to);
  const completed = inRange.filter((a) => a.status === "COMPLETED");
  const confirmed = inRange.filter((a) => a.status === "CONFIRMED");
  const noShow = inRange.filter((a) => a.status === "NO_SHOW");

  const realised = completed.reduce((s, a) => s + priceOf(db, a), 0);
  const booked = confirmed.reduce((s, a) => s + priceOf(db, a), 0);
  const noShowLost = noShow.reduce((s, a) => s + priceOf(db, a), 0);

  const countable = [...completed, ...confirmed];

  const empMap = new Map<string, RevenueGroup>();
  const svcMap = new Map<string, RevenueGroup>();
  for (const a of countable) {
    const price = priceOf(db, a);

    const emp = db.employees.find((e) => e.id === a.employeeId);
    const empUser = emp && db.users.find((u) => u.id === emp.userId);
    const eKey = a.employeeId;
    const e = empMap.get(eKey) ?? {
      id: eKey,
      label: empUser ? `${empUser.firstName} ${empUser.lastName}` : "Unknown",
      count: 0,
      revenue: 0,
    };
    e.count += 1;
    e.revenue += price;
    empMap.set(eKey, e);

    const svc = db.services.find((s) => s.id === a.serviceId);
    const sKey = a.serviceId;
    const s = svcMap.get(sKey) ?? {
      id: sKey,
      label: svc?.name ?? "Unknown",
      count: 0,
      revenue: 0,
    };
    s.count += 1;
    s.revenue += price;
    svcMap.set(sKey, s);
  }

  for (const [eKey, group] of empMap) {
    const emp = db.employees.find((e) => e.id === eKey);
    group.commission = emp?.commissionPercent
      ? Math.round((group.revenue * emp.commissionPercent) / 100)
      : undefined;
    group.utilizationPercent = employeeUtilization(
      { db },
      eKey,
      from,
      to,
    ).percent;
  }

  const sortByRevenue = (a: RevenueGroup, b: RevenueGroup) =>
    b.revenue - a.revenue;

  return {
    realised,
    realisedCount: completed.length,
    booked,
    bookedCount: confirmed.length,
    noShowLost,
    avgTicket: countable.length
      ? Math.round((realised + booked) / countable.length)
      : 0,
    byEmployee: [...empMap.values()].sort(sortByRevenue),
    byService: [...svcMap.values()].sort(sortByRevenue),
  };
}

export function startOfWeek(d: Date): Date {
  const s = startOfDay(d);
  const dow = s.getDay(); // 0 = Sun
  s.setDate(s.getDate() - ((dow + 6) % 7)); // back to Monday
  return s;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Revenue (realised + booked) per calendar month, most recent last. */
export function revenueTrend(
  db: Database,
  months: number,
  now: Date = new Date(),
): { label: string; realised: number; booked: number }[] {
  const out: { label: string; realised: number; booked: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const inRange = appointmentsInRange(db, from, to);
    out.push({
      label: from.toLocaleDateString("en-US", { month: "short" }),
      realised: inRange
        .filter((a) => a.status === "COMPLETED")
        .reduce((s, a) => s + priceOf(db, a), 0),
      booked: inRange
        .filter((a) => a.status === "CONFIRMED")
        .reduce((s, a) => s + priceOf(db, a), 0),
    });
  }
  return out;
}

/** Revenue per ISO week for the last N weeks, most recent last. */
export function weeklyRevenueTrend(
  db: Database,
  weeks: number,
  now: Date = new Date(),
): { label: string; realised: number; booked: number }[] {
  const thisWeek = startOfWeek(now);
  const out: { label: string; realised: number; booked: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const from = new Date(thisWeek);
    from.setDate(from.getDate() - i * 7);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    const inRange = appointmentsInRange(db, from, to);
    out.push({
      label: from.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      realised: inRange
        .filter((a) => a.status === "COMPLETED")
        .reduce((s, a) => s + priceOf(db, a), 0),
      booked: inRange
        .filter((a) => a.status === "CONFIRMED")
        .reduce((s, a) => s + priceOf(db, a), 0),
    });
  }
  return out;
}
