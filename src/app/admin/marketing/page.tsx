"use client";

import { useState } from "react";
import { Gift, Plus, Tag, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Coupon, GiftCard } from "@/lib/types";
import { formatPrice, uid } from "@/lib/utils";
import { fmt } from "@/lib/time";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, Segmented, Switch } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";

type Tab = "coupons" | "giftcards";

export default function AdminMarketingPage() {
  const { db } = useStore();
  const [tab, setTab] = useState<Tab>("coupons");

  return (
    <div>
      <PageHeading
        title="Marketing"
        description="Coupons and gift cards customers can redeem at checkout."
        action={
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "coupons", label: "Coupons" },
              { value: "giftcards", label: "Gift cards" },
            ]}
          />
        }
      />

      {tab === "coupons" ? (
        <CouponsPanel currency={db.settings.currency} />
      ) : (
        <GiftCardsPanel currency={db.settings.currency} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CouponsPanel({ currency }: { currency: string }) {
  const { db, saveCoupon, deleteCoupon } = useStore();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    type: "PERCENT" as Coupon["type"],
    value: 10,
    expiresAt: "",
    maxRedemptions: "",
  });

  function create() {
    const code = form.code.trim().toUpperCase();
    if (!code) return;
    saveCoupon({
      id: uid("cpn"),
      code,
      type: form.type,
      value: form.value,
      active: true,
      expiresAt: form.expiresAt || undefined,
      maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : undefined,
      redemptions: 0,
      createdAt: new Date().toISOString(),
    });
    toast.success("Coupon created");
    setForm({ code: "", type: "PERCENT", value: 10, expiresAt: "", maxRedemptions: "" });
    setCreating(false);
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus size={15} /> New coupon
        </Button>
      </div>

      {db.coupons.length === 0 ? (
        <EmptyState
          icon={<Tag size={20} />}
          title="No coupons yet"
          description="Create a discount code customers can enter at checkout."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {db.coupons.map((c) => {
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
            const exhausted =
              c.maxRedemptions != null && c.redemptions >= c.maxRedemptions;
            return (
              <Card key={c.id}>
                <CardBody className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-base font-semibold tracking-wide text-foreground">
                      {c.code}
                    </p>
                    <button
                      onClick={() => setDeleteId(c.id)}
                      className="rounded-lg p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-lg font-medium text-primary">
                    {c.type === "PERCENT" ? `${c.value}% off` : formatPrice(c.value, currency) + " off"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {!c.active ? (
                      <Badge tone="neutral">Disabled</Badge>
                    ) : expired ? (
                      <Badge tone="warning">Expired</Badge>
                    ) : exhausted ? (
                      <Badge tone="warning">Fully redeemed</Badge>
                    ) : (
                      <Badge tone="success">Active</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    {c.redemptions} redemption{c.redemptions === 1 ? "" : "s"}
                    {c.maxRedemptions ? ` of ${c.maxRedemptions}` : ""}
                    {c.expiresAt ? ` · expires ${fmt.mediumDate(c.expiresAt)}` : ""}
                  </p>
                  <Switch
                    checked={c.active}
                    onChange={(v) => saveCoupon({ ...c, active: v })}
                    label="Active"
                  />
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        title="New coupon"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={!form.code.trim()}>
              Create coupon
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Code" required className="sm:col-span-2">
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="WELCOME10"
              className="uppercase"
            />
          </Field>
          <Field label="Type">
            <Select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Coupon["type"] })}
            >
              <option value="PERCENT">Percentage</option>
              <option value="FIXED">Fixed amount</option>
            </Select>
          </Field>
          <Field label={form.type === "PERCENT" ? "Percent off" : `Amount off (${currency})`}>
            <Input
              type="number"
              min={0}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
            />
          </Field>
          <Field label="Expires" hint="Optional">
            <Input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </Field>
          <Field label="Max redemptions" hint="Optional">
            <Input
              type="number"
              min={0}
              value={form.maxRedemptions}
              onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
            />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete this coupon?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Keep
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteId) deleteCoupon(deleteId);
                toast.info("Coupon deleted");
                setDeleteId(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">This can't be undone.</p>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function GiftCardsPanel({ currency }: { currency: string }) {
  const { db, saveGiftCard, deleteGiftCard } = useStore();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    initialValue: 100,
    purchaserName: "",
    recipientEmail: "",
  });

  function create() {
    const code = form.code.trim().toUpperCase();
    if (!code) return;
    const card: GiftCard = {
      id: uid("gc"),
      code,
      initialValue: form.initialValue,
      balance: form.initialValue,
      active: true,
      purchaserName: form.purchaserName.trim() || undefined,
      recipientEmail: form.recipientEmail.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    saveGiftCard(card);
    toast.success("Gift card issued", `${code} — ${formatPrice(form.initialValue, currency)}`);
    setForm({ code: "", initialValue: 100, purchaserName: "", recipientEmail: "" });
    setCreating(false);
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus size={15} /> Issue gift card
        </Button>
      </div>

      {db.giftCards.length === 0 ? (
        <EmptyState
          icon={<Gift size={20} />}
          title="No gift cards yet"
          description="Issue a gift card manually (e.g. for a phone/in-person sale)."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {db.giftCards.map((g) => {
            const pct = g.initialValue > 0 ? (g.balance / g.initialValue) * 100 : 0;
            return (
              <Card key={g.id}>
                <CardBody className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-base font-semibold tracking-wide text-foreground">
                      {g.code}
                    </p>
                    <button
                      onClick={() => setDeleteId(g.id)}
                      className="rounded-lg p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-lg font-medium text-primary">
                    {formatPrice(g.balance, currency)}
                    <span className="ml-1.5 text-xs font-normal text-muted">
                      of {formatPrice(g.initialValue, currency)}
                    </span>
                  </p>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-sunken">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(pct, g.balance > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted">
                    {g.purchaserName ? `Purchased by ${g.purchaserName} · ` : ""}
                    Issued {fmt.mediumDate(g.createdAt)}
                  </p>
                  <Switch
                    checked={g.active}
                    onChange={(v) => saveGiftCard({ ...g, active: v })}
                    label="Active"
                  />
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        title="Issue a gift card"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={!form.code.trim() || form.initialValue <= 0}>
              Issue card
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Code" required className="sm:col-span-2">
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="GLOW-200"
              className="uppercase"
            />
          </Field>
          <Field label={`Value (${currency})`} required>
            <Input
              type="number"
              min={1}
              value={form.initialValue}
              onChange={(e) => setForm({ ...form, initialValue: Number(e.target.value) })}
            />
          </Field>
          <Field label="Purchaser name" hint="Optional">
            <Input
              value={form.purchaserName}
              onChange={(e) => setForm({ ...form, purchaserName: e.target.value })}
            />
          </Field>
          <Field label="Recipient email" hint="Optional" className="sm:col-span-2">
            <Input
              type="email"
              value={form.recipientEmail}
              onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
            />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete this gift card?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Keep
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteId) deleteGiftCard(deleteId);
                toast.info("Gift card deleted");
                setDeleteId(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">This can't be undone.</p>
      </Dialog>
    </div>
  );
}
