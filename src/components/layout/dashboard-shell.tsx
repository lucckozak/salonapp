"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, LogOut, Menu, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn, fullName } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export function DashboardShell({
  nav,
  area,
  children,
}: {
  nav: NavItem[];
  area: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { db } = useStore();
  const [open, setOpen] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const navLinks = (
    <nav className="space-y-1">
      {nav.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                : "text-muted-strong hover:bg-surface-sunken hover:text-foreground",
            )}
          >
            <item.icon size={17} strokeWidth={active ? 2.3 : 1.9} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="px-3 py-5">
        <Link href="/" className="font-serif text-lg font-semibold text-foreground">
          {db.settings.name || "Maison Lumière"}
        </Link>
        <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.18em] text-accent">
          {area}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-3">{navLinks}</div>
      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-strong hover:bg-surface-sunken hover:text-foreground"
        >
          <ArrowUpRight size={17} /> Back to site
        </Link>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-strong hover:bg-surface-sunken hover:text-foreground"
        >
          <LogOut size={17} /> Sign out
        </button>
        {user ? (
          <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-surface-sunken px-3 py-2.5">
            <Avatar name={fullName(user)} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {fullName(user)}
              </p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
        <div className="sticky top-0 h-screen">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 border-r border-border bg-surface">
            {sidebarContent}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-1.5 text-foreground"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-serif text-base font-semibold text-foreground">
            {db.settings.name || "Maison Lumière"}
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-accent">
            {area}
          </span>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeading({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="font-serif text-xl font-medium text-foreground sm:text-2xl lg:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-[13px] text-muted sm:text-sm">{description}</p>
        ) : null}
      </div>
      {action ? (
        <div className="flex flex-wrap items-center gap-2">{action}</div>
      ) : null}
    </div>
  );
}
