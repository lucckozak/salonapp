"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { customerStats } from "@/lib/selectors";
import { downloadCsv, formatPrice, fullName } from "@/lib/utils";
import { fmt } from "@/lib/time";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Dialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

export default function AdminCustomersPage() {
  const { db, createCustomer } = useStore();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const customers = useMemo(() => {
    const list = db.users.filter((u) => u.role === "CUSTOMER");
    const term = q.trim().toLowerCase();
    return list
      .filter((c) =>
        term
          ? `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`
              .toLowerCase()
              .includes(term)
          : true,
      )
      .sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [db.users, q]);

  function exportCsv() {
    downloadCsv(
      `customers-${fmt.isoDate(new Date())}.csv`,
      ["Name", "Email", "Phone", "Visits", "Spend", "Last visit", "Blocked"],
      customers.map((c) => {
        const s = customerStats(db, c.id);
        return [
          fullName(c),
          c.email,
          c.phone,
          s.completed,
          s.spend,
          s.lastVisit ? fmt.isoDate(s.lastVisit) : "",
          c.blocked ? "Yes" : "No",
        ];
      }),
    );
  }

  return (
    <div>
      <PageHeading
        title="Customers"
        description={`${
          db.users.filter((u) => u.role === "CUSTOMER").length
        } customers`}
        action={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download size={15} /> Export CSV
            </Button>
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus size={15} /> Add customer
            </Button>
          </>
        }
      />

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search name, email or phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Customer</th>
              <th className="hidden px-4 py-3 sm:table-cell">Contact</th>
              <th className="px-4 py-3">Visits</th>
              <th className="hidden px-4 py-3 md:table-cell">Spend</th>
              <th className="hidden px-4 py-3 md:table-cell">Last visit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((c) => {
              const s = customerStats(db, c.id);
              return (
                <tr
                  key={c.id}
                  className="transition-colors hover:bg-surface-muted"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/manage?id=${c.id}`}
                      className="flex items-center gap-2.5 font-medium text-foreground hover:text-primary"
                    >
                      <Avatar name={fullName(c)} size="sm" />
                      {fullName(c)}
                      {c.blocked ? <Badge tone="danger">Blocked</Badge> : null}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-strong sm:table-cell">
                    <div>{c.email}</div>
                    <div className="text-xs text-muted">{c.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-strong">
                    {s.completed}
                    {s.upcoming ? (
                      <span className="ml-1 text-xs text-primary">
                        +{s.upcoming} upcoming
                      </span>
                    ) : null}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-strong md:table-cell">
                    {formatPrice(s.spend, db.settings.currency)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-strong md:table-cell">
                    {s.lastVisit ? fmt.mediumDate(s.lastVisit) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog
        open={adding}
        onClose={() => setAdding(false)}
        title="Add customer"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                createCustomer({
                  firstName: form.firstName.trim(),
                  lastName: form.lastName.trim(),
                  email: form.email.trim(),
                  phone: form.phone.trim(),
                });
                toast.success("Customer added");
                setForm({ firstName: "", lastName: "", email: "", phone: "" });
                setAdding(false);
              }}
              disabled={
                !form.firstName.trim() || !/.+@.+\..+/.test(form.email)
              }
            >
              Add customer
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First name" required>
            <Input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </Field>
          <Field label="Last name">
            <Input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
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
        </div>
      </Dialog>
    </div>
  );
}
