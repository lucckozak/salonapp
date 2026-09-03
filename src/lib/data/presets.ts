import type { SalonSettings } from "../types";
import { IMAGES } from "./images";

export interface PresetService {
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  price: number;
  image: string;
  popular?: boolean;
}

export interface PresetStaff {
  firstName: string;
  lastName: string;
  jobTitle: string;
  bio: string;
  image: string;
  /** service names this person performs (must match PresetService.name) */
  serviceNames: string[];
}

export interface SalonPreset {
  id: string;
  label: string;
  /** one-line pitch shown in the demo switcher */
  blurb: string;
  settings: Pick<
    SalonSettings,
    "name" | "tagline" | "address" | "phone" | "email" | "currency"
  >;
  theme: { primary: string; accent: string };
  /** when omitted, the default Maison Lumière menu + team is used */
  services?: PresetService[];
  staff?: PresetStaff[];
}

const S = IMAGES.services;
const P = IMAGES.staff;

export const SALON_PRESETS: SalonPreset[] = [
  {
    id: "maison",
    label: "Maison Lumière",
    blurb: "Full-service beauty salon · the default demo",
    settings: {
      name: "Maison Lumière",
      tagline: "Beauty, tailored to you.",
      address: "Level 2, The Galleria, Al Wasl Road, Dubai",
      phone: "+971 4 555 0180",
      email: "hello@maisonlumiere.ae",
      currency: "AED",
    },
    theme: { primary: "#7c5e77", accent: "#b98c86" },
    // no services/staff override -> uses the catalog defaults
  },

  {
    id: "glow",
    label: "Glow Bar",
    blurb: "Modern skin studio · facials, LED & brows",
    settings: {
      name: "Glow Bar",
      tagline: "Skin, sorted.",
      address: "14 Redchurch Street, Shoreditch, London",
      phone: "+44 20 7946 0102",
      email: "hello@glowbar.co",
      currency: "GBP",
    },
    theme: { primary: "#c25c4d", accent: "#d99a6c" },
    services: [
      {
        name: "Express Facial",
        description:
          "A 30-minute cleanse, exfoliate and hydrate — the lunch-break reset.",
        category: "Facials",
        durationMinutes: 30,
        price: 45,
        image: S.glowPeel,
        popular: true,
      },
      {
        name: "Signature Glow Facial",
        description:
          "Double cleanse, gentle acids, mask and lymphatic massage for a lit-from-within finish.",
        category: "Facials",
        durationMinutes: 60,
        price: 85,
        image: S.signatureFacial,
        popular: true,
      },
      {
        name: "Dermaplaning",
        description:
          "Physical exfoliation that removes peach fuzz and dead skin for a flawless base.",
        category: "Facials",
        durationMinutes: 45,
        price: 70,
        image: S.deepCleansing,
      },
      {
        name: "LED Light Therapy",
        description:
          "Add-on or stand-alone — red and blue light to calm, clear and firm.",
        category: "Add-ons",
        durationMinutes: 30,
        price: 40,
        image: S.hydratingFacial,
      },
      {
        name: "Brow Sculpt",
        description: "Mapping, wax, tint and trim for brows that frame the face.",
        category: "Brows & Lashes",
        durationMinutes: 30,
        price: 32,
        image: S.browShaping,
        popular: true,
      },
      {
        name: "Lash Lift & Tint",
        description: "A curl and tint that opens the eyes — no extensions.",
        category: "Brows & Lashes",
        durationMinutes: 45,
        price: 55,
        image: S.lashLift,
      },
    ],
    staff: [
      {
        firstName: "Priya",
        lastName: "Nair",
        jobTitle: "Lead Skin Therapist",
        bio: "Ten years in advanced facials. Priya loves a problem-solving consult and a considered routine.",
        image: P.priya,
        serviceNames: [
          "Express Facial",
          "Signature Glow Facial",
          "Dermaplaning",
          "LED Light Therapy",
        ],
      },
      {
        firstName: "Chloe",
        lastName: "Adeyemi",
        jobTitle: "Facialist",
        bio: "Calm hands, gentle approach. Chloe is our go-to for sensitive and reactive skin.",
        image: P.maria,
        serviceNames: [
          "Express Facial",
          "Signature Glow Facial",
          "LED Light Therapy",
        ],
      },
      {
        firstName: "Amara",
        lastName: "Lindqvist",
        jobTitle: "Brow & Lash Artist",
        bio: "Precision brow mapping and natural-looking lash work. Amara never over-plucks.",
        image: P.sarah,
        serviceNames: ["Brow Sculpt", "Lash Lift & Tint", "Express Facial"],
      },
    ],
  },

  {
    id: "vanta",
    label: "Vanta Grooming",
    blurb: "Barbershop · cuts, fades & hot-towel shaves",
    settings: {
      name: "Vanta Grooming",
      tagline: "Sharp cuts. No fuss.",
      address: "88 Greenpoint Avenue, Brooklyn, New York",
      phone: "+1 718 555 0143",
      email: "book@vantagrooming.com",
      currency: "USD",
    },
    theme: { primary: "#3a3a3f", accent: "#b08a5e" },
    services: [
      {
        name: "Skin Fade",
        description:
          "A crisp fade blended to the skin, finished with a razor line-up.",
        category: "Cuts",
        durationMinutes: 45,
        price: 42,
        image: S.scalpTreatment,
        popular: true,
      },
      {
        name: "Classic Cut",
        description: "Scissor-over-comb tidy-up with a wash and style.",
        category: "Cuts",
        durationMinutes: 30,
        price: 35,
        image: S.signatureFacial,
        popular: true,
      },
      {
        name: "Beard Sculpt",
        description: "Shape, line and trim with hot towel and beard oil.",
        category: "Beard",
        durationMinutes: 30,
        price: 28,
        image: S.deepCleansing,
      },
      {
        name: "Hot Towel Shave",
        description:
          "Traditional straight-razor shave with hot towels and a cooling balm.",
        category: "Beard",
        durationMinutes: 45,
        price: 45,
        image: S.hydratingFacial,
        popular: true,
      },
      {
        name: "Cut & Beard Combo",
        description: "Full cut plus a beard sculpt — the works.",
        category: "Cuts",
        durationMinutes: 60,
        price: 60,
        image: S.antiAging,
      },
      {
        name: "Grey Blending",
        description:
          "Subtle colour to knock back the grey — nobody needs to know.",
        category: "Colour",
        durationMinutes: 45,
        price: 40,
        image: S.glowPeel,
      },
    ],
    staff: [
      {
        firstName: "Marco",
        lastName: "Ferreira",
        jobTitle: "Master Barber",
        bio: "Twenty years on the chair. Marco is fast, precise and never rushed.",
        image: P.lina,
        serviceNames: [
          "Skin Fade",
          "Classic Cut",
          "Beard Sculpt",
          "Hot Towel Shave",
          "Cut & Beard Combo",
        ],
      },
      {
        firstName: "Devon",
        lastName: "Clarke",
        jobTitle: "Barber",
        bio: "Fades, textured crops and a sharp line-up. Devon keeps up with every trend.",
        image: P.emma,
        serviceNames: [
          "Skin Fade",
          "Classic Cut",
          "Cut & Beard Combo",
          "Grey Blending",
        ],
      },
      {
        firstName: "Sol",
        lastName: "Ramirez",
        jobTitle: "Barber",
        bio: "Classic gentleman's cuts and traditional shaves. Old-school in the best way.",
        image: P.priya,
        serviceNames: ["Classic Cut", "Beard Sculpt", "Hot Towel Shave"],
      },
    ],
  },

  {
    id: "rosa",
    label: "Rosa & Co",
    blurb: "Nail & brow bar · manis, pedis, lashes",
    settings: {
      name: "Rosa & Co",
      tagline: "Nails, brows, glow.",
      address: "2201 Abbot Kinney Blvd, Venice, Los Angeles",
      phone: "+1 310 555 0177",
      email: "hey@rosaandco.com",
      currency: "USD",
    },
    theme: { primary: "#a8536b", accent: "#c99b73" },
    services: [
      {
        name: "Classic Manicure",
        description: "Shape, cuticle care, hand massage and a flawless polish.",
        category: "Nails",
        durationMinutes: 45,
        price: 35,
        image: S.classicManicure,
        popular: true,
      },
      {
        name: "Gel Manicure",
        description: "Long-wearing gel with full prep and a nourishing treatment.",
        category: "Nails",
        durationMinutes: 60,
        price: 48,
        image: S.gelManicure,
        popular: true,
      },
      {
        name: "BIAB Overlay",
        description:
          "Builder-in-a-bottle strength overlay for natural nails that grow.",
        category: "Nails",
        durationMinutes: 75,
        price: 62,
        image: S.signatureFacial,
      },
      {
        name: "Luxe Pedicure",
        description: "Soak, scrub, mask, massage and polish — feet, restored.",
        category: "Nails",
        durationMinutes: 60,
        price: 55,
        image: S.hydratingFacial,
        popular: true,
      },
      {
        name: "Brow Wax & Tint",
        description: "Clean shape and a tint to match — five-minute-face brows.",
        category: "Brows & Lashes",
        durationMinutes: 30,
        price: 30,
        image: S.browShaping,
      },
      {
        name: "Lash Extensions",
        description: "A natural classic set applied lash-by-lash.",
        category: "Brows & Lashes",
        durationMinutes: 90,
        price: 110,
        image: S.lashLift,
      },
    ],
    staff: [
      {
        firstName: "Bella",
        lastName: "Nguyen",
        jobTitle: "Lead Nail Artist",
        bio: "Detail-obsessed. Bella's cuticle work and cat-eye sets have a waitlist.",
        image: P.emma,
        serviceNames: [
          "Classic Manicure",
          "Gel Manicure",
          "BIAB Overlay",
          "Luxe Pedicure",
        ],
      },
      {
        firstName: "Ivy",
        lastName: "Okafor",
        jobTitle: "Nail Artist",
        bio: "Fast, friendly and freehand nail art on request. Great with colour.",
        image: P.maria,
        serviceNames: ["Classic Manicure", "Gel Manicure", "Luxe Pedicure"],
      },
      {
        firstName: "Noor",
        lastName: "Haddad",
        jobTitle: "Brow & Lash Tech",
        bio: "Brow mapping and lash sets that look like you, only more awake.",
        image: P.sarah,
        serviceNames: ["Brow Wax & Tint", "Lash Extensions"],
      },
    ],
  },
];

export const DEFAULT_PRESET_ID = "maison";

export function getPreset(id: string | undefined | null): SalonPreset {
  return (
    SALON_PRESETS.find((p) => p.id === id) ?? SALON_PRESETS[0]
  );
}
