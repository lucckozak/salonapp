"use client";

import { useStore } from "@/lib/store";
import { SectionTitle } from "@/components/ui/card";
import { SpecialistCard } from "@/components/specialists/specialist-card";
import { HydrationGate } from "@/components/hydration-gate";

function EmployeesInner() {
  const { db } = useStore();
  const team = db.employees.filter((e) => e.active);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionTitle
        eyebrow="The team"
        title="Our specialists"
        description="A small, senior team. Book with whoever you like, or let us match you."
      />
      <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((e) => {
          const user = db.users.find((u) => u.id === e.userId)!;
          return (
            <SpecialistCard
              key={e.id}
              employee={e}
              user={user}
              serviceCount={e.serviceIds.length}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <HydrationGate>
      <EmployeesInner />
    </HydrationGate>
  );
}
