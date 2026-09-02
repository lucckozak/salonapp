"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { groupServicesByCategory } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/ui/card";
import { ServiceCard } from "@/components/services/service-card";
import { HydrationGate } from "@/components/hydration-gate";

function ServicesInner() {
  const { db } = useStore();
  const active = useMemo(
    () => db.services.filter((s) => s.active),
    [db.services],
  );
  const categories = ["All", ...new Set(active.map((s) => s.category))];
  const [cat, setCat] = useState("All");

  const filtered = cat === "All" ? active : active.filter((s) => s.category === cat);
  const groups = groupServicesByCategory(filtered);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionTitle
        eyebrow="The menu"
        title="Treatments"
        description="A focused list of facials, nails, brows and body work — each one adapted to you on the day."
      />

      <div className="mt-8 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              cat === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-strong hover:border-primary/40 hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-10 space-y-12">
        {groups.map(([category, services]) => (
          <section key={category}>
            <h2 className="mb-5 font-serif text-2xl font-medium text-foreground">
              {category}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  currency={db.settings.currency}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <HydrationGate>
      <ServicesInner />
    </HydrationGate>
  );
}
