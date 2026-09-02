"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useCurrentEmployee } from "@/lib/use-current-employee";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import {
  WorkingHoursEditor,
  hoursFromRows,
  type HoursMap,
} from "@/components/schedule/working-hours-editor";
import { TimeBlockManager } from "@/components/schedule/time-block-manager";
import { useToast } from "@/components/ui/toast";

export default function StaffHoursPage() {
  const { db, setWorkingHours } = useStore();
  const employee = useCurrentEmployee();
  const toast = useToast();
  const [hours, setHours] = useState<HoursMap | null>(null);

  useEffect(() => {
    if (employee) {
      setHours(
        hoursFromRows(
          db.workingHours.filter((w) => w.employeeId === employee.id),
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee?.id]);

  if (!employee) return <EmptyState title="No specialist profile linked." />;
  if (!hours) return null;

  return (
    <div className="space-y-8">
      <PageHeading
        title="Working hours"
        description="Set your weekly availability. Bookings can only land inside these hours."
      />

      <Card>
        <CardBody className="space-y-4">
          <WorkingHoursEditor value={hours} onChange={setHours} />
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setWorkingHours(employee.id, hours);
                toast.success("Working hours saved");
              }}
            >
              Save working hours
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <TimeBlockManager employeeId={employee.id} />
        </CardBody>
      </Card>
    </div>
  );
}
