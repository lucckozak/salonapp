"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { groupServicesByCategory } from "@/lib/selectors";
import { formatDuration, formatPrice, fullName } from "@/lib/utils";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";
import { ServiceEditorDialog } from "@/components/services/service-editor-dialog";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export default function AdminServicesPage() {
  const { db, deleteService } = useStore();
  const toast = useToast();
  const [editId, setEditId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const groups = groupServicesByCategory(db.services);

  return (
    <div>
      <PageHeading
        title="Services"
        description={`${db.services.length} services · ${
          db.services.filter((s) => s.active).length
        } active`}
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={15} /> Add service
          </Button>
        }
      />

      <div className="space-y-8">
        {groups.map(([category, services]) => (
          <section key={category}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              {category}
            </h2>
            <div className="grid gap-3">
              {services.map((s) => {
                const providers = db.employees.filter((e) =>
                  e.serviceIds.includes(s.id),
                );
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-card)]"
                  >
                    <SmartImage
                      src={s.image}
                      alt={s.name}
                      fallbackKey={s.id}
                      rounded="rounded-xl"
                      className="h-16 w-16 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{s.name}</p>
                        {!s.active ? (
                          <Badge tone="neutral">Inactive</Badge>
                        ) : null}
                        {s.popular ? <Badge tone="accent">Featured</Badge> : null}
                      </div>
                      <p className="mt-0.5 text-sm text-muted">
                        {formatDuration(s.durationMinutes)} ·{" "}
                        {formatPrice(s.price, db.settings.currency)}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted">
                        {providers.length
                          ? providers
                              .map((e) =>
                                fullName(
                                  db.users.find((u) => u.id === e.userId)!,
                                ),
                              )
                              .join(", ")
                          : "No specialists assigned"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditId(s.id)}
                        className="rounded-lg p-2 text-muted hover:bg-surface-sunken hover:text-foreground"
                        aria-label="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteId(s.id)}
                        className="rounded-lg p-2 text-muted hover:bg-danger-soft hover:text-danger"
                        aria-label="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <ServiceEditorDialog
        open={creating}
        onClose={() => setCreating(false)}
      />
      <ServiceEditorDialog
        open={!!editId}
        serviceId={editId}
        onClose={() => setEditId(null)}
      />

      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete this service?"
        description="It will be removed from the menu and unassigned from all specialists. Existing appointments keep their record."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteId) deleteService(deleteId);
                toast.info("Service deleted");
                setDeleteId(null);
              }}
            >
              Delete service
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          {db.services.find((s) => s.id === deleteId)?.name}
        </p>
      </Dialog>
    </div>
  );
}
