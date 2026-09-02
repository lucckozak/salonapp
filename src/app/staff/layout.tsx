"use client";

import {
  CalendarRange,
  Clock,
  LayoutDashboard,
  ListChecks,
  UserRound,
} from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import { HydrationGate } from "@/components/hydration-gate";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";

const NAV: NavItem[] = [
  { href: "/staff", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/staff/calendar", label: "My calendar", icon: CalendarRange },
  { href: "/staff/appointments", label: "Appointments", icon: ListChecks },
  { href: "/staff/hours", label: "Working hours", icon: Clock },
  { href: "/staff/profile", label: "My profile", icon: UserRound },
];

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HydrationGate fallback={null}>
      <RequireRole roles={["EMPLOYEE"]}>
        <DashboardShell nav={NAV} area="Specialist">
          {children}
        </DashboardShell>
      </RequireRole>
    </HydrationGate>
  );
}
