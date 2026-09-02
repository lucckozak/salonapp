"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { addDays, fmt, startOfDay } from "@/lib/time";
import { getAvailableDates, getDaySlots } from "@/lib/availability";
import { fullName } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MiniCalendar } from "@/components/booking/mini-calendar";
import { useToast } from "@/components/ui/toast";

export function RescheduleDialog({
  appointmentId,
  open,
  onClose,
}: {
  appointmentId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { db, rescheduleAppointment, userById, employeeById } = useStore();
  const toast = useToast();
  const [day, setDay] = useState<Date | null>(null);
  const [iso, setIso] = useState<string | null>(null);

  const appt = db.appointments.find((a) => a.id === appointmentId);
  const service = appt && db.services.find((s) => s.id === appt.serviceId);
  const employee = appt && employeeById(appt.employeeId);
  const empUser = employee && userById(employee.userId);

  const ctx = useMemo(
    () => ({ db, ignoreAppointmentId: appointmentId ?? undefined }),
    [db, appointmentId],
  );

  const enabledDays = useMemo(() => {
    if (!appt) return new Set<string>();
    const from = startOfDay(new Date());
    return getAvailableDates(
      ctx,
      appt.serviceId,
      appt.employeeId,
      from,
      addDays(from, db.settings.maxAdvanceDays),
    );
  }, [ctx, appt, db.settings.maxAdvanceDays]);

  const slots = useMemo(() => {
    if (!appt || !day) return [];
    return getDaySlots(ctx, appt.serviceId, appt.employeeId, day);
  }, [ctx, appt, day]);

  function confirm() {
    if (!appt || !iso) return;
    rescheduleAppointment(appt.id, iso);
    toast.success("Appointment rescheduled", "We've emailed the new details.");
    onClose();
    setDay(null);
    setIso(null);
  }

  return (
    <Dialog
      open={open && !!appt}
      onClose={onClose}
      title="Reschedule appointment"
      description={
        service && empUser
          ? `${service.name} with ${fullName(empUser)}`
          : undefined
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Keep current time
          </Button>
          <Button onClick={confirm} disabled={!iso}>
            Confirm new time
          </Button>
        </>
      }
    >
      {enabledDays.size === 0 ? (
        <p className="mb-4 rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
          No open dates in the next {db.settings.maxAdvanceDays} days for this
          specialist and treatment. Please contact the salon to move this
          appointment.
        </p>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-[1fr_1fr]">
        <MiniCalendar
          value={day}
          onSelect={(d) => {
            setDay(d);
            setIso(null);
          }}
          enabledDays={enabledDays}
          minDate={startOfDay(new Date())}
          maxDate={addDays(new Date(), db.settings.maxAdvanceDays)}
        />
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">
            {day ? fmt.fullDate(day) : "Pick a date first"}
          </p>
          {day && slots.length === 0 ? (
            <p className="text-sm text-muted">No open times that day.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((s) => (
                <button
                  key={s.time}
                  onClick={() => setIso(s.iso)}
                  className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                    iso === s.iso
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface hover:border-primary/50"
                  }`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
