"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function CancelDialog({
  appointmentId,
  open,
  onClose,
  requireReason,
}: {
  appointmentId: string | null;
  open: boolean;
  onClose: () => void;
  requireReason?: boolean;
}) {
  const { cancelAppointment } = useStore();
  const toast = useToast();
  const [reason, setReason] = useState("");

  function confirm() {
    if (!appointmentId) return;
    cancelAppointment(appointmentId, reason.trim() || undefined);
    toast.success("Appointment cancelled", "A cancellation email has been sent.");
    setReason("");
    onClose();
  }

  return (
    <Dialog
      open={open && !!appointmentId}
      onClose={onClose}
      title="Cancel this appointment?"
      description="This frees up the slot for someone else. This can't be undone."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Keep it
          </Button>
          <Button
            variant="danger"
            onClick={confirm}
            disabled={requireReason && !reason.trim()}
          >
            Cancel appointment
          </Button>
        </>
      }
    >
      <Field
        label={`Reason${requireReason ? "" : " (optional)"}`}
        hint="Shared with the salon only."
      >
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Change of plans, feeling unwell, …"
        />
      </Field>
    </Dialog>
  );
}
