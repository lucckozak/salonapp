"use client";

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface-muted px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          {icon}
        </div>
      ) : null}
      <p className="text-[15px] font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "no-scrollbar flex max-w-full gap-0.5 overflow-x-auto rounded-full border border-border bg-surface-sunken p-1",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full font-medium transition-colors",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-[13px] sm:text-sm",
            value === o.value
              ? "bg-surface text-foreground shadow-[var(--shadow-card)]"
              : "text-muted hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          checked ? "bg-primary" : "bg-border-strong",
        )}
      >
        <span
          className={cn(
            "h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200",
            checked ? "ml-5" : "ml-0",
          )}
        />
      </button>
      {(label || description) && (
        <span className="text-sm">
          {label ? <span className="font-medium text-foreground">{label}</span> : null}
          {description ? (
            <span className="block text-xs text-muted">{description}</span>
          ) : null}
        </span>
      )}
    </label>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = "primary",
  compact = false,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "primary" | "success" | "info" | "accent" | "warning";
  /** tighter, iconless on mobile — for dense 3-up rows */
  compact?: boolean;
}) {
  const toneClass = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    info: "bg-info-soft text-info",
    accent: "bg-accent-soft text-accent",
    warning: "bg-warning-soft text-warning",
  }[tone];

  const longText = typeof value === "string" && value.length > 4;

  return (
    <div className="rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex items-start justify-between gap-1.5">
        <p
          className={cn(
            "text-xs font-medium text-muted sm:text-[13px]",
            compact ? "leading-tight" : "truncate",
          )}
        >
          {label}
        </p>
        {icon ? (
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8",
              compact && "hidden sm:flex",
              toneClass,
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-1 font-serif font-medium text-foreground sm:mt-3",
          longText
            ? "text-base leading-tight sm:text-xl"
            : "text-xl sm:text-3xl",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p
          className={cn(
            "mt-0.5 text-[11px] text-muted sm:mt-1 sm:line-clamp-2 sm:text-xs",
            compact ? "line-clamp-2" : "line-clamp-1",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
