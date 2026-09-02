"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Appointment,
  AppointmentStatus,
  Database,
  DayOfWeek,
  EmailMessage,
  Employee,
  RecurringBreak,
  SalonSettings,
  Service,
  TimeBlock,
  User,
  WorkingHour,
} from "./types";
import { uid } from "./utils";
import { addMinutes, toDate } from "./time";
import {
  generateSeedDatabase,
  loadDatabase,
  resetDatabase,
  saveDatabase,
} from "./data/seed";

/* ------------------------------------------------------------------ *
 * Context
 * ------------------------------------------------------------------ */

interface BookInput {
  customerId: string;
  employeeId: string;
  serviceId: string;
  start: string; // ISO
  customerNotes?: string;
  source?: Appointment["source"];
  status?: AppointmentStatus;
}

interface NewEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  jobTitle: string;
  bio: string;
  profileImage: string;
  serviceIds: string[];
  active: boolean;
  workingHours: Record<DayOfWeek, [string, string] | null>;
}

interface StoreValue {
  db: Database;
  hydrated: boolean;

  // lookups
  userById: (id: string) => User | undefined;
  employeeById: (id: string) => Employee | undefined;
  employeeByUserId: (userId: string) => Employee | undefined;
  serviceById: (id: string) => Service | undefined;

  // appointments
  book: (input: BookInput) => Appointment;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  rescheduleAppointment: (id: string, startIso: string, employeeId?: string) => void;
  setAppointmentStatus: (
    id: string,
    status: AppointmentStatus,
    reason?: string,
  ) => void;
  cancelAppointment: (id: string, reason?: string) => void;

  // services
  saveService: (svc: Service) => void;
  deleteService: (id: string) => void;

  // employees
  createEmployee: (input: NewEmployeeInput) => Employee;
  saveEmployee: (emp: Employee) => void;
  deleteEmployee: (id: string) => void;
  setEmployeeActive: (id: string, active: boolean) => void;
  resetEmployeePassword: (employeeId: string) => string;

  // schedule
  setWorkingHours: (employeeId: string, hours: Record<DayOfWeek, [string, string] | null>) => void;
  addTimeBlock: (block: Omit<TimeBlock, "id">) => void;
  deleteTimeBlock: (id: string) => void;
  saveRecurringBreak: (rb: RecurringBreak) => void;
  deleteRecurringBreak: (id: string) => void;

  // customers
  saveCustomer: (user: User) => void;
  createCustomer: (input: Omit<User, "id" | "role" | "createdAt" | "password"> & { password?: string }) => User;
  deleteCustomer: (id: string) => void;

