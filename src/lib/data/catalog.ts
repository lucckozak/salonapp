import type {
  Employee,
  OpeningHour,
  RecurringBreak,
  SalonSettings,
  Service,
  User,
  WorkingHour,
} from "../types";
import { IMAGES } from "./images";

/* ------------------------------------------------------------------ *
 * Salon settings
 * ------------------------------------------------------------------ */

const openingHours: OpeningHour[] = [
  { dayOfWeek: 0, open: "11:00", close: "17:00" }, // Sunday
  { dayOfWeek: 1, open: "09:00", close: "19:00" },
  { dayOfWeek: 2, open: "09:00", close: "19:00" },
  { dayOfWeek: 3, open: "09:00", close: "20:00" },
  { dayOfWeek: 4, open: "09:00", close: "20:00" },
  { dayOfWeek: 5, open: "09:00", close: "18:00" },
  { dayOfWeek: 6, open: "10:00", close: "18:00" },
];

export const SALON_SETTINGS: SalonSettings = {
  name: "Maison Lumière",
  tagline: "Beauty, tailored to you.",
  address: "Level 2, The Galleria, Al Wasl Road, Dubai",
  phone: "+971 4 555 0180",
  email: "hello@maisonlumiere.ae",
  currency: "AED",
  presetId: "maison",
  theme: { primary: "#7c5e77", accent: "#b98c86" },
  openingHours,
  bufferMinutes: 10,
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
};

/* ------------------------------------------------------------------ *
 * Services
 * ------------------------------------------------------------------ */

export const SERVICES: Service[] = [
  {
    id: "svc_signature_facial",
    name: "Signature Facial",
    description:
      "A tailored deep-cleanse, gentle exfoliation and lymphatic massage that leaves skin calm, clear and luminous.",
    category: "Facials",
    durationMinutes: 60,
    price: 250,
    image: IMAGES.services.signatureFacial,
    active: true,
    popular: true,
  },
  {
    id: "svc_deep_cleansing_facial",
    name: "Deep Cleansing Facial",
    description:
      "Targeted extractions, steam and a purifying mask for congested or blemish-prone skin.",
    category: "Facials",
    durationMinutes: 75,
    price: 300,
    image: IMAGES.services.deepCleansing,
    active: true,
    popular: true,
  },
  {
    id: "svc_hydrating_facial",
    name: "Hydrating Facial",
    description:
      "Layered hyaluronic serums and a cooling mask to restore moisture and plump fine lines.",
    category: "Facials",
    durationMinutes: 60,
    price: 260,
    image: IMAGES.services.hydratingFacial,
    active: true,
  },
  {
    id: "svc_anti_aging",
    name: "Anti-Aging Treatment",
    description:
      "Radiofrequency lift, peptide infusion and sculpting massage for firmer, more resilient skin.",
    category: "Facials",
    durationMinutes: 90,
    price: 420,
    image: IMAGES.services.antiAging,
    active: true,
    popular: true,
  },
  {
    id: "svc_glow_peel",
    name: "Express Glow Peel",
    description:
      "A lunchtime lactic-acid resurfacing peel for instant brightness with no downtime.",
    category: "Facials",
    durationMinutes: 45,
    price: 280,
    image: IMAGES.services.glowPeel,
    active: true,
  },
  {
    id: "svc_classic_manicure",
    name: "Classic Manicure",
    description:
      "Shaping, cuticle care, a hand massage and a flawless polish in the shade of your choice.",
    category: "Nails",
    durationMinutes: 45,
    price: 120,
    image: IMAGES.services.classicManicure,
    active: true,
  },
  {
    id: "svc_gel_manicure",
    name: "Gel Manicure",
    description:
      "A long-wearing gel finish with full nail prep and a nourishing hand treatment.",
    category: "Nails",
    durationMinutes: 60,
    price: 160,
    image: IMAGES.services.gelManicure,
    active: true,
    popular: true,
  },
  {
    id: "svc_brow_shaping",
    name: "Eyebrow Shaping",
    description:
      "Precision mapping, tweezing and trimming to define brows that suit your features.",
    category: "Brows & Lashes",
    durationMinutes: 30,
    price: 80,
    image: IMAGES.services.browShaping,
    active: true,
  },
  {
    id: "svc_lash_lift",
    name: "Lash Lift & Tint",
    description:
      "A semi-permanent curl and tint that opens the eyes — no extensions, no mascara.",
    category: "Brows & Lashes",
    durationMinutes: 60,
    price: 220,
    image: IMAGES.services.lashLift,
    active: true,
  },
  {
    id: "svc_full_body_massage",
    name: "Full Body Massage",
    description:
      "A 60-minute aromatherapy massage that releases tension from head to toe.",
    category: "Body",
    durationMinutes: 60,
    price: 300,
    image: IMAGES.services.massage,
    active: true,
  },
  {
    id: "svc_scalp_ritual",
    name: "Scalp & Hair Ritual",
    description:
      "A detoxifying scalp scrub, pressure-point massage and a deep-conditioning mask.",
    category: "Body",
    durationMinutes: 45,
    price: 190,
    image: IMAGES.services.scalpTreatment,
    active: false,
  },
];

