"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { applyTheme } from "@/lib/theme";

/** Pushes the active salon's brand colours onto <html> as CSS variables. */
export function ThemeApplier() {
  const { db, hydrated } = useStore();
  const primary = db.settings.theme?.primary;
  const accent = db.settings.theme?.accent;

  useEffect(() => {
    if (hydrated) applyTheme({ primary: primary ?? "", accent: accent ?? "" });
  }, [hydrated, primary, accent]);

  return null;
}
