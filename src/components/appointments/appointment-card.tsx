"use client";

import { CalendarDays, Clock3, Scissors, User as UserIcon } from "lucide-react";
import type { AppointmentView } from "@/lib/selectors";
import { cn, formatPrice, fullName } from "@/lib/utils";
import { fmt } from "@/lib/time";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

export function AppointmentCard({
  view,
  perspective = "customer",
  actions,
  currency = "AED",
  className,
  onClick,
}: {
  view: AppointmentView;
  perspective?: "customer" | "staff" | "admin";
  actions?: React.ReactNode;
  currency?: string;
  className?: string;
  onClick?: () => void;
}) {
  const { appt, customer, employeeUser, service, start, end } = view;
  const cancelled = appt.status === "CANCELLED";

  const headline =
    perspective === "customer"
      ? service?.name ?? "Treatment"
      : customer
        ? fullName(customer)
        : "Customer";

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-shadow",
        onClick && "cursor-pointer hover:shadow-[var(--shadow-pop)]",
        cancelled && "opacity-70",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "truncate text-[15px] font-medium text-foreground",
                cancelled && "line-through",
              )}
            >
              {headline}
            </h3>
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {perspective === "customer"
              ? employeeUser
                ? `with ${fullName(employeeUser)}`
                : "with our team"
              : service?.name}
          </p>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-strong">
        <span className="inline-flex items-center gap-2">
          <CalendarDays size={15} className="text-muted" />
          {fmt.relativeDay(start)}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock3 size={15} className="text-muted" />
          {fmt.timeRange(start, end)}
        </span>
        {perspective !== "customer" && employeeUser ? (
          <span className="inline-flex items-center gap-2">
            <Scissors size={15} className="text-muted" />
            {fullName(employeeUser)}
          </span>
        ) : null}
        {service ? (
          <span className="inline-flex items-center gap-2">
            <span className="text-muted">{currency}</span>
            {formatPrice(service.price, currency).replace(`${currency} `, "")}
          </span>
        ) : null}
        {perspective === "admin" && customer ? (
          <span className="col-span-2 inline-flex items-center gap-2">
            <UserIcon size={15} className="text-muted" />
            {customer.phone}
          </span>
        ) : null}
      </div>

      {appt.customerNotes ? (
        <p className="mt-3 rounded-xl bg-surface-sunken px-3 py-2 text-xs text-muted-strong">
          “{appt.customerNotes}”
        </p>
      ) : null}
      {appt.cancellationReason && cancelled ? (
        <p className="mt-3 text-xs text-danger">
          Cancelled — {appt.cancellationReason}
        </p>
      ) : null}

      {perspective !== "customer" && customer ? (
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
          <Avatar name={fullName(customer)} size="xs" />
          <span className="text-xs text-muted">
            {customer.email} · {customer.phone}
          </span>
        </div>
      ) : null}

      {actions ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
