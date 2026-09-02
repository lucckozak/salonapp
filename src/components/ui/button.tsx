"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-[0_1px_2px_rgba(46,42,38,0.12)] active:scale-[0.98]",
  secondary:
    "bg-surface-sunken text-foreground hover:bg-border-strong/70 active:scale-[0.98]",
  outline:
    "border border-border-strong bg-surface text-foreground hover:bg-surface-muted hover:border-primary/40 active:scale-[0.98]",
  ghost: "text-foreground hover:bg-surface-sunken active:scale-[0.98]",
  danger:
    "bg-danger text-white hover:bg-danger/90 active:scale-[0.98]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-7 text-[15px]",
  icon: "h-10 w-10",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
}

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
});

type LinkButtonProps = CommonProps &
  React.ComponentProps<typeof Link> & { external?: boolean };

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  children,
  external,
  ...props
}: LinkButtonProps) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (external) {
    return (
      <a
        href={props.href as string}
        className={cls}
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    );
  }
  return (
    <Link className={cls} {...props}>
      {children}
    </Link>
  );
}
