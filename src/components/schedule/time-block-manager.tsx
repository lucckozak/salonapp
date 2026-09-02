"use client";

import { useState } from "react";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { TimeBlockType } from "@/lib/types";
import { fmt, toDate } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";

const TYPE_LABEL: Record<TimeBlockType, string> = {
  BREAK: "Break",
  VACATION: "Vacation",
  BLOCKED: "Blocked",
};
const TYPE_TONE: Record<TimeBlockType, "warning" | "neutral" | "info"> = {
  BREAK: "warning",
  VACATION: "neutral",
  BLOCKED: "info",
};

export function TimeBlockManager({ employeeId }: { employeeId: string }) {
  const { db, addTimeBlock, deleteTimeBlock } = useStore();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<TimeBlockType>("VACATION");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");

  const blocks = db.timeBlocks
    .filter((b) => b.employeeId === employeeId && toDate(b.end) >= new Date())
    .sort((a, b) => +toDate(a.start) - +toDate(b.start));

  function submit() {
    if (!start || !end) return;
    if (new Date(end) <= new Date(start)) {
      toast.error("End must be after start");
      return;
    }
    addTimeBlock({
      employeeId,
      type,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      reason: reason.trim() || undefined,
    });
    toast.success("Time blocked", "This period is now unavailable for booking.");
    setAdding(false);
    setStart("");
    setEnd("");
    setReason("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Holidays, vacation &amp; one-off blocks
        </h3>
        {!adding ? (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add
          </Button>
        ) : null}
      </div>

      {adding ? (
        <div className="rounded-xl border border-border bg-surface-muted p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type">
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as TimeBlockType)}
              >
                <option value="VACATION">Vacation / holiday</option>
                <option value="BLOCKED">Blocked (personal)</option>
                <option value="BREAK">Break</option>
              </Select>
            </Field>
            <Field label="Reason" hint="Optional">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Annual leave"
                className="h-11 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-sm"
              />
            </Field>
            <Field label="From">
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="h-11 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-sm"
              />
            </Field>
            <Field label="Until">
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="h-11 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-sm"
              />
            </Field>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit}>
              Save block
            </Button>
          </div>
        </div>
      ) : null}

      {blocks.length === 0 ? (
        <EmptyState
          icon={<CalendarOff size={18} />}
          title="No upcoming blocks"
          description="Add vacation or personal time and it's removed from booking instantly."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {blocks.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge tone={TYPE_TONE[b.type]}>{TYPE_LABEL[b.type]}</Badge>
                  <span className="truncate text-sm font-medium text-foreground">
                    {b.reason ?? "Unavailable"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {fmt.mediumDate(b.start)} {fmt.time(b.start)} →{" "}
                  {fmt.mediumDate(b.end)} {fmt.time(b.end)}
                </p>
              </div>
              <button
                onClick={() => {
                  deleteTimeBlock(b.id);
                  toast.info("Block removed");
                }}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                aria-label="Delete"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