/* ------------------------------------------------------------------ *
 * Users (staff + admin + a few known customers)
 * ------------------------------------------------------------------ */

const DEMO_PASSWORD = "password";

export const STAFF_USERS: User[] = [
  {
    id: "usr_admin",
    firstName: "Nadia",
    lastName: "Karam",
    email: "admin@salon.app",
    phone: "+971 50 111 2020",
    role: "ADMIN",
    password: DEMO_PASSWORD,
    createdAt: "2023-01-05T09:00:00.000Z",
  },
  {
    id: "usr_sarah",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah@salon.app",
    phone: "+971 50 222 3040",
    role: "EMPLOYEE",
    password: DEMO_PASSWORD,
    createdAt: "2023-02-01T09:00:00.000Z",
  },
  {
    id: "usr_emma",
    firstName: "Emma",
    lastName: "Devi",
    email: "emma@salon.app",
    phone: "+971 50 333 4050",
    role: "EMPLOYEE",
    password: DEMO_PASSWORD,
    createdAt: "2023-03-12T09:00:00.000Z",
  },
  {
    id: "usr_maria",
    firstName: "Maria",
    lastName: "Rossi",
    email: "maria@salon.app",
    phone: "+971 50 444 5060",
    role: "EMPLOYEE",
    password: DEMO_PASSWORD,
    createdAt: "2023-04-20T09:00:00.000Z",
  },
  {
    id: "usr_lina",
    firstName: "Lina",
    lastName: "Haddad",
    email: "lina@salon.app",
    phone: "+971 50 555 6070",
    role: "EMPLOYEE",
    password: DEMO_PASSWORD,
    createdAt: "2023-06-02T09:00:00.000Z",
  },
  {
    id: "usr_priya",
    firstName: "Priya",
    lastName: "Nair",
    email: "priya@salon.app",
    phone: "+971 50 666 7080",
    role: "EMPLOYEE",
    password: DEMO_PASSWORD,
    createdAt: "2023-09-15T09:00:00.000Z",
  },
];

