"use client";

import { useStore } from "@/lib/store";
import type { Appointment } from "@/lib/types";
import { viewAppointment } from "@/lib/selectors";
import { fmt } from "@/lib/time";
import { formatPrice, fullName } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/misc";
import { CalendarX2 } from "lucide-react";

export function AppointmentsTable({
  appointments,
  onRowClick,
  showDate = true,
}: {
  appointments: Appointment[];
  onRowClick?: (id: string) => void;
  showDate?: boolean;
}) {
  const { db } = useStore();

  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={<CalendarX2 size={20} />}
        title="No appointments match"
        description="Adjust the filters above."
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-muted">
              {showDate ? <th className="px-4 py-3">Date</th> : null}
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Specialist</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {appointments.map((a) => {
              const v = viewAppointment(db, a);
              return (
                <tr
                  key={a.id}
                  onClick={() => onRowClick?.(a.id)}
                  className={
                    onRowClick
                      ? "cursor-pointer transition-colors hover:bg-surface-muted"
                      : ""
                  }
                >
                  {showDate ? (
                    <td className="whitespace-nowrap px-4 py-3 text-muted-strong">
                      {fmt.relativeDay(v.start)}
                    </td>
                  ) : null}
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                    {fmt.time(v.start)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <Avatar
                        name={v.customer ? fullName(v.customer) : "?"}
                        size="xs"
                      />
                      <span className="text-foreground">
                        {v.customer ? fullName(v.customer) : "—"}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-strong">
                    {v.service?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-strong">
                    {v.employeeUser ? fullName(v.employeeUser) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-strong">
                    {v.service
                      ? formatPrice(v.service.price, db.settings.currency)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {appointments.map((a) => {
          const v = viewAppointment(db, a);
          return (
            <button
              key={a.id}
              onClick={() => onRowClick?.(a.id)}
              className="w-full rounded-2xl border border-border bg-surface p-4 text-left shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {v.customer ? fullName(v.customer) : "—"}
                </span>
                <StatusBadge status={a.status} />
              </div>
              <p className="mt-1 text-sm text-muted">
                {v.service?.name} · {v.employeeUser ? fullName(v.employeeUser) : "—"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {fmt.relativeDay(v.start)} · {fmt.timeRange(v.start, v.end)}
              </p>
            </button>
          );
        })}
      </div>
    </>
  );
}
