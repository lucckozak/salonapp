"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  RotateCcw,
  Sparkles,
  Store,
  UserRound,
  X,
} from "lucide-react";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { SALON_PRESETS } from "@/lib/data/presets";

const ROLE_HOME: Record<Role, string> = {
  CUSTOMER: "/account",
  EMPLOYEE: "/staff",
  ADMIN: "/admin",
};

const ROLE_LABEL: Record<Role, string> = {
  CUSTOMER: "Customer",
  EMPLOYEE: "Specialist",
  ADMIN: "Admin",
};

function appRoot() {
  if (typeof window === "undefined") return "";
  const known = new Set([
    "admin",
    "staff",
    "account",
    "book",
    "services",
    "employees",
    "login",
    "register",
  ]);
  const seg = window.location.pathname.split("/").filter(Boolean)[0];
  return seg && !known.has(seg)
    ? `${window.location.origin}/${seg}/`
    : `${window.location.origin}/`;
}

export function DemoPanel() {
  const { db, hydrated, applyPreset, resetAll } = useStore();
  const { role, viewAs } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const off =
        params.get("demo") === "off" ||
        sessionStorage.getItem("demo:hidden") === "1";
      if (params.get("demo") === "off")
        sessionStorage.setItem("demo:hidden", "1");
      setHidden(off);
    } catch {
      setHidden(false);
    }
  }, []);

  const current = useMemo(
    () =>
      SALON_PRESETS.find((p) => p.id === db.settings.presetId) ??
      SALON_PRESETS[0],
    [db.settings.presetId],
  );

  if (!hydrated || hidden) return null;

  function pickRole(r: Role) {
    if (viewAs(r)) {
      router.push(ROLE_HOME[r]);
      toast.success(`Viewing as ${ROLE_LABEL[r]}`);
      setOpen(false);
    }
  }

  function pickPreset(id: string) {
    if (id === db.settings.presetId) {
      setOpen(false);
      return;
    }
    const keepRole = role;
    applyPreset(id);
    if (keepRole) {
      // ids for staff change between presets — re-attach the session
      setTimeout(() => {
        viewAs(keepRole);
        router.push(ROLE_HOME[keepRole]);
      }, 0);
    } else {
      router.push("/");
    }
    const label = SALON_PRESETS.find((p) => p.id === id)?.label ?? "salon";
    toast.success(`Now showing ${label}`, "Fresh sample data loaded.");
    setOpen(false);
  }

  async function copyShareLink() {
    const url = `${appRoot()}?salon=${db.settings.presetId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied", url);
    } catch {
      toast.info("Share link", url);
    }
  }

  return (
    <div className="fixed bottom-[4.75rem] left-4 z-[70] md:bottom-4">
      {open ? (
        <div className="animate-fade-in mb-2 w-[19rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-pop)]">
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Demo controls
              </p>
              <p className="text-xs text-muted">
                Sample data — resets anytime.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="-mr-1 rounded-lg p-1 text-muted hover:bg-surface-sunken hover:text-foreground"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-4 py-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <UserRound size={12} /> View the site as
            </p>
            <div className="flex gap-1.5">
              {(["CUSTOMER", "EMPLOYEE", "ADMIN"] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => pickRole(r)}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                    role === r
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-foreground hover:border-primary/50",
                  )}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>

            <p className="mb-1.5 mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <Store size={12} /> Salon
            </p>
            <div className="space-y-1.5">
              {SALON_PRESETS.map((p) => {
                const active = p.id === db.settings.presetId;
                return (
                  <button
                    key={p.id}
                    onClick={() => pickPreset(p.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors",
                      active
                        ? "border-primary bg-primary-soft/50"
                        : "border-border bg-surface hover:border-primary/40",
                    )}
                  >
                    <span
                      className="mt-0.5 h-3 w-3 shrink-0 rounded-full ring-2 ring-white"
                      style={{ background: p.theme.primary }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {p.label}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {p.blurb}
                      </span>
                    </span>
                    {active ? (
                      <Check size={15} className="shrink-0 text-primary" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
              <button
                onClick={copyShareLink}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-foreground hover:border-primary/50"
              >
                <Copy size={13} /> Copy share link
              </button>
              <button
                onClick={() => {
                  resetAll();
                  toast.success("Sample data reset");
                  setOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-danger hover:border-danger/50"
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-medium text-foreground shadow-[var(--shadow-pop)] transition-colors hover:border-primary/50",
          open && "border-primary/50",
        )}
      >
        <Sparkles size={14} className="text-primary" />
        Demo
        <span className="hidden text-muted sm:inline">· {current.label}</span>
      </button>
    </div>
  );
}