export const CUSTOMER_USERS: User[] = [
  {
    id: "usr_olivia",
    firstName: "Olivia",
    lastName: "Bennett",
    email: "customer@salon.app",
    phone: "+971 55 100 2001",
    role: "CUSTOMER",
    dateOfBirth: "1992-04-18",
    password: DEMO_PASSWORD,
    createdAt: "2024-05-11T09:00:00.000Z",
  },
  {
    id: "usr_anna",
    firstName: "Anna",
    lastName: "Kovac",
    email: "anna.kovac@example.com",
    phone: "+971 55 100 2002",
    role: "CUSTOMER",
    password: DEMO_PASSWORD,
    createdAt: "2024-06-01T09:00:00.000Z",
  },
  {
    id: "usr_julia",
    firstName: "Julia",
    lastName: "Meyer",
    email: "julia.meyer@example.com",
    phone: "+971 55 100 2003",
    role: "CUSTOMER",
    password: DEMO_PASSWORD,
    createdAt: "2024-06-20T09:00:00.000Z",
  },
  {
    id: "usr_lisa",
    firstName: "Lisa",
    lastName: "Fernandes",
    email: "lisa.fernandes@example.com",
    phone: "+971 55 100 2004",
    role: "CUSTOMER",
    password: DEMO_PASSWORD,
    createdAt: "2024-07-02T09:00:00.000Z",
  },
  {
    id: "usr_mark",
    firstName: "Mark",
    lastName: "Ellison",
    email: "mark.ellison@example.com",
    phone: "+971 55 100 2005",
    role: "CUSTOMER",
    password: DEMO_PASSWORD,
    createdAt: "2024-08-14T09:00:00.000Z",
  },
  {
    id: "usr_yasmin",
    firstName: "Yasmin",
    lastName: "Aziz",
    email: "yasmin.aziz@example.com",
    phone: "+971 55 100 2006",
    role: "CUSTOMER",
    password: DEMO_PASSWORD,
    createdAt: "2024-09-03T09:00:00.000Z",
  },
  {
    id: "usr_sofia",
    firstName: "Sofia",
    lastName: "Laurent",
    email: "sofia.laurent@example.com",
    phone: "+971 55 100 2007",
    role: "CUSTOMER",
    password: DEMO_PASSWORD,
    createdAt: "2024-10-19T09:00:00.000Z",
  },
  {
    id: "usr_hana",
    firstName: "Hana",
    lastName: "Suzuki",
    email: "hana.suzuki@example.com",
    phone: "+971 55 100 2008",
    role: "CUSTOMER",
    password: DEMO_PASSWORD,
    createdAt: "2025-01-08T09:00:00.000Z",
  },
];

/* ------------------------------------------------------------------ *
 * Employees
 * ------------------------------------------------------------------ */

