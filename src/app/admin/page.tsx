"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Cake,
  CalendarClock,
  CalendarDays,
  Mail,
  Plus,
  TrendingUp,
  Users,
  UsersRound,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  appointmentsOn,
  revenueForDay,
  todaysBirthdays,
  upcomingAppointments,
} from "@/lib/selectors";
import { fmt, toDate } from "@/lib/time";
import { formatPrice, fullName } from "@/lib/utils";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { Stat } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { AppointmentsTable } from "@/components/appointments/appointments-table";
import { AppointmentEditorDialog } from "@/components/appointments/appointment-editor-dialog";
import { useToast } from "@/components/ui/toast";

export default function AdminDashboard() {
  const { db, sendBirthdayGreeting } = useStore();
  const toast = useToast();
  const now = new Date();
  const [editorId, setEditorId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const metrics = useMemo(() => {
    const today = appointmentsOn(db, now).filter((a) => a.status !== "CANCELLED");
    return {
      today,
      todayCount: today.length,
      upcoming: upcomingAppointments(db, {}, now).length,
      revenue: revenueForDay(db, now),
      employees: db.employees.filter((e) => e.active).length,
      customers: db.users.filter((u) => u.role === "CUSTOMER").length,
      birthdays: todaysBirthdays(db, now),
    };
  }, [db]);

  const recentEmails = db.emailLog.slice(0, 5);

  return (
    <div>
      <PageHeading
        title="Dashboard"
        description={fmt.fullDate(now)}
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={15} /> New appointment
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-5">
        <Stat
          label="Today"
          value={metrics.todayCount}
          icon={<CalendarClock size={15} />}
        />
        <Stat
          label="Upcoming"
          value={metrics.upcoming}
          tone="info"
          icon={<CalendarDays size={15} />}
        />
        <Stat
          label="Revenue today"
          value={formatPrice(metrics.revenue, db.settings.currency)}
          tone="success"
          icon={<TrendingUp size={15} />}
        />
        <Stat
          label="Employees"
          value={metrics.employees}
          tone="accent"
          icon={<UsersRound size={15} />}
        />
        <Stat
          label="Customers"
          value={metrics.customers.toLocaleString()}
          tone="warning"
          icon={<Users size={15} />}
        />
      </div>

      {metrics.birthdays.length > 0 ? (
        <Card className="mt-6">
          <CardBody>
            <div className="mb-3 flex items-center gap-2">
              <Cake size={16} className="text-primary" />
              <h2 className="text-base font-medium text-foreground">
                Birthdays today
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {metrics.birthdays.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-full border border-border bg-surface-muted py-1 pl-3 pr-1.5 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {fullName(c)}
                  </span>
                  <button
                    onClick={() => {
                      sendBirthdayGreeting(c.id);
                      toast.success(`Greeting sent to ${c.firstName}`);
                    }}
                    className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
                  >
                    Send greeting
                  </button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-medium text-foreground sm:text-lg">
              Today's appointments
            </h2>
            <Link
              href="/admin/appointments"
              className="text-sm font-medium text-primary hover:text-primary-hover"
            >
              View all →
            </Link>
          </div>
          <AppointmentsTable
            appointments={metrics.today}
            showDate={false}
            onRowClick={(id) => setEditorId(id)}
          />
        </div>

        <div className="min-w-0">
          <h2 className="mb-3 text-base font-medium text-foreground sm:text-lg">
            Notification log
          </h2>
          <Card>
            <CardBody className="space-y-3">
              {recentEmails.length === 0 ? (
                <p className="text-sm text-muted">No emails sent yet.</p>
              ) : (
                recentEmails.map((m) => (
                  <div key={m.id} className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <Mail size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {m.subject}
                      </p>
                      <p className="truncate text-xs text-muted">
                        to {m.to} · {fmt.relativeDay(m.sentAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <p className="border-t border-border pt-3 text-xs text-muted">
                Email delivery is stubbed in this prototype — messages are logged
                here instead of sent.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <AppointmentEditorDialog
        open={!!editorId}
        appointmentId={editorId}
        onClose={() => setEditorId(null)}
      />
      <AppointmentEditorDialog
        open={creating}
        onClose={() => setCreating(false)}
      />
    </div>
  );
}
