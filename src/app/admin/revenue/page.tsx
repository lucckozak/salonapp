"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarClock,
  Percent,
  Receipt,
  TrendingUp,
  UserX,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  revenueReport,
  revenueTrend,
  startOfMonth,
  startOfWeek,
  weeklyRevenueTrend,
  type RevenueGroup,
} from "@/lib/selectors";
import { formatPrice } from "@/lib/utils";
import { fmt } from "@/lib/time";
import { PageHeading } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Stat, Segmented, EmptyState } from "@/components/ui/misc";

type Period = "week" | "month" | "lastMonth" | "year";

export default function AdminRevenuePage() {
  const { db } = useStore();
  const currency = db.settings.currency;
  const now = new Date();
  const [period, setPeriod] = useState<Period>("lastMonth");
  const [trendMode, setTrendMode] = useState<"weekly" | "monthly">("monthly");

  const { from, to, label } = useMemo(() => {
    if (period === "week") {
      const f = startOfWeek(now);
      const t = new Date(f);
      t.setDate(t.getDate() + 7);
      return { from: f, to: t, label: `Week of ${fmt.dayMonth(f)}` };
    }
    if (period === "month") {
      const f = startOfMonth(now);
      const t = new Date(f.getFullYear(), f.getMonth() + 1, 1);
      return { from: f, to: t, label: fmt.monthYear(f) };
    }
    if (period === "lastMonth") {
      const f = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const t = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: f, to: t, label: fmt.monthYear(f) };
    }
    const f = new Date(now.getFullYear(), 0, 1);
    const t = new Date(now.getFullYear() + 1, 0, 1);
    return { from: f, to: t, label: String(now.getFullYear()) };
  }, [period]);

  const report = useMemo(() => revenueReport(db, from, to), [db, from, to]);
  const trend = useMemo(
    () =>
      trendMode === "monthly"
        ? revenueTrend(db, 6, now)
        : weeklyRevenueTrend(db, 8, now),
    [db, trendMode],
  );

  const total = report.realised + report.booked;
  const totalCommission = report.byEmployee.reduce(
    (s, e) => s + (e.commission ?? 0),
    0,
  );

  return (
    <div>
      <PageHeading
        title="Revenue"
        description={`${label} · realised from completed appointments, booked from confirmed ones`}
        action={
          <Segmented
            value={period}
            onChange={setPeriod}
            options={[
              { value: "week", label: "This week" },
              { value: "month", label: "This month" },
              { value: "lastMonth", label: "Last month" },
              { value: "year", label: "This year" },
            ]}
          />
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-5">
        <Stat
          label="Realised"
          value={formatPrice(report.realised, currency)}
          hint={`${report.realisedCount} completed`}
          tone="success"
          icon={<BadgeCheck size={15} />}
        />
        <Stat
          label="Booked (to come)"
          value={formatPrice(report.booked, currency)}
          hint={`${report.bookedCount} confirmed`}
          tone="info"
          icon={<CalendarClock size={15} />}
        />
        <Stat
          label="Avg. ticket"
          value={formatPrice(report.avgTicket, currency)}
          hint={`${report.realisedCount + report.bookedCount} appointments`}
          tone="accent"
          icon={<Receipt size={15} />}
        />
        <Stat
          label="Lost to no-shows"
          value={formatPrice(report.noShowLost, currency)}
          hint="in this period"
          tone="warning"
          icon={<UserX size={15} />}
        />
        <Stat
          label="Staff commission"
          value={formatPrice(totalCommission, currency)}
          hint="owed this period"
          tone="primary"
          icon={<Percent size={15} />}
        />
      </div>

      {/* trend */}
      <Card className="mt-8">
        <CardBody>
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <h2 className="text-base font-medium text-foreground">
                {trendMode === "monthly" ? "Last 6 months" : "Last 8 weeks"}
              </h2>
            </div>
            <Segmented
              size="sm"
              value={trendMode}
              onChange={setTrendMode}
              options={[
                { value: "monthly", label: "Monthly" },
                { value: "weekly", label: "Weekly" },
              ]}
            />
          </div>
          <TrendChart data={trend} currency={currency} />
          <div className="mt-4 flex items-center gap-5 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Realised
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary/35" /> Booked
            </span>
          </div>
        </CardBody>
      </Card>

      {/* breakdowns */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <BreakdownTable
          title="By specialist"
          rows={report.byEmployee}
          total={total}
          currency={currency}
          showEmployeeMeta
        />
        <BreakdownTable
          title="By treatment"
          rows={report.byService}
          total={total}
          currency={currency}
        />
      </div>

      <p className="mt-6 text-xs text-muted">
        Figures are indicative — this prototype has no payments. Revenue counts one
        service price per appointment; cancelled appointments are excluded and
        no-shows are shown separately as lost revenue.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TrendChart({
  data,
  currency,
}: {
  data: { label: string; realised: number; booked: number }[];
  currency: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.realised + d.booked));

  return (
    <div>
      <div
        className="flex items-end gap-2 sm:gap-3"
        style={{ height: 180 }}
      >
        {data.map((d, i) => {
          const total = d.realised + d.booked;
          const barPct = (total / max) * 90; // leave headroom for the value label
          const realisedShare = total > 0 ? (d.realised / total) * 100 : 0;
          return (
            <div
              key={i}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              title={`${d.label}: ${formatPrice(total, currency)}`}
            >
              <span className="text-[10px] font-medium text-muted-strong">
                {total > 0 ? formatShort(total) : ""}
              </span>
              <div
                className="flex w-full max-w-[46px] flex-col justify-end overflow-hidden rounded-md bg-surface-sunken"
                style={{ height: `${Math.max(barPct, total > 0 ? 3 : 1)}%` }}
              >
                <div
                  className="w-full bg-primary/35"
                  style={{ height: `${100 - realisedShare}%` }}
                />
                <div
                  className="w-full bg-primary"
                  style={{ height: `${realisedShare}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[11px] text-muted"
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakdownTable({
  title,
  rows,
  total,
  currency,
  showEmployeeMeta,
}: {
  title: string;
  rows: RevenueGroup[];
  total: number;
  currency: string;
  showEmployeeMeta?: boolean;
}) {
  return (
    <Card>
      <CardBody>
        <h2 className="mb-4 text-base font-medium text-foreground">{title}</h2>
        {rows.length === 0 ? (
          <EmptyState title="No revenue in this period" />
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => {
              const pct = total > 0 ? (r.revenue / total) * 100 : 0;
              return (
                <li key={r.id}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-foreground">
                      {r.label}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-strong">
                      {formatPrice(r.revenue, currency)}
                      <span className="ml-2 text-xs text-muted">
                        {r.count} appt{r.count === 1 ? "" : "s"}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-sunken">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(pct, 1.5)}%` }}
                    />
                  </div>
                  {showEmployeeMeta ? (
                    <div className="mt-1.5 flex gap-4 text-xs text-muted">
                      {r.commission != null ? (
                        <span>
                          Commission:{" "}
                          <span className="font-medium text-muted-strong">
                            {formatPrice(r.commission, currency)}
                          </span>
                        </span>
                      ) : null}
                      {r.utilizationPercent != null ? (
                        <span>
                          Utilization:{" "}
                          <span className="font-medium text-muted-strong">
                            {r.utilizationPercent}%
                          </span>
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function formatShort(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(Math.round(n));
}
