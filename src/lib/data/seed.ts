import type {
  Appointment,
  AppointmentStatus,
  Database,
  EmailMessage,
  TimeBlock,
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
  ALL_CATALOG_USERS,
  CUSTOMER_USERS,
  EMPLOYEES,
  RECURRING_BREAKS,
  SALON_SETTINGS,
  SERVICES,
  WORKING_HOURS,
} from "./catalog";

const STORAGE_VERSION = 5;

export function emptyDatabase(): Database {
  return {
    users: structuredClone(ALL_CATALOG_USERS),
    employees: structuredClone(EMPLOYEES),
    services: structuredClone(SERVICES),
    workingHours: structuredClone(WORKING_HOURS),
    recurringBreaks: structuredClone(RECURRING_BREAKS),
    timeBlocks: [],
    appointments: [],
    settings: structuredClone(SALON_SETTINGS),
    emailLog: [],
  };
}

function seedTimeBlocks(now: Date): TimeBlock[] {
  const base = startOfDay(now);
  return [
    {
      id: "tb_sarah_vacation",
      employeeId: "emp_sarah",
      start: addDays(base, 13).toISOString(),
      end: addDays(base, 24).toISOString(),
      type: "VACATION",
      reason: "Annual leave",
    },
    {
      id: "tb_emma_training",
      employeeId: "emp_emma",
      start: atTime(addDays(base, 4), "13:00").toISOString(),
      end: atTime(addDays(base, 4), "19:00").toISOString(),
      type: "BLOCKED",
      reason: "Product training",
    },
    {
      id: "tb_priya_appt",
      employeeId: "emp_priya",
      start: atTime(addDays(base, 2), "09:00").toISOString(),
      end: atTime(addDays(base, 2), "11:00").toISOString(),
      type: "BLOCKED",
      reason: "Personal appointment",
    },
    {
      id: "tb_lina_break",
      employeeId: "emp_lina",
      start: atTime(addDays(base, 1), "16:30").toISOString(),
      end: atTime(addDays(base, 1), "17:15").toISOString(),
      type: "BREAK",
      reason: "Supplier meeting",
    },
  ];
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
 * Build a fully-populated demo database. Deterministic for a given `now` day,
 * so server and client renders agree when hydrated on the same date.
 */
export function generateSeedDatabase(now: Date = new Date()): Database {
  const db = emptyDatabase();
  db.timeBlocks = seedTimeBlocks(now);

  const rnd = mulberry32(0x5a10a9 ^ startOfDay(now).getDate() ^ (startOfDay(now).getMonth() << 8));
  const today = startOfDay(now);
  let counter = 0;

  for (let offset = -35; offset <= 21; offset++) {
    const day = addDays(today, offset);
    const isPast = offset < 0;
    const isToday = offset === 0;

    for (const emp of db.employees) {
      // how busy is this stylist this day
      const target = isPast
        ? Math.floor(rnd() * 5) // 0..4 — a full history
        : rnd() < 0.58
          ? 0
          : rnd() < 0.86
            ? 1
            : 2; // lighter, more realistic forward book
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

        // skip if it now conflicts with something already placed this loop
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
        const appt: Appointment = {
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
            rnd() < 0.18
              ? "Please use fragrance-free products where possible."
              : undefined,
        };
        db.appointments.push(appt);
        placed++;
      }
    }
  }

  // A couple of appointments for the demo customer so "My Appointments" is alive.
  ensureDemoCustomerHistory(db, now);

  db.emailLog = seedEmailLog(db, now);
  return db;
}

function ensureDemoCustomerHistory(db: Database, now: Date) {
  const demo = db.users.find((u) => u.email === "customer@salon.app");
  if (!demo) return;
  const today = startOfDay(now);

  const wanted: {
    offset: number;
    time: string;
    empId: string;
    svcId: string;
    status: AppointmentStatus;
  }[] = [
    { offset: 7, time: "14:30", empId: "emp_sarah", svcId: "svc_deep_cleansing_facial", status: "CONFIRMED" },
    { offset: 21, time: "11:00", empId: "emp_emma", svcId: "svc_gel_manicure", status: "PENDING" },
    { offset: -18, time: "11:00", empId: "emp_sarah", svcId: "svc_hydrating_facial", status: "COMPLETED" },
    { offset: -46, time: "16:00", empId: "emp_priya", svcId: "svc_lash_lift", status: "COMPLETED" },
    { offset: -74, time: "10:00", empId: "emp_maria", svcId: "svc_signature_facial", status: "COMPLETED" },
  ];

  wanted.forEach((w, i) => {
    const svc = db.services.find((s) => s.id === w.svcId)!;
    const start = atTime(addDays(today, w.offset), w.time);
    db.appointments.push({
      id: `apt_demo_${i + 1}`,
      customerId: demo.id,
      employeeId: w.empId,
      serviceId: w.svcId,
      start: start.toISOString(),
      end: addMinutes(start, svc.durationMinutes).toISOString(),
      status: w.status,
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
      ).toLocaleString()}. See you soon at Maison Lumière.`,
      sentAt: a.createdAt,
      kind: "BOOKING_CONFIRMATION",
    };
  });
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
