"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Clock3, Star } from "lucide-react";
import { useStore } from "@/lib/store";
import { fullName, formatDuration, formatPrice } from "@/lib/utils";
import { DAY_LABELS } from "@/lib/types";
import { SmartImage } from "@/components/ui/smart-image";
import { LinkButton } from "@/components/ui/button";
import { HydrationGate } from "@/components/hydration-gate";
import { EmptyState } from "@/components/ui/misc";
import { AvailabilityExplorer } from "@/components/specialists/availability-explorer";

function ProfileInner() {
  const id = useSearchParams().get("id") ?? "";
  const { db } = useStore();
  const employee = db.employees.find((e) => e.id === id);

  if (!employee) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Specialist not found"
          description="They may have left the team."
          action={
            <Link href="/employees" className="text-sm font-medium text-primary">
              Back to all specialists
            </Link>
          }
        />
      </div>
    );
  }

  const user = db.users.find((u) => u.id === employee.userId)!;
  const services = db.services.filter(
    (s) => s.active && employee.serviceIds.includes(s.id),
  );
  const hours = db.workingHours
    .filter((w) => w.employeeId === employee.id)
    .sort((a, b) => ((a.dayOfWeek + 6) % 7) - ((b.dayOfWeek + 6) % 7));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/employees"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={15} /> All specialists
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[320px_1fr]">
        <div>
          <SmartImage
            src={employee.profileImage}
            alt={fullName(user)}
            fallbackKey={employee.id}
            rounded="rounded-3xl"
            className="aspect-[3/4] w-full shadow-[var(--shadow-card)]"
          />
          <div className="mt-4">
            <LinkButton
              href={`/book?employee=${employee.id}${
                services[0] ? `&service=${services[0].id}` : ""
              }`}
              className="w-full"
              size="lg"
            >
              Book with {user.firstName}
            </LinkButton>
          </div>
        </div>

        <div>
          <h1 className="font-serif text-3xl font-medium text-foreground">
            {fullName(user)}
          </h1>
          <p className="mt-1 text-accent">{employee.jobTitle}</p>
          {employee.rating ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-strong">
              <Star size={14} className="fill-accent text-accent" />
              {employee.rating.toFixed(1)} · {employee.reviewCount} reviews
            </p>
          ) : null}
          <p className="mt-5 max-w-prose text-[15px] leading-relaxed text-muted-strong">
            {employee.bio}
          </p>

          <h2 className="mt-8 text-lg font-medium text-foreground">Treatments</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {services.map((s) => (
              <Link
                key={s.id}
                href={`/book?employee=${employee.id}&service=${s.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-3 text-sm transition-colors hover:border-primary/40"
              >
                <span className="font-medium text-foreground">{s.name}</span>
                <span className="flex items-center gap-3 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={12} />
                    {formatDuration(s.durationMinutes)}
                  </span>
                  <span className="font-serif text-sm text-primary">
                    {formatPrice(s.price, db.settings.currency)}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-medium text-foreground">
            Working hours
          </h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            {hours.map((h, i) => (
              <div
                key={h.id}
                className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                  i % 2 ? "bg-surface" : "bg-surface-muted"
                }`}
              >
                <span className="text-muted-strong">
                  {DAY_LABELS[h.dayOfWeek]}
                </span>
                <span className="font-medium text-foreground">
                  {h.startTime && h.endTime
                    ? `${h.startTime} – ${h.endTime}`
                    : "Off"}
                </span>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-medium text-foreground">
            Availability
          </h2>
          <p className="mt-1 text-xs text-muted">
            See {user.firstName}’s open times for any day — pick a treatment to
            narrow it down, or tap a slot to start booking.
          </p>
          <div className="mt-3">
            <AvailabilityExplorer employeeId={employee.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeProfilePage() {
  return (
    <HydrationGate>
      <Suspense fallback={null}>
        <ProfileInner />
      </Suspense>
    </HydrationGate>
  );
}
