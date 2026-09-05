"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { useStore } from "@/lib/store";
import type { DayOfWeek } from "@/lib/types";
import { fullName } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/misc";
import { Avatar } from "@/components/ui/avatar";
import {
  WorkingHoursEditor,
  hoursFromRows,
  type HoursMap,
} from "@/components/schedule/working-hours-editor";
import { TimeBlockManager } from "@/components/schedule/time-block-manager";
import { useToast } from "@/components/ui/toast";

const DEFAULT_HOURS: HoursMap = {
  0: null,
  1: ["09:00", "18:00"],
  2: ["09:00", "18:00"],
  3: ["09:00", "18:00"],
  4: ["09:00", "18:00"],
  5: ["09:00", "17:00"],
  6: null,
};

export function EmployeeForm({ employeeId }: { employeeId: string | null }) {
  const {
    db,
    createEmployee,
    saveEmployee,
    saveCustomer,
    setWorkingHours,
    resetEmployeePassword,
  } = useStore();
  const router = useRouter();
  const toast = useToast();

  const existing = employeeId
    ? db.employees.find((e) => e.id === employeeId)
    : null;
  const existingUser = existing
    ? db.users.find((u) => u.id === existing.userId)
    : null;

  const [form, setForm] = useState({
    firstName: existingUser?.firstName ?? "",
    lastName: existingUser?.lastName ?? "",
    email: existingUser?.email ?? "",
    phone: existingUser?.phone ?? "",
    jobTitle: existing?.jobTitle ?? "",
    bio: existing?.bio ?? "",
    profileImage: existing?.profileImage ?? "",
    active: existing?.active ?? true,
    commissionPercent: existing?.commissionPercent ?? 40,
    password: "",
  });
  const [serviceIds, setServiceIds] = useState<string[]>(
    existing?.serviceIds ?? [],
  );
  const [hours, setHours] = useState<HoursMap>(
    existing
      ? hoursFromRows(db.workingHours.filter((w) => w.employeeId === existing.id))
      : DEFAULT_HOURS,
  );

  const isNew = !existing;

  const valid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    /.+@.+\..+/.test(form.email) &&
    form.jobTitle.trim() &&
    (!isNew || form.password.length >= 6);

  function toggleService(id: string) {
    setServiceIds((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  }

  function submit() {
    if (isNew) {
      const emp = createEmployee({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        jobTitle: form.jobTitle.trim(),
        bio: form.bio.trim(),
        profileImage: form.profileImage.trim(),
        serviceIds,
        active: form.active,
        workingHours: hours as Record<DayOfWeek, [string, string] | null>,
        commissionPercent: form.commissionPercent,
      });
      toast.success("Employee created", `${form.firstName} can now take bookings.`);
      router.push(`/admin/employees/manage?id=${emp.id}`);
    } else if (existing && existingUser) {
      saveEmployee({
        ...existing,
        jobTitle: form.jobTitle.trim(),
        bio: form.bio.trim(),
        profileImage: form.profileImage.trim(),
        active: form.active,
        serviceIds,
        commissionPercent: form.commissionPercent,
      });
      saveCustomer({
        ...existingUser,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setWorkingHours(existing.id, hours);
      toast.success("Employee updated");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={form.profileImage}
              name={`${form.firstName} ${form.lastName}` || "New"}
              size="xl"
            />
            <div className="flex-1">
              <Field label="Profile photo URL">
                <Input
                  value={form.profileImage}
                  onChange={(e) =>
                    setForm({ ...form, profileImage: e.target.value })
                  }
                  placeholder="https://…"
                />
              </Field>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
            <Field label="Job title" required>
              <Input
                value={form.jobTitle}
                onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                placeholder="Senior Beauty Therapist"
              />
            </Field>
            <Field label="Email" required>
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
            <Field
              label="Commission"
              hint="% of their completed + confirmed revenue"
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.commissionPercent}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      commissionPercent: Number(e.target.value),
                    })
                  }
                />
                <span className="text-sm text-muted">%</span>
              </div>
            </Field>
            {isNew ? (
              <Field
                label="Temporary password"
                required
                hint="At least 6 characters — share it with the employee"
              >
                <Input
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </Field>
            ) : null}
          </div>

          <Field label="Bio">
            <Textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="min-h-[100px]"
            />
          </Field>

          <Switch
            checked={form.active}
            onChange={(v) => setForm({ ...form, active: v })}
            label="Active"
            description="Inactive specialists are hidden and can't be booked."
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="mb-1 text-sm font-medium text-foreground">Services</h3>
          <p className="mb-3 text-xs text-muted">
            Only checked treatments will be offered with this specialist.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {db.services.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={serviceIds.includes(s.id)}
                  onChange={() => toggleService(s.id)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-foreground">{s.name}</span>
                <span className="ml-auto text-xs text-muted">
                  {s.category}
                </span>
              </label>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Working hours</h3>
          <WorkingHoursEditor value={hours} onChange={setHours} />
        </CardBody>
      </Card>

      {existing ? (
        <Card>
          <CardBody className="space-y-5">
            <TimeBlockManager employeeId={existing.id} />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Reset password
                </p>
                <p className="text-xs text-muted">
                  Generates a new temporary password for {form.firstName}.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const pw = resetEmployeePassword(existing.id);
                  toast.success("Password reset", `Temporary password: ${pw}`);
                }}
              >
                <KeyRound size={14} /> Reset
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-background/90 py-4 backdrop-blur">
        <Button variant="ghost" onClick={() => router.push("/admin/employees")}>
          Back
        </Button>
        <Button onClick={submit} disabled={!valid}>
          {isNew ? "Create employee" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
