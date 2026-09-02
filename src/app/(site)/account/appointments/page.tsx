"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import {
  isCancellable,
  pastAppointments,
  upcomingAppointments,
  viewAppointment,
} from "@/lib/selectors";
import { Segmented, EmptyState } from "@/components/ui/misc";
import { Button, LinkButton } from "@/components/ui/button";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { RescheduleDialog } from "@/components/appointments/reschedule-dialog";
import { CancelDialog } from "@/components/appointments/cancel-dialog";

export default function CustomerAppointmentsPage() {
  const { user } = useAuth();
  const { db } = useStore();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  if (!user) return null;

  const list =
    tab === "upcoming"
      ? upcomingAppointments(db, { customerId: user.id })
      : pastAppointments(db, { customerId: user.id });

  return (
    <div>
      <div className="flex items-center justify-between">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "upcoming", label: "Upcoming" },
            { value: "past", label: "Past" },
          ]}
        />
        <LinkButton href="/book" size="sm">
          <CalendarPlus size={15} /> Book
        </LinkButton>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {list.length === 0 ? (
          <div className="sm:col-span-2">
            <EmptyState
              icon={<CalendarPlus size={20} />}
              title={
                tab === "upcoming"
                  ? "No upcoming appointments"
                  : "Nothing in your history yet"
              }
              description={
                tab === "upcoming"
                  ? "Book a treatment and it'll show up here."
                  : "Your completed and cancelled visits will appear here."
              }
              action={
                tab === "upcoming" ? (
                  <LinkButton href="/book">Book an appointment</LinkButton>
                ) : undefined
              }
            />
          </div>
        ) : (
          list.map((a) => {
            const view = viewAppointment(db, a);
            const canManage = isCancellable(
              a,
              db.settings.cancellationWindowHours,
            );
            return (
              <AppointmentCard
                key={a.id}
                view={view}
                perspective="customer"
                currency={db.settings.currency}
                actions={
                  tab === "upcoming" && canManage ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRescheduleId(a.id)}
                      >
                        Reschedule
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancelId(a.id)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : tab === "upcoming" ? (
                    <p className="text-xs text-muted">
                      Within {db.settings.cancellationWindowHours}h of the
                      appointment — please call the salon to make changes.
                    </p>
                  ) : null
                }
              />
            );
          })
        )}
      </div>

      <RescheduleDialog
        appointmentId={rescheduleId}
        open={!!rescheduleId}
        onClose={() => setRescheduleId(null)}
      />
      <CancelDialog
        appointmentId={cancelId}
        open={!!cancelId}
        onClose={() => setCancelId(null)}
      />
    </div>
  );
}
