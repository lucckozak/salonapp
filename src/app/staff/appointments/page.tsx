"use client";

import { useMemo, useState } from "react";
import { CalendarX2, CheckCircle2, XCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCurrentEmployee } from "@/lib/use-current-employee";
import {
  pastAppointments,
  upcomingAppointments,
  viewAppointment,
} from "@/lib/selectors";
import { toDate } from "@/lib/time";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { Segmented, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { useToast } from "@/components/ui/toast";
import type { AppointmentStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

export default function StaffAppointmentsPage() {
  const { db, setAppointmentStatus } = useStore();
  const employee = useCurrentEmployee();
  const toast = useToast();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [status, setStatus] = useState<AppointmentStatus | "ALL">("ALL");

  const list = useMemo(() => {
    if (!employee) return [];
    const base =
      tab === "upcoming"
        ? upcomingAppointments(db, { employeeId: employee.id })
        : pastAppointments(db, { employeeId: employee.id });
    return status === "ALL" ? base : base.filter((a) => a.status === status);
  }, [db, employee, tab, status]);

  if (!employee) return <EmptyState title="No specialist profile linked." />;

  return (
    <div>
      <PageHeading
        title="Appointments"
        description="Your bookings and their customer details."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "upcoming", label: "Upcoming" },
            { value: "past", label: "History" },
          ]}
        />
        <div className="flex flex-wrap gap-1.5">
          {(["ALL", "CONFIRMED", "PENDING", "COMPLETED", "NO_SHOW", "CANCELLED"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  status === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-muted hover:text-foreground"
                }`}
              >
                {s === "ALL" ? "All" : STATUS_LABELS[s]}
              </button>
            ),
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<CalendarX2 size={20} />}
          title="Nothing to show"
          description="Try a different filter."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((a) => {
            const started = toDate(a.start) <= new Date();
            return (
              <AppointmentCard
                key={a.id}
                view={viewAppointment(db, a)}
                perspective="staff"
                currency={db.settings.currency}
                actions={
                  a.status === "CONFIRMED" || a.status === "PENDING" ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!started}
                        onClick={() => {
                          setAppointmentStatus(a.id, "COMPLETED");
                          toast.success("Marked completed");
                        }}
                      >
                        <CheckCircle2 size={14} /> Complete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!started}
                        onClick={() => {
                          setAppointmentStatus(a.id, "NO_SHOW");
                          toast.info("Marked as no-show");
                        }}
                      >
                        <XCircle size={14} /> No-show
                      </Button>
                    </>
                  ) : null
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
