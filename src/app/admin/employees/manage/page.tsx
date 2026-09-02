"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckCircle2, Trash2, Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatPrice, fullName } from "@/lib/utils";
import {
  appointmentsInRange,
  priceOf,
  startOfMonth,
  startOfWeek,
  upcomingAppointments,
  viewAppointment,
} from "@/lib/selectors";
import { addDays } from "@/lib/time";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { EmployeeForm } from "@/components/employees/employee-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, Segmented, Stat } from "@/components/ui/misc";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { EmployeeSchedule } from "@/components/calendar/employee-schedule";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { AppointmentEditorDialog } from "@/components/appointments/appointment-editor-dialog";

function EmployeeDetail() {
  const id = useSearchParams().get("id") ?? "new";
  const isNew = id === "new";
  const { db, deleteEmployee } = useStore();
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tab, setTab] = useState<"bookings" | "details">("bookings");
  const [editorId, setEditorId] = useState<string | null>(null);

  const employee = isNew ? null : db.employees.find((e) => e.id === id);
  const user = employee && db.users.find((u) => u.id === employee.userId);

  const stats = useMemo(() => {
    if (!employee) return null;
    const now = new Date();
    const weekFrom = startOfWeek(now);
    const weekTo = addDays(weekFrom, 7);
    const monthFrom = startOfMonth(now);
    const monthTo = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const mine = (a: { employeeId: string; status: string }) =>
      a.employeeId === employee.id && a.status !== "CANCELLED";

    const week = appointmentsInRange(db, weekFrom, weekTo).filter(mine);
    const month = appointmentsInRange(db, monthFrom, monthTo).filter(mine);
    const monthRevenue = month
      .filter((a) => a.status === "COMPLETED" || a.status === "CONFIRMED")
      .reduce((s, a) => s + priceOf(db, a), 0);

    return {
      week: week.length,
      month: month.length,
      completedAllTime: db.appointments.filter(
        (a) => a.employeeId === employee.id && a.status === "COMPLETED",
      ).length,
      upcoming: upcomingAppointments(db, { employeeId: employee.id }, now),
      monthRevenue,
    };
  }, [db, employee]);

  if (!isNew && !employee) {
    return (
      <EmptyState
        title="Employee not found"
        action={
          <Link href="/admin/employees" className="text-primary">
            Back to employees
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <Link
        href="/admin/employees"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={15} /> Employees
      </Link>

      <PageHeading
        title={isNew ? "Add employee" : fullName(user!)}
        description={
          isNew
            ? "Creates the login account and public profile in one step."
            : `${employee!.jobTitle} · ${user!.email}`
        }
        action={
          !isNew ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={14} /> Delete
            </Button>
          ) : undefined
        }
      />

      {isNew ? (
        <EmployeeForm employeeId={null} />
      ) : (
        <>
          <div className="mb-6">
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { value: "bookings", label: "Bookings" },
                { value: "details", label: "Details & schedule" },
              ]}
            />
          </div>

          {tab === "details" ? (
            <EmployeeForm employeeId={id} />
          ) : (
            <div className="space-y-8">
              {stats ? (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
                  <Stat
                    label="This week"
                    value={stats.week}
                    hint="appointments"
                    icon={<CalendarClock size={15} />}
                  />
                  <Stat
                    label="This month"
                    value={stats.month}
                    tone="info"
                    hint="appointments"
                    icon={<CalendarClock size={15} />}
                  />
                  <Stat
                    label="Month revenue"
                    value={formatPrice(stats.monthRevenue, db.settings.currency)}
                    tone="success"
                    hint="completed + confirmed"
                    icon={<Wallet size={15} />}
                  />
                  <Stat
                    label="Completed"
                    value={stats.completedAllTime}
                    tone="accent"
                    hint="all-time"
                    icon={<CheckCircle2 size={15} />}
                  />
                </div>
              ) : null}

              <Card>
                <CardBody>
                  <h2 className="mb-4 text-base font-medium text-foreground">
                    Calendar
                  </h2>
                  <EmployeeSchedule
                    employeeId={id}
                    defaultMode="week"
                    onSelectAppointment={(aid) => setEditorId(aid)}
                    dayOffLabel="This specialist isn't scheduled to work this day."
                  />
                </CardBody>
              </Card>

              <div>
                <h2 className="mb-4 text-base font-medium text-foreground">
                  Upcoming appointments
                </h2>
                {!stats || stats.upcoming.length === 0 ? (
                  <EmptyState title="No upcoming appointments" />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {stats.upcoming.slice(0, 8).map((a) => (
                      <AppointmentCard
                        key={a.id}
                        view={viewAppointment(db, a)}
                        perspective="admin"
                        currency={db.settings.currency}
                        onClick={() => setEditorId(a.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <AppointmentEditorDialog
        open={!!editorId}
        appointmentId={editorId}
        onClose={() => setEditorId(null)}
      />

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this employee?"
        description="Their account, schedule and blocks are removed. Future appointments are cancelled and customers notified."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteEmployee(id);
                toast.info("Employee deleted");
                router.push("/admin/employees");
              }}
            >
              Delete employee
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">{user ? fullName(user) : ""}</p>
      </Dialog>
    </div>
  );
}

export default function AdminEmployeePage() {
  return (
    <Suspense fallback={null}>
      <EmployeeDetail />
    </Suspense>
  );
}
