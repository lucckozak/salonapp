"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { AppointmentStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { fmt, toDate } from "@/lib/time";
import { getDaySlots, isSlotBookable } from "@/lib/availability";
import { fullName } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";

interface Presets {
  employeeId?: string;
  startIso?: string;
  customerId?: string;
}

export function AppointmentEditorDialog({
  open,
  onClose,
  appointmentId,
  presets,
}: {
  open: boolean;
  onClose: () => void;
  appointmentId?: string | null;
  presets?: Presets;
}) {
  const {
    db,
    book,
    updateAppointment,
    createCustomer,
  } = useStore();
  const toast = useToast();
  const editing = !!appointmentId;
  const existing = db.appointments.find((a) => a.id === appointmentId);

  const [customerId, setCustomerId] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [time, setTime] = useState("");
  const [status, setStatus] = useState<AppointmentStatus>("CONFIRMED");
  const [adminNotes, setAdminNotes] = useState("");
  const [override, setOverride] = useState(false);

  /* hydrate on open */
  useEffect(() => {
    if (!open) return;
    if (existing) {
      setCustomerId(existing.customerId);
      setServiceId(existing.serviceId);
      setEmployeeId(existing.employeeId);
      setDateStr(fmt.isoDate(existing.start));
      setTime(fmt.isoDate(existing.start) ? toHHmm(existing.start) : "");
      setStatus(existing.status);
      setAdminNotes(existing.adminNotes ?? "");
    } else {
      setCustomerId(presets?.customerId ?? "");
      setServiceId("");
      setEmployeeId(presets?.employeeId ?? "");
      setDateStr(presets?.startIso ? fmt.isoDate(presets.startIso) : "");
      setTime(presets?.startIso ? toHHmm(presets.startIso) : "");
      setStatus("CONFIRMED");
      setAdminNotes("");
    }
    setOverride(false);
    setAddingCustomer(false);
    setNewCustomer({ firstName: "", lastName: "", email: "", phone: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointmentId]);

  const service = db.services.find((s) => s.id === serviceId);
  const customers = db.users
    .filter((u) => u.role === "CUSTOMER")
    .sort((a, b) => a.firstName.localeCompare(b.firstName));
  const eligibleEmployees = db.employees.filter(
    (e) => !serviceId || e.serviceIds.includes(serviceId),
  );

  const ctx = useMemo(
    () => ({ db, ignoreAppointmentId: appointmentId ?? undefined }),
    [db, appointmentId],
  );

  const slots = useMemo(() => {
    if (!serviceId || !employeeId || !dateStr) return [];
    return getDaySlots(ctx, serviceId, employeeId, new Date(`${dateStr}T00:00`));
  }, [ctx, serviceId, employeeId, dateStr]);

  const startDate =
    dateStr && time ? new Date(`${dateStr}T${time}`) : null;

  const slotOk =
    !!startDate &&
    !!serviceId &&
    !!employeeId &&
    (override || isSlotBookable(ctx, serviceId, employeeId, startDate));

  const canSave =
    !!serviceId &&
    !!employeeId &&
    !!startDate &&
    slotOk &&
    (!!customerId || (addingCustomer && newCustomer.firstName && newCustomer.email));

  function save() {
    if (!startDate || !service) return;
    let finalCustomer = customerId;
    if (addingCustomer && !customerId) {
      finalCustomer = createCustomer({
        firstName: newCustomer.firstName.trim(),
        lastName: newCustomer.lastName.trim(),
        email: newCustomer.email.trim(),
        phone: newCustomer.phone.trim(),
      }).id;
    }

    if (editing && existing) {
      updateAppointment(existing.id, {
        customerId: finalCustomer,
        serviceId,
        employeeId,
        start: startDate.toISOString(),
        status,
        adminNotes: adminNotes.trim() || undefined,
      });
      toast.success("Appointment updated");
    } else {
      book({
        customerId: finalCustomer,
        serviceId,
        employeeId,
        start: startDate.toISOString(),
        status,
        source: "ADMIN",
      });
      toast.success("Appointment created", "Confirmation email sent to the customer.");
    }
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit appointment" : "New appointment"}
      description={
        editing
          ? "Change any detail — the customer is notified of time changes."
          : "Manually book a customer in."
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave}>
            {editing ? "Save changes" : "Create appointment"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {/* Customer */}
        {!addingCustomer ? (
          <Field label="Customer" required>
            <div className="flex gap-2">
              <Select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Select a customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {fullName(c)} · {c.phone}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setAddingCustomer(true);
                  setCustomerId("");
                }}
              >
                New
              </Button>
            </div>
          </Field>
        ) : (
          <div className="rounded-xl border border-border bg-surface-muted p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">New customer</p>
              <button
                className="text-xs text-primary"
                onClick={() => setAddingCustomer(false)}
              >
                Pick existing instead
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="First name"
                value={newCustomer.firstName}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, firstName: e.target.value })
                }
              />
              <Input
                placeholder="Last name"
                value={newCustomer.lastName}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, lastName: e.target.value })
                }
              />
              <Input
                placeholder="Email"
                value={newCustomer.email}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, email: e.target.value })
                }
              />
              <Input
                placeholder="Phone"
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, phone: e.target.value })
                }
              />
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Service" required>
            <Select
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setTime("");
              }}
            >
              <option value="">Select…</option>
              {db.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.durationMinutes}m)
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Specialist" required>
            <Select
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value);
                setTime("");
              }}
            >
              <option value="">Select…</option>
              {eligibleEmployees.map((e) => {
                const u = db.users.find((x) => x.id === e.userId)!;
                return (
                  <option key={e.id} value={e.id}>
                    {fullName(u)}
                  </option>
                );
              })}
            </Select>
          </Field>
          <Field label="Date" required>
            <Input
              type="date"
              value={dateStr}
              onChange={(e) => {
                setDateStr(e.target.value);
                setTime("");
              }}
            />
          </Field>
          <Field
            label="Time"
            required
            hint={
              slots.length
                ? `${slots.length} open slots`
                : serviceId && employeeId && dateStr
                  ? "No open slots — use override"
                  : undefined
            }
          >
            {override ? (
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            ) : (
              <Select value={time} onChange={(e) => setTime(e.target.value)}>
                <option value="">Select…</option>
                {slots.map((s) => (
                  <option key={s.time} value={s.time}>
                    {s.time}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <Field label="Status">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
          >
            {(
              [
                "PENDING",
                "CONFIRMED",
                "COMPLETED",
                "CANCELLED",
                "NO_SHOW",
              ] as AppointmentStatus[]
            ).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Internal notes" hint="Visible to staff only">
          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
        </Field>

        <Switch
          checked={override}
          onChange={setOverride}
          label="Override availability"
          description="Allow booking outside working hours or over another appointment."
        />

        {startDate && !slotOk ? (
          <p className="text-xs text-danger">
            That time isn't available for this specialist. Enable override to force
            it.
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

function toHHmm(iso: string) {
  const d = toDate(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}
