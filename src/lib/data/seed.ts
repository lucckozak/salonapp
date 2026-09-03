import type {
  Appointment,
  AppointmentStatus,
  Database,
  DayOfWeek,
  EmailMessage,
  Employee,
  RecurringBreak,
  Service,
  TimeBlock,
  User,
  WorkingHour,
} from "../types";
import { mulberry32 } from "../utils";
import {
  addDays,
  atTime,
  startOfDay,
  addMinutes,
  isSameDay,
} from "../time";
import { slotsForEmployee } from "../availability";
import {
  CUSTOMER_USERS,
  EMPLOYEES,
  RECURRING_BREAKS,
  SALON_SETTINGS,
  SERVICES,
  STAFF_USERS,
  WORKING_HOURS,
} from "./catalog";
import { getPreset, type SalonPreset } from "./presets";

const STORAGE_VERSION = 6;

const ADMIN_USER = STAFF_USERS.find((u) => u.role === "ADMIN")!;

/* ------------------------------------------------------------------ *
 * Build the base catalog for a preset
 * ------------------------------------------------------------------ */

function presetServices(preset: SalonPreset): Service[] {
  if (!preset.services) return structuredClone(SERVICES);
  return preset.services.map((s, i) => ({
    id: `svc_${i}`,
    name: s.name,
    description: s.description,
    category: s.category,
    durationMinutes: s.durationMinutes,
    price: s.price,
    image: s.image,
    active: true,
    popular: s.popular ?? false,
  }));
}

const PRESET_HOURS: Record<DayOfWeek, [string, string] | null> = {
  0: null,
  1: ["09:00", "18:00"],
  2: ["09:00", "18:00"],
  3: ["10:00", "19:00"],
  4: ["09:00", "18:00"],
  5: ["09:00", "17:00"],
  6: ["10:00", "16:00"],
};

function presetTeam(
  preset: SalonPreset,
  services: Service[],
): {
  users: User[];
  employees: Employee[];
  workingHours: WorkingHour[];
  recurringBreaks: RecurringBreak[];
} {
  if (!preset.staff) {
    return {
      users: structuredClone(STAFF_USERS.filter((u) => u.role === "EMPLOYEE")),
      employees: structuredClone(EMPLOYEES),
      workingHours: structuredClone(WORKING_HOURS),
      recurringBreaks: structuredClone(RECURRING_BREAKS),
    };
  }

  const users: User[] = [];
  const employees: Employee[] = [];
  const workingHours: WorkingHour[] = [];
  const recurringBreaks: RecurringBreak[] = [];

  preset.staff.forEach((p, i) => {
    const userId = `usr_emp_${i}`;
    const empId = `emp_${i}`;
    users.push({
      id: userId,
      firstName: p.firstName,
      lastName: p.lastName,
      email: `${p.firstName.toLowerCase()}@salon.app`,
      phone: `+1 555 010${i}${i}`,
      role: "EMPLOYEE",
      password: "password",
      createdAt: "2023-01-01T09:00:00.000Z",
    });
    employees.push({
      id: empId,
      userId,
      jobTitle: p.jobTitle,
      bio: p.bio,
      profileImage: p.image,
      active: true,
      rating: Number((4.6 + (i % 3) * 0.1).toFixed(1)),
      reviewCount: 40 + i * 27,
      serviceIds: services
        .filter((s) => p.serviceNames.includes(s.name))
        .map((s) => s.id),
    });

    // a little per-person variation so the calendar looks alive
    const hours: Record<DayOfWeek, [string, string] | null> = { ...PRESET_HOURS };
    if (i % 3 === 1) hours[5] = null; // Friday off
    if (i % 3 === 2) hours[1] = ["11:00", "20:00"]; // late Mondays
    for (let d = 0 as DayOfWeek; d <= 6; d = (d + 1) as DayOfWeek) {
      const v = hours[d];
      workingHours.push({
        id: `wh_${empId}_${d}`,
        employeeId: empId,
        dayOfWeek: d,
        startTime: v ? v[0] : null,
        endTime: v ? v[1] : null,
      });
      if (v && d >= 1 && d <= 5) {
        recurringBreaks.push({
          id: `rb_${empId}_${d}`,
          employeeId: empId,
          dayOfWeek: d,
          startTime: "13:00",
          endTime: "13:45",
          label: "Lunch",
        });
      }
    }
  });

  return { users, employees, workingHours, recurringBreaks };
}

