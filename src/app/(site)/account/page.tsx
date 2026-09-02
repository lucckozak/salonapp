"use client";

import { useState } from "react";
import { CalendarCheck, Clock3, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { customerStats } from "@/lib/selectors";
import { fmt } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card, CardBody } from "@/components/ui/card";
import { Stat } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";

export default function ProfilePage() {
  const { user, updateProfile, signOut } = useAuth();
  const { db } = useStore();
  const toast = useToast();

  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    dateOfBirth: user?.dateOfBirth ?? "",
  });

  if (!user) return null;
  const stats = customerStats(db, user.id);

  function save(e: React.FormEvent) {
    e.preventDefault();
    updateProfile({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      dateOfBirth: form.dateOfBirth || undefined,
    });
    toast.success("Profile updated");
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <Stat
          compact
          label="Visits"
          value={stats.completed}
          hint={`${stats.total} booked`}
          icon={<CalendarCheck size={15} />}
        />
        <Stat
          compact
          label="Upcoming"
          value={stats.upcoming}
          tone="info"
          icon={<Clock3 size={15} />}
          hint={
            stats.lastVisit
              ? `Last visit ${fmt.mediumDate(stats.lastVisit)}`
              : "None booked yet"
          }
        />
        <Stat
          compact
          label="Member since"
          value={fmt.monthYear(user.createdAt)}
          tone="accent"
          icon={<Sparkles size={15} />}
          hint={
            stats.favouriteService
              ? `Go-to: ${stats.favouriteService}`
              : "Welcome anytime"
          }
        />
      </div>

      <Card>
        <CardBody>
          <h2 className="text-lg font-medium text-foreground">
            Personal information
          </h2>
          <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="First name" required>
              <Input
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />
            </Field>
            <Field label="Last name" required>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </Field>
            <Field label="Email" hint="Contact us to change your email">
              <Input value={user.email} disabled />
            </Field>
            <Field label="Phone" required>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Date of birth" hint="Optional — for birthday treats">
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) =>
                  setForm({ ...form, dateOfBirth: e.target.value })
                }
              />
            </Field>
            <div className="flex items-end">
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Sign out</p>
            <p className="text-sm text-muted">
              You'll need to sign in again to manage appointments.
            </p>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
