"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import type { Service } from "@/lib/types";
import { uid } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";

const CATEGORIES = ["Facials", "Nails", "Brows & Lashes", "Body", "Other"];

export function ServiceEditorDialog({
  open,
  onClose,
  serviceId,
}: {
  open: boolean;
  onClose: () => void;
  serviceId?: string | null;
}) {
  const { db, saveService, saveEmployee } = useStore();
  const toast = useToast();
  const editing = !!serviceId;
  const existing = db.services.find((s) => s.id === serviceId);

  const [form, setForm] = useState<Service>(blank());
  const [providerIds, setProviderIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const base = existing ?? blank();
    setForm(base);
    setProviderIds(
      db.employees.filter((e) => e.serviceIds.includes(base.id)).map((e) => e.id),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, serviceId]);

  function toggleProvider(id: string) {
    setProviderIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  }

  function save() {
    const id = form.id || uid("svc");
    saveService({ ...form, id });
    // sync provider assignments
    for (const e of db.employees) {
      const should = providerIds.includes(e.id);
      const has = e.serviceIds.includes(id);
      if (should && !has) saveEmployee({ ...e, serviceIds: [...e.serviceIds, id] });
      if (!should && has)
        saveEmployee({
          ...e,
          serviceIds: e.serviceIds.filter((x) => x !== id),
        });
    }
    toast.success(editing ? "Service updated" : "Service created");
    onClose();
  }

  const valid = form.name.trim() && form.durationMinutes > 0 && form.price >= 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit service" : "New service"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!valid}>
            {editing ? "Save changes" : "Create service"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Name" required>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category">
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Duration (min)" required>
            <Input
              type="number"
              min={5}
              step={5}
              value={form.durationMinutes}
              onChange={(e) =>
                setForm({ ...form, durationMinutes: Number(e.target.value) })
              }
            />
          </Field>
          <Field label={`Price (${db.settings.currency})`} required>
            <Input
              type="number"
              min={0}
              step={10}
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
            />
          </Field>
        </div>
        <Field label="Image URL" hint="Paste an image link">
          <Input
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
          />
        </Field>

        <div className="flex flex-wrap gap-6">
          <Switch
            checked={form.active}
            onChange={(v) => setForm({ ...form, active: v })}
            label="Active"
            description="Bookable by customers"
          />
          <Switch
            checked={!!form.popular}
            onChange={(v) => setForm({ ...form, popular: v })}
            label="Featured"
            description="Show on the homepage"
          />
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-muted-strong">
            Specialists who can perform this
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {db.employees.map((e) => {
              const u = db.users.find((x) => x.id === e.userId)!;
              return (
                <label
                  key={e.id}
                  className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={providerIds.includes(e.id)}
                    onChange={() => toggleProvider(e.id)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <span className="text-foreground">
                    {u.firstName} {u.lastName}
                  </span>
                  <span className="ml-auto text-xs text-muted">{e.jobTitle}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function blank(): Service {
  return {
    id: "",
    name: "",
    description: "",
    category: "Facials",
    durationMinutes: 60,
    price: 200,
    image: "",
    active: true,
    popular: false,
  };
}