export function emptyDatabase(presetId?: string): Database {
  const preset = getPreset(presetId);
  const services = presetServices(preset);
  const team = presetTeam(preset, services);

  return {
    users: [
      structuredClone(ADMIN_USER),
      ...team.users,
      ...structuredClone(CUSTOMER_USERS),
    ],
    employees: team.employees,
    services,
    workingHours: team.workingHours,
    recurringBreaks: team.recurringBreaks,
    timeBlocks: [],
    appointments: [],
    settings: {
      ...structuredClone(SALON_SETTINGS),
      ...preset.settings,
      presetId: preset.id,
      theme: { ...preset.theme },
    },
    emailLog: [],
  };
}

/* ------------------------------------------------------------------ *
 * Seed content
 * ------------------------------------------------------------------ */

function seedTimeBlocks(now: Date, db: Database): TimeBlock[] {
  const base = startOfDay(now);
  const emps = db.employees;
  const out: TimeBlock[] = [];
  if (emps[0])
    out.push({
      id: "tb_vacation",
      employeeId: emps[0].id,
      start: addDays(base, 13).toISOString(),
      end: addDays(base, 24).toISOString(),
      type: "VACATION",
      reason: "Annual leave",
    });
  if (emps[1])
    out.push({
      id: "tb_training",
      employeeId: emps[1].id,
      start: atTime(addDays(base, 4), "13:00").toISOString(),
      end: atTime(addDays(base, 4), "19:00").toISOString(),
      type: "BLOCKED",
      reason: "Training day",
    });
  if (emps[2])
    out.push({
      id: "tb_personal",
      employeeId: emps[2].id,
      start: atTime(addDays(base, 2), "09:00").toISOString(),
      end: atTime(addDays(base, 2), "11:00").toISOString(),
      type: "BLOCKED",
      reason: "Personal appointment",
    });
  if (emps[0])
    out.push({
      id: "tb_break",
      employeeId: emps[0].id,
      start: atTime(addDays(base, 1), "16:30").toISOString(),
      end: atTime(addDays(base, 1), "17:15").toISOString(),
      type: "BREAK",
      reason: "Supplier meeting",
    });
  return out;
}

function pastStatus(rnd: () => number): AppointmentStatus {
  const r = rnd();
  if (r < 0.8) return "COMPLETED";
  if (r < 0.9) return "CANCELLED";
  return "NO_SHOW";
}

function futureStatus(rnd: () => number): AppointmentStatus {
  return rnd() < 0.78 ? "CONFIRMED" : "PENDING";
}

/**
 * Build a fully-populated demo database for a salon preset. Deterministic for a
 * given `now` day + preset, so server and client renders agree when hydrated.
 */
export function generateSeedDatabase(
  now: Date = new Date(),
  presetId?: string,
): Database {
  const db = emptyDatabase(presetId);
  db.timeBlocks = seedTimeBlocks(now, db);

  const rnd = mulberry32(
    0x5a10a9 ^
      startOfDay(now).getDate() ^
      (startOfDay(now).getMonth() << 8) ^
      hashString(db.settings.presetId),
  );
  const today = startOfDay(now);
  let counter = 0;

  for (let offset = -35; offset <= 21; offset++) {
    const day = addDays(today, offset);
    const isPast = offset < 0;
    const isToday = offset === 0;

    for (const emp of db.employees) {
      const target = isPast
        ? Math.floor(rnd() * 5)
        : rnd() < 0.58
          ? 0
          : rnd() < 0.86
            ? 1
            : 2;
      let placed = 0;
      let guard = 0;

      while (placed < target && guard < 12) {
        guard++;
        const offered = db.services.filter(
          (s) => s.active && emp.serviceIds.includes(s.id),
        );
        if (!offered.length) break;
        const svc = offered[Math.floor(rnd() * offered.length)];

        const options = slotsForEmployee(
          { db, now: new Date(today.getTime() - 1000) },
          emp,
          svc,
          day,
        );
        if (!options.length) break;

        const time = options[Math.floor(rnd() * options.length)];
        const start = atTime(day, time);
        const end = addMinutes(start, svc.durationMinutes);

        const clash = db.appointments.some(
          (a) =>
            a.employeeId === emp.id &&
            a.status !== "CANCELLED" &&
            isSameDay(new Date(a.start), day) &&
            new Date(a.start) < end &&
            start < new Date(a.end),
        );
        if (clash) continue;

        const customer =
          CUSTOMER_USERS[Math.floor(rnd() * CUSTOMER_USERS.length)];

        let status: AppointmentStatus;
        if (isPast) status = pastStatus(rnd);
        else if (isToday) status = rnd() < 0.5 ? "COMPLETED" : "CONFIRMED";
        else status = futureStatus(rnd);

        counter++;
        db.appointments.push({
          id: `apt_seed_${String(counter).padStart(3, "0")}`,
          customerId: customer.id,
          employeeId: emp.id,
          serviceId: svc.id,
          start: start.toISOString(),
          end: end.toISOString(),
          status,
          source: rnd() < 0.75 ? "ONLINE" : "ADMIN",
          createdAt: addDays(start, -(1 + Math.floor(rnd() * 9))).toISOString(),
          customerNotes:
            rnd() < 0.16
              ? "Please keep it low-key on the fragrance."
              : undefined,
        });
        placed++;
      }
    }
  }

  ensureDemoCustomerHistory(db, now, rnd);
  db.emailLog = seedEmailLog(db, now);
  return db;
}

