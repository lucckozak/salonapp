"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Menu, User as UserIcon, X } from "lucide-react";
import { cn, fullName } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { Button, LinkButton } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Treatments" },
  { href: "/employees", label: "Specialists" },
  { href: "/book", label: "Book" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, role, signOut, ready } = useAuth();
  const { db } = useStore();
  const [open, setOpen] = useState(false);

  const dashHref =
    role === "ADMIN" ? "/admin" : role === "EMPLOYEE" ? "/staff" : "/account";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
            {db.settings.name || "Maison Lumière"}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary-hover"
                    : "text-muted-strong hover:bg-surface-sunken hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {ready && user ? (
            <div className="flex items-center gap-3">
              <Link
                href={dashHref}
                className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-sunken"
              >
                <Avatar name={fullName(user)} size="sm" />
                <span className="max-w-[10ch] truncate">{user.firstName}</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">
                Sign in
              </LinkButton>
              <LinkButton href="/book" variant="primary" size="sm">
                Book appointment
              </LinkButton>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-surface md:hidden">
          <div className="space-y-1 px-4 py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-sunken"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              {user ? (
                <>
                  <LinkButton
                    href={dashHref}
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                  >
                    <UserIcon size={15} /> My area
                  </LinkButton>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      signOut();
                      setOpen(false);
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <LinkButton
                    href="/login"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                  >
                    Sign in
                  </LinkButton>
                  <LinkButton
                    href="/book"
                    variant="primary"
                    size="sm"
                    onClick={() => setOpen(false)}
                  >
                    <CalendarDays size={15} /> Book appointment
                  </LinkButton>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