  // settings + misc
  updateSettings: (patch: Partial<SalonSettings>) => void;
  sendEmail: (msg: Omit<EmailMessage, "id" | "sentAt">) => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

/* ------------------------------------------------------------------ *
 * Provider
 * ------------------------------------------------------------------ */

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Database | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const loaded = loadDatabase();
    setDb(loaded ?? generateSeedDatabase(new Date()));
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (db) saveDatabase(db);
  }, [db]);

  const mutate = useCallback((fn: (prev: Database) => Database) => {
    setDb((prev) => (prev ? fn(prev) : prev));
  }, []);

  const value = useMemo<StoreValue>(() => {
    const safeDb = db ?? EMPTY;

    const userById = (id: string) => safeDb.users.find((u) => u.id === id);
    const employeeById = (id: string) =>
      safeDb.employees.find((e) => e.id === id);
    const employeeByUserId = (userId: string) =>
      safeDb.employees.find((e) => e.userId === userId);
    const serviceById = (id: string) =>
      safeDb.services.find((s) => s.id === id);

    const pushEmails = (d: Database, emails: Omit<EmailMessage, "id" | "sentAt">[]) => {
      const now = new Date().toISOString();
      d.emailLog = [
        ...emails.map((e) => ({ ...e, id: uid("mail"), sentAt: now })),
        ...d.emailLog,
      ].slice(0, 60);
    };

    const notifyBooking = (d: Database, appt: Appointment, kind: EmailMessage["kind"]) => {
      const customer = d.users.find((u) => u.id === appt.customerId);
      const service = d.services.find((s) => s.id === appt.serviceId);
      const employee = d.employees.find((e) => e.id === appt.employeeId);
      const empUser = employee && d.users.find((u) => u.id === employee.userId);
      const when = toDate(appt.start).toLocaleString();
      const verb =
        kind === "CANCELLATION"
          ? "cancelled"
          : kind === "RESCHEDULE"
            ? "rescheduled"
            : "confirmed";
      const emails: Omit<EmailMessage, "id" | "sentAt">[] = [];
      const s = d.settings.notifications;
      if (customer && (s.customerConfirmation || kind !== "BOOKING_CONFIRMATION")) {
        emails.push({
          to: customer.email,
          subject: `Your appointment has been ${verb} — ${service?.name ?? "Treatment"}`,
          body: `Hi ${customer.firstName}, your ${service?.name ?? "treatment"} with ${
            empUser?.firstName ?? "our team"
          } on ${when} has been ${verb}.`,
          kind,
        });
      }
      if (empUser && s.employeeNewBooking) {
        emails.push({
          to: empUser.email,
          subject: `Schedule update — ${when}`,
          body: `${customer?.firstName ?? "A client"} ${customer?.lastName ?? ""} — ${
            service?.name ?? "treatment"
          } ${verb} for ${when}.`,
          kind: "EMPLOYEE_NOTIFICATION",
        });
      }
      if (s.adminNewBooking) {
        emails.push({
          to: d.settings.email,
          subject: `Booking ${verb}: ${service?.name ?? "treatment"}`,
          body: `${customer?.firstName ?? "Client"} · ${service?.name} · ${
            empUser?.firstName ?? ""
          } · ${when}`,
          kind: "ADMIN_NOTIFICATION",
        });
      }
      pushEmails(d, emails);
    };

    return {
      db: safeDb,
      hydrated: db !== null,
      userById,
      employeeById,
      employeeByUserId,
      serviceById,

      book: (input) => {
        const service = serviceById(input.serviceId)!;
        const start = toDate(input.start);
        const appt: Appointment = {
          id: uid("apt"),
          customerId: input.customerId,
          employeeId: input.employeeId,
          serviceId: input.serviceId,
          start: start.toISOString(),
          end: addMinutes(start, service.durationMinutes).toISOString(),
          status: input.status ?? "CONFIRMED",
          customerNotes: input.customerNotes,
          source: input.source ?? "ONLINE",
          createdAt: new Date().toISOString(),
        };
        mutate((prev) => {
          const next = { ...prev, appointments: [...prev.appointments, appt] };
          notifyBooking(next, appt, "BOOKING_CONFIRMATION");
          return next;
        });
        return appt;
      },

      updateAppointment: (id, patch) =>
        mutate((prev) => ({
          ...prev,
          appointments: prev.appointments.map((a) => {
            if (a.id !== id) return a;
            const merged = { ...a, ...patch };
            const svc = prev.services.find((s) => s.id === merged.serviceId);
            if (svc && (patch.start || patch.serviceId)) {
              merged.end = addMinutes(
                toDate(merged.start),
                svc.durationMinutes,
              ).toISOString();
            }
            return merged;
          }),
        })),

      rescheduleAppointment: (id, startIso, employeeId) =>
        mutate((prev) => {
          const next = {
            ...prev,
            appointments: prev.appointments.map((a) => {
              if (a.id !== id) return a;
              const svc = prev.services.find((s) => s.id === a.serviceId)!;
              return {
                ...a,
                start: toDate(startIso).toISOString(),
                end: addMinutes(toDate(startIso), svc.durationMinutes).toISOString(),
                employeeId: employeeId ?? a.employeeId,
                status: a.status === "PENDING" ? "PENDING" : "CONFIRMED",
              } as Appointment;
            }),
          };
          const appt = next.appointments.find((a) => a.id === id);
          if (appt) notifyBooking(next, appt, "RESCHEDULE");
          return next;
        }),

      setAppointmentStatus: (id, status, reason) =>
        mutate((prev) => {
          const next = {
            ...prev,
            appointments: prev.appointments.map((a) =>
              a.id === id
                ? {
                    ...a,
                    status,
                    cancellationReason:
                      status === "CANCELLED" ? reason ?? a.cancellationReason : a.cancellationReason,
                  }
                : a,
            ),
          };
          if (status === "CANCELLED") {
            const appt = next.appointments.find((a) => a.id === id);
            if (appt) notifyBooking(next, appt, "CANCELLATION");
          }
          return next;
        }),

      cancelAppointment: (id, reason) =>
        mutate((prev) => {
          const next = {
            ...prev,
            appointments: prev.appointments.map((a) =>
              a.id === id
                ? { ...a, status: "CANCELLED" as const, cancellationReason: reason }
                : a,
            ),
          };
          const appt = next.appointments.find((a) => a.id === id);
          if (appt) notifyBooking(next, appt, "CANCELLATION");
          return next;
        }),

      saveService: (svc) =>
        mutate((prev) => ({
          ...prev,
          services: prev.services.some((s) => s.id === svc.id)
            ? prev.services.map((s) => (s.id === svc.id ? svc : s))
            : [...prev.services, { ...svc, id: svc.id || uid("svc") }],
        })),

      deleteService: (id) =>
        mutate((prev) => ({
          ...prev,
          services: prev.services.filter((s) => s.id !== id),
          employees: prev.employees.map((e) => ({
            ...e,
            serviceIds: e.serviceIds.filter((sid) => sid !== id),
          })),
        })),

      createEmployee: (input) => {
        const userId = uid("usr");
        const empId = uid("emp");
        const user: User = {
          id: userId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          role: "EMPLOYEE",
          password: input.password,
          createdAt: new Date().toISOString(),
        };
        const employee: Employee = {
          id: empId,
          userId,
          jobTitle: input.jobTitle,
          bio: input.bio,
          profileImage: input.profileImage,
          active: input.active,
          serviceIds: input.serviceIds,
          rating: undefined,
          reviewCount: 0,
        };
        const workingHours: WorkingHour[] = ([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map(
          (d) => {
            const v = input.workingHours[d];
            return {
              id: `wh_${empId}_${d}`,
              employeeId: empId,
              dayOfWeek: d,
              startTime: v ? v[0] : null,
              endTime: v ? v[1] : null,
            };
          },
        );
        mutate((prev) => ({
          ...prev,
          users: [...prev.users, user],
          employees: [...prev.employees, employee],
          workingHours: [...prev.workingHours, ...workingHours],
        }));
        return employee;
      },

      saveEmployee: (emp) =>
        mutate((prev) => ({
          ...prev,
          employees: prev.employees.map((e) => (e.id === emp.id ? emp : e)),
        })),

      deleteEmployee: (id) =>
        mutate((prev) => {
          const emp = prev.employees.find((e) => e.id === id);
          return {
            ...prev,
            employees: prev.employees.filter((e) => e.id !== id),
            users: emp ? prev.users.filter((u) => u.id !== emp.userId) : prev.users,
            workingHours: prev.workingHours.filter((w) => w.employeeId !== id),
            recurringBreaks: prev.recurringBreaks.filter((r) => r.employeeId !== id),
            timeBlocks: prev.timeBlocks.filter((t) => t.employeeId !== id),
            appointments: prev.appointments.map((a) =>
              a.employeeId === id && new Date(a.start) > new Date()
                ? { ...a, status: "CANCELLED" as const, cancellationReason: "Specialist unavailable" }
                : a,
            ),
          };
        }),

      setEmployeeActive: (id, active) =>
        mutate((prev) => ({
          ...prev,
          employees: prev.employees.map((e) =>
            e.id === id ? { ...e, active } : e,
          ),
        })),

      resetEmployeePassword: (employeeId) => {
        const temp = `salon-${Math.random().toString(36).slice(2, 8)}`;
        mutate((prev) => {
          const emp = prev.employees.find((e) => e.id === employeeId);
          if (!emp) return prev;
          return {
            ...prev,
            users: prev.users.map((u) =>
              u.id === emp.userId ? { ...u, password: temp } : u,
            ),
          };
        });
        return temp;
      },

      setWorkingHours: (employeeId, hours) =>
        mutate((prev) => ({
          ...prev,
          workingHours: [
            ...prev.workingHours.filter((w) => w.employeeId !== employeeId),
            ...([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map((d) => {
              const v = hours[d];
              return {
                id: `wh_${employeeId}_${d}`,
                employeeId,
                dayOfWeek: d,
                startTime: v ? v[0] : null,
                endTime: v ? v[1] : null,
              };
            }),
          ],
        })),

      addTimeBlock: (block) =>
        mutate((prev) => ({
          ...prev,
          timeBlocks: [...prev.timeBlocks, { ...block, id: uid("tb") }],
        })),

      deleteTimeBlock: (id) =>
        mutate((prev) => ({
          ...prev,
          timeBlocks: prev.timeBlocks.filter((t) => t.id !== id),
        })),

      saveRecurringBreak: (rb) =>
        mutate((prev) => ({
          ...prev,
          recurringBreaks: prev.recurringBreaks.some((r) => r.id === rb.id)
            ? prev.recurringBreaks.map((r) => (r.id === rb.id ? rb : r))
            : [...prev.recurringBreaks, { ...rb, id: rb.id || uid("rb") }],
        })),

      deleteRecurringBreak: (id) =>
        mutate((prev) => ({
          ...prev,
          recurringBreaks: prev.recurringBreaks.filter((r) => r.id !== id),
        })),

      saveCustomer: (user) =>
        mutate((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === user.id ? user : u)),
        })),

      createCustomer: (input) => {
        const user: User = {
          id: uid("usr"),
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          dateOfBirth: input.dateOfBirth,
          role: "CUSTOMER",
          password: input.password ?? "password",
          createdAt: new Date().toISOString(),
        };
        mutate((prev) => ({ ...prev, users: [...prev.users, user] }));
        return user;
      },

      deleteCustomer: (id) =>
        mutate((prev) => ({
          ...prev,
          users: prev.users.filter((u) => u.id !== id),
          appointments: prev.appointments.filter((a) => a.customerId !== id),
        })),

      updateSettings: (patch) =>
        mutate((prev) => ({
          ...prev,
          settings: { ...prev.settings, ...patch },
        })),

      sendEmail: (msg) =>
        mutate((prev) => ({
          ...prev,
          emailLog: [
            { ...msg, id: uid("mail"), sentAt: new Date().toISOString() },
            ...prev.emailLog,
          ].slice(0, 60),
        })),

      resetAll: () => {
        resetDatabase();
        setDb(generateSeedDatabase(new Date()));
      },
    };
  }, [db, mutate]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

const EMPTY: Database = {
  users: [],
  employees: [],
  services: [],
  workingHours: [],
  recurringBreaks: [],
  timeBlocks: [],
  appointments: [],
  emailLog: [],
  settings: {
    name: "",
    tagline: "",
    address: "",
    phone: "",
    email: "",
    currency: "AED",
    openingHours: [],
    bufferMinutes: 0,
    cancellationWindowHours: 24,
    slotIntervalMinutes: 30,
    minLeadTimeHours: 2,
    maxAdvanceDays: 45,
    notifications: {
      customerConfirmation: true,
      customerReminder: true,
      employeeNewBooking: true,
      adminNewBooking: true,
    },
  },
};

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}
