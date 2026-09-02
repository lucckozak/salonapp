"use client";

import { Suspense } from "react";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { HydrationGate } from "@/components/hydration-gate";
import { FullPageLoader } from "@/components/auth/require-role";

export default function BookPage() {
  return (
    <HydrationGate>
      <Suspense fallback={<FullPageLoader />}>
        <BookingWizard />
      </Suspense>
    </HydrationGate>
  );
}
