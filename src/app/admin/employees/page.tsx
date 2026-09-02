"use client";

import Link from "next/link";
import { Plus, Star } from "lucide-react";
import { useStore } from "@/lib/store";
import { fullName } from "@/lib/utils";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/misc";
import { toDate } from "@/lib/time";

export default function AdminEmployeesPage() {
  const { db, setEmployeeActive } = useStore();

  return (
    <div>
      <PageHeading
        title="Employees"
        description={`${db.employees.length} specialists`}
        action={
          <LinkButton href="/admin/employees/manage?id=new" size="sm">
            <Plus size={15} /> Add employee
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {db.employees.map((e) => {
          const u = db.users.find((x) => x.id === e.userId)!;
          const upcoming = db.appointments.filter(
            (a) =>
              a.employeeId === e.id &&
              a.status !== "CANCELLED" &&
              toDate(a.start) > new Date(),
          ).length;
          const onLeave = db.timeBlocks.some(
            (b) =>
              b.employeeId === e.id &&
              b.type === "VACATION" &&
              toDate(b.start) <= new Date() &&
              toDate(b.end) >= new Date(),
          );
          return (
            <div
              key={e.id}
              className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start gap-3">
                <Avatar src={e.profileImage} name={fullName(u)} size="lg" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/employees/manage?id=${e.id}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {fullName(u)}
                  </Link>
                  <p className="text-sm text-accent">{e.jobTitle}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {!e.active ? (
                      <Badge tone="neutral">Inactive</Badge>
                    ) : onLeave ? (
                      <Badge tone="warning">On leave</Badge>
                    ) : (
                      <Badge tone="success">Available</Badge>
                    )}
                    {e.rating ? (
                      <Badge tone="accent">
                        <Star size={11} className="fill-accent" />
                        {e.rating.toFixed(1)}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted">Services</dt>
                  <dd className="font-medium text-foreground">
                    {e.serviceIds.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Upcoming</dt>
                  <dd className="font-medium text-foreground">{upcoming}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <Switch
                  checked={e.active}
                  onChange={(v) => setEmployeeActive(e.id, v)}
                  label="Active"
                />
                <Link
                  href={`/admin/employees/manage?id=${e.id}`}
                  className="text-sm font-medium text-primary hover:text-primary-hover"
                >
                  Manage →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
