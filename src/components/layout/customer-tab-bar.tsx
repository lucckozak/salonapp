"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CalendarHeart, Home, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/book", label: "Book", icon: CalendarDays },
  { href: "/account/appointments", label: "Bookings", icon: CalendarHeart },
  { href: "/account", label: "Profile", icon: UserRound },
];

export function CustomerTabBar() {
  const pathname = usePathname();
  const { role } = useAuth();
  if (role !== "CUSTOMER") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1.5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted",
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
