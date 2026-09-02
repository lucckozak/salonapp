"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
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
  upcomingAppointments,
} from "@/lib/selectors";
import { fmt, toDate } from "@/lib/time";
import { formatPrice } from "@/lib/utils";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { Stat } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { AppointmentsTable } from "@/components/appointments/appointments-table";
import { AppointmentEditorDialog } from "@/components/appointments/appointment-editor-dialog";

export default function AdminDashboard() {
  const { db } = useStore();
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat
          label="Today's appointments"
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
          label="Today's revenue"
          value={formatPrice(metrics.revenue, db.settings.currency)}
          tone="success"
          icon={<TrendingUp size={15} />}
        />
        <Stat
          label="Active employees"
          value={metrics.employees}
          tone="accent"
          icon={<UsersRound size={15} />}
        />
        <Stat
          label="Total customers"
          value={metrics.customers.toLocaleString()}
          tone="warning"
          icon={<Users size={15} />}
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">
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

        <div>
          <h2 className="mb-4 text-lg font-medium text-foreground">
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
