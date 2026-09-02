"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import type { DayOfWeek, SalonSettings } from "@/lib/types";
import { DAY_LABELS } from "@/lib/types";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Switch } from "@/components/ui/misc";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

const ORDER: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

export default function AdminSettingsPage() {
  const { db, updateSettings, resetAll } = useStore();
  const toast = useToast();
  const [s, setS] = useState<SalonSettings>(structuredClone(db.settings));
  const [confirmReset, setConfirmReset] = useState(false);

  function set<K extends keyof SalonSettings>(k: K, v: SalonSettings[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

  function setOpening(day: DayOfWeek, patch: Partial<{ open: string | null; close: string | null }>) {
    setS((prev) => ({
      ...prev,
      openingHours: prev.openingHours.map((o) =>
        o.dayOfWeek === day ? { ...o, ...patch } : o,
      ),
    }));
  }

  function save() {
    updateSettings(s);
    toast.success("Settings saved");
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Salon settings"
        description="Configure the whole salon from here."
        action={<Button onClick={save}>Save all settings</Button>}
      />

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Salon name">
            <Input value={s.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Tagline">
            <Input
              value={s.tagline}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Input
              value={s.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={s.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <Input
              value={s.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Currency">
            <Input
              value={s.currency}
              onChange={(e) => set("currency", e.target.value)}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Opening hours
          </h2>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {ORDER.map((day) => {
              const o = s.openingHours.find((x) => x.dayOfWeek === day)!;
              const closed = !o.open || !o.close;
              return (
                <div
                  key={day}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <span className="w-24 text-sm font-medium text-foreground">
                    {DAY_LABELS[day]}
                  </span>
                  <Switch
                    checked={!closed}
                    onChange={(on) =>
                      setOpening(day, on ? { open: "09:00", close: "18:00" } : { open: null, close: null })
                    }
                  />
                  {!closed ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={o.open ?? ""}
                        onChange={(e) => setOpening(day, { open: e.target.value })}
                        className="h-9 rounded-lg border border-border-strong bg-surface px-2 text-sm"
                      />
                      <span className="text-muted">–</span>
                      <input
                        type="time"
                        value={o.close ?? ""}
                        onChange={(e) =>
                          setOpening(day, { close: e.target.value })
                        }
                        className="h-9 rounded-lg border border-border-strong bg-surface px-2 text-sm"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted sm:col-span-2">
            Booking rules
          </h2>
          <Field label="Buffer between appointments (min)">
            <Input
              type="number"
              min={0}
              step={5}
              value={s.bufferMinutes}
              onChange={(e) => set("bufferMinutes", Number(e.target.value))}
            />
          </Field>
          <Field label="Slot interval (min)">
            <Select
              value={String(s.slotIntervalMinutes)}
              onChange={(e) =>
                set("slotIntervalMinutes", Number(e.target.value))
              }
            >
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes</option>
              <option value="60">Every hour</option>
            </Select>
          </Field>
          <Field label="Cancellation window (hours)">
            <Input
              type="number"
              min={0}
              value={s.cancellationWindowHours}
              onChange={(e) =>
                set("cancellationWindowHours", Number(e.target.value))
              }
            />
          </Field>
          <Field label="Minimum lead time (hours)">
            <Input
              type="number"
              min={0}
              value={s.minLeadTimeHours}
              onChange={(e) => set("minLeadTimeHours", Number(e.target.value))}
            />
          </Field>
          <Field label="Booking window (days ahead)">
            <Input
              type="number"
              min={1}
              value={s.maxAdvanceDays}
              onChange={(e) => set("maxAdvanceDays", Number(e.target.value))}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Notifications (email)
          </h2>
          <Switch
            checked={s.notifications.customerConfirmation}
            onChange={(v) =>
              set("notifications", {
                ...s.notifications,
                customerConfirmation: v,
              })
            }
            label="Customer booking confirmation"
          />
          <Switch
            checked={s.notifications.customerReminder}
            onChange={(v) =>
              set("notifications", { ...s.notifications, customerReminder: v })
            }
            label="Customer appointment reminder"
          />
          <Switch
            checked={s.notifications.employeeNewBooking}
            onChange={(v) =>
              set("notifications", {
                ...s.notifications,
                employeeNewBooking: v,
              })
            }
            label="Notify specialist of schedule changes"
          />
          <Switch
            checked={s.notifications.adminNewBooking}
            onChange={(v) =>
              set("notifications", { ...s.notifications, adminNewBooking: v })
            }
            label="Notify admin of every booking"
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Reset demo data
            </p>
            <p className="text-sm text-muted">
              Wipes local changes and regenerates the seeded salon.
            </p>
          </div>
          <Button variant="outline" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={15} /> Reset
          </Button>
        </CardBody>
      </Card>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all demo data?"
        description="Every booking, employee edit and setting change made in this browser will be discarded."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetAll();
                setConfirmReset(false);
                toast.success("Demo data reset");
              }}
            >
              Reset everything
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">This cannot be undone.</p>
      </Dialog>
    </div>
  );
}
