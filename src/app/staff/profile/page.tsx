"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useCurrentEmployee } from "@/lib/use-current-employee";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/misc";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";

export default function StaffProfilePage() {
  const { db, saveEmployee, saveCustomer } = useStore();
  const { user } = useAuth();
  const employee = useCurrentEmployee();
  const toast = useToast();

  const [form, setForm] = useState({
    jobTitle: "",
    bio: "",
    profileImage: "",
    phone: "",
  });

  useEffect(() => {
    if (employee && user) {
      setForm({
        jobTitle: employee.jobTitle,
        bio: employee.bio,
        profileImage: employee.profileImage,
        phone: user.phone,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee?.id, user?.id]);

  if (!employee || !user)
    return <EmptyState title="No specialist profile linked." />;

  const services = db.services.filter((s) => employee.serviceIds.includes(s.id));

  function save(e: React.FormEvent) {
    e.preventDefault();
    saveEmployee({
      ...employee!,
      jobTitle: form.jobTitle.trim(),
      bio: form.bio.trim(),
      profileImage: form.profileImage.trim(),
    });
    saveCustomer({ ...user!, phone: form.phone.trim() });
    toast.success("Profile updated", "Your public profile is now live.");
  }

  return (
    <div className="space-y-8">
      <PageHeading
        title="My profile"
        description="This is what customers see when they browse specialists."
      />

      <Card>
        <CardBody>
          <div className="flex items-center gap-4">
            <Avatar src={form.profileImage} name={`${user.firstName} ${user.lastName}`} size="xl" />
            <div>
              <p className="font-serif text-xl text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-accent">{form.jobTitle}</p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
          </div>

          <form onSubmit={save} className="mt-6 grid gap-4">
            <Field label="Job title" required>
              <Input
                value={form.jobTitle}
                onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              />
            </Field>
            <Field label="Photo URL" hint="Paste an image link">
              <Input
                value={form.profileImage}
                onChange={(e) =>
                  setForm({ ...form, profileImage: e.target.value })
                }
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Bio" required>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="min-h-[120px]"
              />
            </Field>
            <div className="flex justify-end">
              <Button type="submit">Save profile</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="text-sm font-medium text-foreground">
            Treatments you offer
          </h3>
          <p className="mt-1 text-xs text-muted">
            Managed by the salon admin. Ask them to add or remove a service.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {services.map((s) => (
              <span
                key={s.id}
                className="rounded-full bg-surface-sunken px-3 py-1.5 text-xs font-medium text-muted-strong"
              >
                {s.name}
              </span>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
