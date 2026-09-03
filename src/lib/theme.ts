/**
 * Runtime theming. A salon picks a brand `primary` and `accent` colour; we
 * derive the hover / soft tints from them and push the lot onto
 * `document.documentElement` as CSS custom properties, overriding the defaults
 * in globals.css. Everything (buttons, badges, active states, rings) follows.
 */

export interface BrandTheme {
  primary: string;
  accent: string;
}

export const DEFAULT_THEME: BrandTheme = {
  primary: "#7c5e77",
  accent: "#b98c86",
};

export const THEME_SWATCHES: { label: string; primary: string; accent: string }[] =
  [
    { label: "Plum", primary: "#7c5e77", accent: "#b98c86" },
    { label: "Rose", primary: "#a8536b", accent: "#c98d7a" },
    { label: "Coral", primary: "#c25c4d", accent: "#d99a6c" },
    { label: "Sage", primary: "#5c7a63", accent: "#a5936b" },
    { label: "Ocean", primary: "#3f6b82", accent: "#7fa8ad" },
    { label: "Charcoal", primary: "#3a3a3f", accent: "#b08a5e" },
    { label: "Gold", primary: "#9a7a3c", accent: "#c99b73" },
    { label: "Berry", primary: "#7b3b56", accent: "#bd8098" },
  ];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0").slice(0, 6);
  const int = parseInt(full, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** mix a→b, t in [0,1] */
function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(
    A.r + (B.r - A.r) * t,
    A.g + (B.g - A.g) * t,
    A.b + (B.b - A.b) * t,
  );
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function isValidHex(v: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim());
}

export function themeCssVars(theme: BrandTheme): Record<string, string> {
  const primary = theme.primary || DEFAULT_THEME.primary;
  const accent = theme.accent || DEFAULT_THEME.accent;
  return {
    "--primary": primary,
    "--primary-hover": mix(primary, "#000000", 0.16),
    "--primary-soft": mix(primary, "#ffffff", 0.9),
    "--primary-foreground": luminance(primary) > 0.62 ? "#2e2a26" : "#ffffff",
    "--accent": accent,
    "--accent-soft": mix(accent, "#ffffff", 0.86),
    "--ring": primary,
  };
}

export function applyTheme(theme: BrandTheme | undefined) {
  if (typeof document === "undefined") return;
  const vars = themeCssVars(theme ?? DEFAULT_THEME);
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
}
