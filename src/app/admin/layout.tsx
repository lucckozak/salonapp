"use client";

import {
  BarChart3,
  CalendarRange,
  LayoutDashboard,
  ListChecks,
  Scissors,
  Settings,
  Tag,
  Users,
  UsersRound,
} from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import { HydrationGate } from "@/components/hydration-gate";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarRange },
  { href: "/admin/appointments", label: "Appointments", icon: ListChecks },
  { href: "/admin/revenue", label: "Revenue", icon: BarChart3 },
  { href: "/admin/employees", label: "Employees", icon: UsersRound },
  { href: "/admin/services", label: "Services", icon: Scissors },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/marketing", label: "Marketing", icon: Tag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HydrationGate fallback={null}>
      <RequireRole roles={["ADMIN"]}>
        <DashboardShell nav={NAV} area="Admin">
          {children}
        </DashboardShell>
      </RequireRole>
    </HydrationGate>
  );
}
