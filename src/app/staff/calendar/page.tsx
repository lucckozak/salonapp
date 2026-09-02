"use client";

import { useCurrentEmployee } from "@/lib/use-current-employee";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/ui/misc";
import { EmployeeSchedule } from "@/components/calendar/employee-schedule";

export default function StaffCalendarPage() {
  const employee = useCurrentEmployee();

  if (!employee)
    return <EmptyState title="No specialist profile linked to this account." />;

  return (
    <div>
      <PageHeading
        title="My calendar"
        description="Only your own appointments — private to you."
      />
      <EmployeeSchedule
        employeeId={employee.id}
        defaultMode="day"
        dayOffLabel="You're not scheduled to work this day."
      />
    </div>
  );
}