export const EMPLOYEES: Employee[] = [
  {
    id: "emp_sarah",
    userId: "usr_sarah",
    jobTitle: "Senior Beauty Therapist",
    bio: "Sarah has fifteen years in advanced skincare and leads our facial team. She loves a considered, results-driven routine and treats every face as its own puzzle.",
    profileImage: IMAGES.staff.sarah,
    active: true,
    rating: 4.9,
    reviewCount: 214,
    serviceIds: [
      "svc_signature_facial",
      "svc_deep_cleansing_facial",
      "svc_hydrating_facial",
      "svc_anti_aging",
      "svc_glow_peel",
    ],
  },
  {
    id: "emp_emma",
    userId: "usr_emma",
    jobTitle: "Lead Nail Artist",
    bio: "Emma is our nail specialist — precise, fast and endlessly patient with detail. She also shapes a beautifully natural brow.",
    profileImage: IMAGES.staff.emma,
    active: true,
    rating: 4.8,
    reviewCount: 176,
    serviceIds: ["svc_classic_manicure", "svc_gel_manicure", "svc_brow_shaping"],
  },
  {
    id: "emp_maria",
    userId: "usr_maria",
    jobTitle: "Beauty Therapist",
    bio: "Maria blends facials with brow and lash work for a polished, low-maintenance look. Warm, calm and thorough.",
    profileImage: IMAGES.staff.maria,
    active: true,
    rating: 4.7,
    reviewCount: 132,
    serviceIds: [
      "svc_signature_facial",
      "svc_hydrating_facial",
      "svc_glow_peel",
      "svc_brow_shaping",
      "svc_lash_lift",
    ],
  },
  {
    id: "emp_lina",
    userId: "usr_lina",
    jobTitle: "Massage & Body Therapist",
    bio: "Lina trained in Thai and Swedish massage and runs our body treatments. Firm pressure, intuitive hands.",
    profileImage: IMAGES.staff.lina,
    active: true,
    rating: 4.9,
    reviewCount: 98,
    serviceIds: ["svc_full_body_massage", "svc_hydrating_facial", "svc_scalp_ritual"],
  },
  {
    id: "emp_priya",
    userId: "usr_priya",
    jobTitle: "Aesthetician",
    bio: "Priya focuses on brightening and resurfacing treatments and lash work. Meticulous about aftercare.",
    profileImage: IMAGES.staff.priya,
    active: true,
    rating: 4.6,
    reviewCount: 61,
    serviceIds: [
      "svc_signature_facial",
      "svc_glow_peel",
      "svc_anti_aging",
      "svc_lash_lift",
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Working hours + recurring breaks
 * ------------------------------------------------------------------ */

type HourSpec = Partial<Record<number, [string, string] | null>>;

function buildWorkingHours(employeeId: string, spec: HourSpec): WorkingHour[] {
  const out: WorkingHour[] = [];
  for (let d = 0; d < 7; d++) {
    const v = spec[d];
    out.push({
      id: `wh_${employeeId}_${d}`,
      employeeId,
      dayOfWeek: d as WorkingHour["dayOfWeek"],
      startTime: v ? v[0] : null,
      endTime: v ? v[1] : null,
    });
  }
  return out;
}

export const WORKING_HOURS: WorkingHour[] = [
  ...buildWorkingHours("emp_sarah", {
    1: ["09:00", "18:00"],
    2: ["09:00", "18:00"],
    3: ["10:00", "19:00"],
    4: ["09:00", "18:00"],
    5: ["09:00", "16:00"],
    6: ["10:00", "15:00"],
    0: null,
  }),
  ...buildWorkingHours("emp_emma", {
    1: ["10:00", "19:00"],
    2: ["10:00", "19:00"],
    3: ["10:00", "19:00"],
    4: ["11:00", "20:00"],
    5: ["10:00", "18:00"],
    6: ["10:00", "18:00"],
    0: null,
  }),
  ...buildWorkingHours("emp_maria", {
    1: ["09:00", "17:00"],
    2: ["09:00", "17:00"],
    3: null,
    4: ["12:00", "20:00"],
    5: ["09:00", "17:00"],
    6: ["10:00", "16:00"],
    0: ["11:00", "17:00"],
  }),
  ...buildWorkingHours("emp_lina", {
    1: ["11:00", "19:00"],
    2: ["11:00", "19:00"],
    3: ["11:00", "19:00"],
    4: ["11:00", "19:00"],
    5: null,
    6: ["10:00", "17:00"],
    0: ["11:00", "17:00"],
  }),
  ...buildWorkingHours("emp_priya", {
    1: ["09:00", "16:00"],
    2: ["09:00", "16:00"],
    3: ["09:00", "16:00"],
    4: ["09:00", "16:00"],
    5: ["09:00", "15:00"],
    6: null,
    0: null,
  }),
];

export const RECURRING_BREAKS: RecurringBreak[] = [
  // Sarah — lunch Mon–Fri
  ...[1, 2, 3, 4, 5].map((d) => ({
    id: `rb_sarah_${d}`,
    employeeId: "emp_sarah",
    dayOfWeek: d as RecurringBreak["dayOfWeek"],
    startTime: "13:00",
    endTime: "13:45",
    label: "Lunch",
  })),
  // Emma — lunch Mon–Sat
  ...[1, 2, 3, 4, 5, 6].map((d) => ({
    id: `rb_emma_${d}`,
    employeeId: "emp_emma",
    dayOfWeek: d as RecurringBreak["dayOfWeek"],
    startTime: "14:00",
    endTime: "14:30",
    label: "Lunch",
  })),
  // Maria — lunch on working weekdays
  ...[1, 2, 4, 5].map((d) => ({
    id: `rb_maria_${d}`,
    employeeId: "emp_maria",
    dayOfWeek: d as RecurringBreak["dayOfWeek"],
    startTime: "12:30",
    endTime: "13:15",
    label: "Lunch",
  })),
  // Lina — mid-shift reset
  ...[1, 2, 3, 4].map((d) => ({
    id: `rb_lina_${d}`,
    employeeId: "emp_lina",
    dayOfWeek: d as RecurringBreak["dayOfWeek"],
    startTime: "15:00",
    endTime: "15:30",
    label: "Break",
  })),
  // Priya — lunch
  ...[1, 2, 3, 4, 5].map((d) => ({
    id: `rb_priya_${d}`,
    employeeId: "emp_priya",
    dayOfWeek: d as RecurringBreak["dayOfWeek"],
    startTime: "12:00",
    endTime: "12:45",
    label: "Lunch",
  })),
];

export const ALL_CATALOG_USERS: User[] = [...STAFF_USERS, ...CUSTOMER_USERS];
