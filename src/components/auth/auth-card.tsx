"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const DEMO = [
  { label: "Customer", email: "customer@salon.app" },
  { label: "Specialist", email: "sarah@salon.app" },
  { label: "Admin", email: "admin@salon.app" },
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  onDemo,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  onDemo?: (email: string) => void;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="mb-8 text-center font-serif text-2xl font-semibold text-foreground"
      >
        Maison Lumière
      </Link>
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
        <h1 className="font-serif text-2xl font-medium text-foreground">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>

      {onDemo ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border-strong bg-surface-muted p-4">
          <p className="text-xs font-medium text-muted-strong">
            Demo accounts — password is{" "}
            <code className="rounded bg-surface-sunken px-1.5 py-0.5">password</code>
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {DEMO.map((d) => (
              <button
                key={d.email}
                onClick={() => onDemo(d.email)}
                className={cn(
                  "rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary-soft/40",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-6 text-center text-sm text-muted">{footer}</p>
    </div>
  );
}
