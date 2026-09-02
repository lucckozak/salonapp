"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  XCircle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useCurrentEmployee } from "@/lib/use-current-employee";
import {
  appointmentsOn,
  upcomingAppointments,
  viewAppointment,
} from "@/lib/selectors";
import { fmt, isSameDay, startOfDay, toDate } from "@/lib/time";
import { fullName } from "@/lib/utils";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { Stat, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { useToast } from "@/components/ui/toast";

export default function StaffDashboard() {
  const { db, setAppointmentStatus } = useStore();
  const employee = useCurrentEmployee();
  const toast = useToast();
  const now = new Date();

  const stats = useMemo(() => {
    if (!employee) return null;
    const f = { employeeId: employee.id };
    const today = appointmentsOn(db, now, f).filter(
      (a) => a.status !== "CANCELLED",
    );
    const weekStart = startOfDay(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const week = db.appointments.filter(
      (a) =>
        a.employeeId === employee.id &&
        toDate(a.start) >= weekStart &&
        toDate(a.start) < weekEnd &&
        a.status !== "CANCELLED",
    );
    return {
      today,
      todayCount: today.length,
      weekCount: week.length,
      completedWeek: week.filter((a) => a.status === "COMPLETED").length,
      next: upcomingAppointments(db, f, now)[0] ?? null,
    };
  }, [db, employee]);

  if (!employee || !stats) {
    return <EmptyState title="No specialist profile linked to this account." />;
  }

  const user = db.users.find((u) => u.id === employee.userId)!;

  return (
    <div>
      <PageHeading
        title={`Good ${greeting()}, ${user.firstName}`}
        description={fmt.fullDate(now)}
        action={
          <Link href="/staff/calendar">
            <Button variant="outline" size="sm">
              Open calendar <ChevronRight size={15} />
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <Stat
          label="Today"
          value={stats.todayCount}
          hint="appointments"
          icon={<CalendarClock size={15} />}
        />
        <Stat
          label="This week"
          value={stats.weekCount}
          tone="info"
          hint={`${stats.completedWeek} completed`}
          icon={<Clock3 size={15} />}
        />
        <Stat
          label="Next up"
          value={stats.next ? fmt.time(stats.next.start) : "—"}
          tone="accent"
          hint={
            stats.next
              ? `${fmt.relativeDay(stats.next.start)} · ${
                  db.services.find((s) => s.id === stats.next!.serviceId)?.name
                }`
              : "Nothing scheduled"
          }
          icon={<CalendarClock size={15} />}
        />
        <Stat
          label="Treatments"
          value={employee.serviceIds.length}
          tone="success"
          hint="you offer"
          icon={<CheckCircle2 size={15} />}
        />
      </div>

      <h2 className="mb-3 mt-8 text-base font-medium text-foreground sm:text-lg">
        Today's schedule
      </h2>
      {stats.today.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={20} />}
          title="No appointments today"
          description="Enjoy the breather — new bookings will appear here automatically."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {stats.today.map((a) => {
            const view = viewAppointment(db, a);
            const started = toDate(a.start) <= now;
            return (
              <AppointmentCard
                key={a.id}
                view={view}
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

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
