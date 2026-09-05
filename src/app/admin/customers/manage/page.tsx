"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarPlus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  customerStats,
  pastAppointments,
  upcomingAppointments,
  viewAppointment,
} from "@/lib/selectors";
import { formatPrice, fullName } from "@/lib/utils";
import { fmt } from "@/lib/time";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Stat, EmptyState, Switch } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { AppointmentEditorDialog } from "@/components/appointments/appointment-editor-dialog";
import { RescheduleDialog } from "@/components/appointments/reschedule-dialog";
import { CancelDialog } from "@/components/appointments/cancel-dialog";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

function CustomerDetail() {
  const id = useSearchParams().get("id") ?? "";
  const { db, saveCustomer, deleteCustomer } = useStore();
  const router = useRouter();
  const toast = useToast();

  const customer = db.users.find((u) => u.id === id && u.role === "CUSTOMER");
  const [form, setForm] = useState({
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    dateOfBirth: customer?.dateOfBirth ?? "",
    blocked: customer?.blocked ?? false,
    blockedReason: customer?.blockedReason ?? "",
  });
  const [booking, setBooking] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!customer) {
    return (
      <EmptyState
        title="Customer not found"
        action={
          <Link href="/admin/customers" className="text-primary">
            Back to customers
          </Link>
        }
      />
    );
  }

  const stats = customerStats(db, customer.id);
  const upcoming = upcomingAppointments(db, { customerId: customer.id });
  const past = pastAppointments(db, { customerId: customer.id });

  return (
    <div>
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={15} /> Customers
      </Link>

      <PageHeading
        title={
          <>
            {fullName(customer)}
            {customer.blocked ? (
              <Badge tone="danger" className="ml-2 align-middle">
                Blocked
              </Badge>
            ) : null}
          </>
        }
        description={`Customer since ${fmt.mediumDate(customer.createdAt)}`}
        action={
          <>
            <Button size="sm" onClick={() => setBooking(true)}>
              <CalendarPlus size={15} /> Book for customer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={14} />
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <Stat label="Completed visits" value={stats.completed} />
        <Stat label="Upcoming" value={stats.upcoming} tone="info" />
        <Stat
          label="Lifetime spend"
          value={formatPrice(stats.spend, db.settings.currency)}
          tone="accent"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardBody>
            <h2 className="text-lg font-medium text-foreground">Details</h2>
            <form
              className="mt-4 grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                saveCustomer({
                  ...customer,
                  firstName: form.firstName.trim(),
                  lastName: form.lastName.trim(),
                  email: form.email.trim(),
                  phone: form.phone.trim(),
                  dateOfBirth: form.dateOfBirth || undefined,
                  blocked: form.blocked,
                  blockedReason: form.blocked
                    ? form.blockedReason.trim() || undefined
                    : undefined,
                });
                toast.success("Customer updated");
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name">
                  <Input
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                  />
                </Field>
                <Field label="Last name">
                  <Input
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
              <Field label="Date of birth">
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    setForm({ ...form, dateOfBirth: e.target.value })
                  }
                />
              </Field>

              <div className="rounded-xl border border-border bg-surface-muted p-3">
                <Switch
                  checked={form.blocked}
                  onChange={(v) => setForm({ ...form, blocked: v })}
                  label="Blacklist this customer"
                  description="Blocked customers can't self-book online; you can still book for them manually."
                />
                {form.blocked ? (
                  <Input
                    className="mt-3"
                    placeholder="Reason (optional, staff-only)"
                    value={form.blockedReason}
                    onChange={(e) =>
                      setForm({ ...form, blockedReason: e.target.value })
                    }
                  />
                ) : null}
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="sm">
                  Save
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <div>
          <h2 className="mb-3 text-lg font-medium text-foreground">
            Appointment history
          </h2>
          <div className="space-y-3">
            {upcoming.length === 0 && past.length === 0 ? (
              <EmptyState title="No appointments yet" />
            ) : (
              [...upcoming, ...past].map((a) => (
                <AppointmentCard
                  key={a.id}
                  view={viewAppointment(db, a)}
                  perspective="admin"
                  currency={db.settings.currency}
                  actions={
                    a.status === "CONFIRMED" || a.status === "PENDING" ? (
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
                    ) : null
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>

      <AppointmentEditorDialog
        open={booking}
        onClose={() => setBooking(false)}
        presets={{ customerId: customer.id }}
      />
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
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this customer?"
        description="Their profile and appointment history are permanently removed."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteCustomer(customer.id);
                toast.info("Customer deleted");
                router.push("/admin/customers");
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">{fullName(customer)}</p>
      </Dialog>
    </div>
  );
}

export default function AdminCustomerPage() {
  return (
    <Suspense fallback={null}>
      <CustomerDetail />
    </Suspense>
  );
}
