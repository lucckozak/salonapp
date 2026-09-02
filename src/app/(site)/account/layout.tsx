"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { RequireRole } from "@/components/auth/require-role";
import { HydrationGate } from "@/components/hydration-gate";

const TABS = [
  { href: "/account", label: "Profile" },
  { href: "/account/appointments", label: "My appointments" },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <HydrationGate>
      <RequireRole roles={["CUSTOMER"]}>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <h1 className="font-serif text-3xl font-medium text-foreground">
            My account
          </h1>
          <div className="mt-5 flex gap-1 border-b border-border">
            {TABS.map((t) => {
              const active = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted hover:text-foreground",
                  )}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-8">{children}</div>
        </div>
      </RequireRole>
    </HydrationGate>
  );
}
