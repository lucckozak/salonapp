"use client";

import { useMemo, useState } from "react";
import { Download, Plus, SlidersHorizontal, X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { AppointmentStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { fmt, isSameDay, toDate } from "@/lib/time";
import { cn, downloadCsv, fullName } from "@/lib/utils";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { AppointmentsTable } from "@/components/appointments/appointments-table";
import { AppointmentEditorDialog } from "@/components/appointments/appointment-editor-dialog";

export default function AdminAppointmentsPage() {
  const { db } = useStore();
  const [editorId, setEditorId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [date, setDate] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [status, setStatus] = useState<AppointmentStatus | "">("");
  const [q, setQ] = useState("");
  const [range, setRange] = useState<"all" | "upcoming" | "past">("upcoming");
  const [showFilters, setShowFilters] = useState(false);

  const activeCount =
    (date ? 1 : 0) +
    (employeeId ? 1 : 0) +
    (serviceId ? 1 : 0) +
    (status ? 1 : 0) +
    (range !== "upcoming" ? 1 : 0);

  function clearAll() {
    setDate("");
    setEmployeeId("");
    setServiceId("");
    setStatus("");
    setQ("");
    setRange("upcoming");
  }

  const filtered = useMemo(() => {
    const now = new Date();
    return db.appointments
      .filter((a) => {
        if (date && !isSameDay(toDate(a.start), new Date(`${date}T00:00`)))
          return false;
        if (employeeId && a.employeeId !== employeeId) return false;
        if (serviceId && a.serviceId !== serviceId) return false;
        if (status && a.status !== status) return false;
        if (range === "upcoming" && toDate(a.start) < now && !date) return false;
        if (range === "past" && toDate(a.start) >= now && !date) return false;
        if (q) {
          const c = db.users.find((u) => u.id === a.customerId);
          const hay = `${c ? fullName(c) : ""} ${c?.email ?? ""} ${
            c?.phone ?? ""
          }`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) =>
        range === "past"
          ? +toDate(b.start) - +toDate(a.start)
          : +toDate(a.start) - +toDate(b.start),
      );
  }, [db, date, employeeId, serviceId, status, q, range]);

  const hasFilters =
    date || employeeId || serviceId || status || q || range !== "upcoming";

  function exportCsv() {
    downloadCsv(
      `appointments-${fmt.isoDate(new Date())}.csv`,
      ["Date", "Time", "Customer", "Email", "Phone", "Service", "Specialist", "Price", "Status"],
      filtered.map((a) => {
        const c = db.users.find((u) => u.id === a.customerId);
        const emp = db.employees.find((e) => e.id === a.employeeId);
        const empUser = emp && db.users.find((u) => u.id === emp.userId);
        const svc = db.services.find((s) => s.id === a.serviceId);
        return [
          fmt.isoDate(a.start),
          fmt.time(a.start),
          c ? fullName(c) : "",
          c?.email,
          c?.phone,
          svc?.name,
          empUser ? fullName(empUser) : "",
          svc?.price,
          STATUS_LABELS[a.status],
        ];
      }),
    );
  }

  return (
    <div>
      <PageHeading
        title="Appointments"
        description={`${filtered.length} matching`}
        action={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download size={15} /> Export CSV
            </Button>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus size={15} /> New appointment
            </Button>
          </>
        }
      />

      <div className="mb-5 rounded-2xl border border-border bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Search customer">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, email or phone"
            />
          </Field>
          <div
            className={cn("contents", !showFilters && "hidden sm:contents")}
          >
        <Field label="Date">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Range">
          <Select
            value={range}
            onChange={(e) => setRange(e.target.value as typeof range)}
          >
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="all">All time</option>
          </Select>
        </Field>
        <Field label="Specialist">
          <Select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">All specialists</option>
            {db.employees.map((e) => {
              const u = db.users.find((x) => x.id === e.userId)!;
              return (
                <option key={e.id} value={e.id}>
                  {fullName(u)}
                </option>
              );
            })}
          </Select>
        </Field>
        <Field label="Service">
          <Select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="">All services</option>
            {db.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as AppointmentStatus | "")}
          >
            <option value="">Any status</option>
            {(
              Object.keys(STATUS_LABELS) as AppointmentStatus[]
            ).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
          </div>
          {hasFilters ? (
            <div className="hidden items-end sm:flex">
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <X size={14} /> Clear filters
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-2 sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal size={14} />
            {showFilters ? "Hide filters" : "Filters"}
            {activeCount > 0 ? (
              <span className="ml-0.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {activeCount}
              </span>
            ) : null}
          </Button>
          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X size={14} /> Clear
            </Button>
          ) : null}
        </div>
      </div>

      <AppointmentsTable
        appointments={filtered}
        onRowClick={(id) => setEditorId(id)}
      />

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
