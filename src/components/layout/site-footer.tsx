"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { DAY_LABELS_SHORT } from "@/lib/types";

export function SiteFooter() {
  const { db } = useStore();
  const s = db.settings;

  return (
    <footer className="mt-16 sm:mt-24 border-t border-border bg-surface-muted">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-serif text-xl font-semibold text-foreground">
            {s.name || "Maison Lumière"}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            {s.tagline || "Beauty, tailored to you."} A calm, considered space for
            skincare, nails, brows and body — with online booking that takes under
            two minutes.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Visit
          </p>
          <p className="mt-3 text-sm text-muted-strong">{s.address}</p>
          <p className="mt-2 text-sm text-muted-strong">{s.phone}</p>
          <p className="mt-2 text-sm text-muted-strong">{s.email}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Opening hours
          </p>
          <ul className="mt-3 space-y-1 text-sm text-muted-strong">
            {s.openingHours.map((o) => (
              <li key={o.dayOfWeek} className="flex justify-between gap-4">
                <span>{DAY_LABELS_SHORT[o.dayOfWeek]}</span>
                <span>
                  {o.open && o.close ? `${o.open}–${o.close}` : "Closed"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} {s.name || "Maison Lumière"}. Prototype.</p>
          <div className="flex gap-4">
            <Link href="/services" className="hover:text-foreground">
              Treatments
            </Link>
            <Link href="/employees" className="hover:text-foreground">
              Specialists
            </Link>
            <Link href="/book" className="hover:text-foreground">
              Book
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
