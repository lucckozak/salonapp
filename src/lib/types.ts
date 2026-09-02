export type Role = "CUSTOMER" | "EMPLOYEE" | "ADMIN";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type TimeBlockType = "BREAK" | "VACATION" | "BLOCKED";

/** 0 = Sunday ... 6 = Saturday (matches JS Date.getDay()) */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  /** ISO date (yyyy-mm-dd) */
  dateOfBirth?: string;
  /** prototype only — plaintext for the mock auth layer */
  password: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  jobTitle: string;
  bio: string;
  profileImage: string;
  active: boolean;
  rating?: number;
  reviewCount?: number;
  serviceIds: string[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  /** price in AED */
  price: number;
  image: string;
  active: boolean;
  popular?: boolean;
}

export interface WorkingHour {
  id: string;
  employeeId: string;
  dayOfWeek: DayOfWeek;
  /** "HH:mm" or null when the employee does not work that day */
  startTime: string | null;
  endTime: string | null;
}

/** Recurring weekly break, e.g. a daily lunch. */
export interface RecurringBreak {
  id: string;
  employeeId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  label: string;
}

/** One-off unavailable period (vacation, ad-hoc block, single break). */
export interface TimeBlock {
  id: string;
  employeeId: string;
  /** ISO datetime */
  start: string;
  /** ISO datetime */
  end: string;
  type: TimeBlockType;
  reason?: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  employeeId: string;
  serviceId: string;
  /** ISO datetime */
  start: string;
  /** ISO datetime */
  end: string;
  status: AppointmentStatus;
  customerNotes?: string;
  adminNotes?: string;
  cancellationReason?: string;
  createdAt: string;
  /** channel the booking came through */
  source: "ONLINE" | "ADMIN" | "WALK_IN";
}

export interface OpeningHour {
  dayOfWeek: DayOfWeek;
  /** "HH:mm" or null when the salon is closed */
  open: string | null;
  close: string | null;
}

export interface SalonSettings {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  openingHours: OpeningHour[];
  /** buffer in minutes reserved after every appointment */
  bufferMinutes: number;
  /** how many hours before the start a customer may still cancel / reschedule */
  cancellationWindowHours: number;
  /** grid granularity for offered start times */
  slotIntervalMinutes: number;
  /** earliest a same-day online booking may start, in hours from now */
  minLeadTimeHours: number;
  /** how far ahead the calendar opens, in days */
  maxAdvanceDays: number;
  notifications: {
    customerConfirmation: boolean;
    customerReminder: boolean;
    employeeNewBooking: boolean;
    adminNewBooking: boolean;
  };
}

export interface Database {
  users: User[];
  employees: Employee[];
  services: Service[];
  workingHours: WorkingHour[];
  recurringBreaks: RecurringBreak[];
  timeBlocks: TimeBlock[];
  appointments: Appointment[];
  settings: SalonSettings;
  /** log of stubbed outbound emails */
  emailLog: EmailMessage[];
}

export interface EmailMessage {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  kind:
    | "BOOKING_CONFIRMATION"
    | "REMINDER"
    | "CANCELLATION"
    | "RESCHEDULE"
    | "EMPLOYEE_NOTIFICATION"
    | "ADMIN_NOTIFICATION";
}

export const ACTIVE_STATUSES: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export const DAY_LABELS_SHORT: Record<DayOfWeek, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};