/** Give the demo customer a lively "My appointments" — preset-agnostic. */
function ensureDemoCustomerHistory(
  db: Database,
  now: Date,
  rnd: () => number,
) {
  const demo = db.users.find((u) => u.email === "customer@salon.app");
  if (!demo) return;
  const today = startOfDay(now);
  const offsets = [6, 20, -16, -44, -72];

  offsets.forEach((offset, i) => {
    const day = addDays(today, offset);
    const emp = db.employees[Math.floor(rnd() * db.employees.length)];
    if (!emp) return;
    const offered = db.services.filter(
      (s) => s.active && emp.serviceIds.includes(s.id),
    );
    if (!offered.length) return;
    const svc = offered[Math.floor(rnd() * offered.length)];
    const slots = slotsForEmployee(
      { db, now: new Date(today.getTime() - 1000) },
      emp,
      svc,
      day,
    );
    const time = slots.length
      ? slots[Math.floor(rnd() * slots.length)]
      : "11:00";
    const start = atTime(day, time);

    db.appointments.push({
      id: `apt_demo_${i + 1}`,
      customerId: demo.id,
      employeeId: emp.id,
      serviceId: svc.id,
      start: start.toISOString(),
      end: addMinutes(start, svc.durationMinutes).toISOString(),
      status:
        offset > 0 ? (i === 0 ? "CONFIRMED" : "PENDING") : "COMPLETED",
      source: "ONLINE",
      createdAt: addDays(start, -5).toISOString(),
    });
  });
}

function seedEmailLog(db: Database, now: Date): EmailMessage[] {
  const upcoming = [...db.appointments]
    .filter((a) => new Date(a.start) > now && a.status !== "CANCELLED")
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))
    .slice(0, 4);

  return upcoming.map((a, i) => {
    const customer = db.users.find((u) => u.id === a.customerId)!;
    const service = db.services.find((s) => s.id === a.serviceId)!;
    return {
      id: `mail_seed_${i + 1}`,
      to: customer.email,
      subject: `Your booking is confirmed — ${service.name}`,
      body: `Hi ${customer.firstName}, we've reserved ${service.name} for you on ${new Date(
        a.start,
      ).toLocaleString()}. See you soon at ${db.settings.name}.`,
      sentAt: a.createdAt,
      kind: "BOOKING_CONFIRMATION",
    };
  });
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/* ------------------------------------------------------------------ *
 * Persistence
 * ------------------------------------------------------------------ */

const KEY = "maisonlumiere:db";
const VERSION_KEY = "maisonlumiere:version";

export function loadDatabase(): Database | null {
  if (typeof window === "undefined") return null;
  try {
    const version = Number(window.localStorage.getItem(VERSION_KEY));
    if (version !== STORAGE_VERSION) return null;
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Database;
  } catch {
    return null;
  }
}

export function saveDatabase(db: Database) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
    window.localStorage.setItem(VERSION_KEY, String(STORAGE_VERSION));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export function resetDatabase() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(VERSION_KEY);
}
