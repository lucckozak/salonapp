"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleCheck,
  Clock3,
  Pencil,
  Scissors,
  Sparkles,
  UserRound,
} from "lucide-react";
import { cn, formatDuration, formatPrice, fullName } from "@/lib/utils";
import { addDays, atTime, fmt, startOfDay, toDate } from "@/lib/time";
import {
  getAvailableDates,
  getDaySlots,
  pickEmployeeForSlot,
  salonWindow,
} from "@/lib/availability";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Dialog } from "@/components/ui/dialog";
import { SmartImage } from "@/components/ui/smart-image";
import { Avatar } from "@/components/ui/avatar";
import { MiniCalendar } from "./mini-calendar";

type Phase = "arrange" | "details" | "confirm";
const PHASES: { id: Phase; label: string }[] = [
  { id: "arrange", label: "Arrange" },
  { id: "details", label: "Details" },
  { id: "confirm", label: "Confirm" },
];

export function BookingWizard() {
  const { db, book, userById, createCustomer, checkPromoCode } = useStore();
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const topRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("arrange");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [employeeSel, setEmployeeSel] = useState<string | "any">("any");
  const [day, setDay] = useState<Date | null>(null);
  const [slotIso, setSlotIso] = useState<string | null>(null);
  const [assignedEmployee, setAssignedEmployee] = useState<string | null>(null);
  const [details, setDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [picker, setPicker] = useState<null | "service" | "specialist">(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promo, setPromo] = useState<
    | { kind: "coupon"; code: string; amount: number }
    | { kind: "giftcard"; code: string; amount: number }
    | null
  >(null);

  const service = serviceId ? db.services.find((s) => s.id === serviceId) : null;
  const activeServices = db.services.filter((s) => s.active);
  const ctx = useMemo(() => ({ db }), [db]);

  const eligibleEmployees = useMemo(
    () =>
      serviceId
        ? db.employees.filter(
            (e) => e.active && e.serviceIds.includes(serviceId),
          )
        : db.employees.filter((e) => e.active),
    [db.employees, serviceId],
  );

  /* ---------------- deep links (any combination) ---------------- */
  useEffect(() => {
    const s = params.get("service");
    const e = params.get("employee");
    const d = params.get("date");
    const t = params.get("time");
    if (s && db.services.some((x) => x.id === s && x.active)) setServiceId(s);
    if (e && db.employees.some((x) => x.id === e && x.active)) setEmployeeSel(e);
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const parsed = startOfDay(new Date(`${d}T00:00`));
      if (!Number.isNaN(+parsed) && parsed >= startOfDay(new Date())) {
        setDay(parsed);
        if (t && /^\d{2}:\d{2}$/.test(t)) {
          setSlotIso(atTime(parsed, t).toISOString());
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- prefill details when signed in ---------------- */
  useEffect(() => {
    if (user) {
      setDetails((prev) => ({
        ...prev,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      }));
    }
  }, [user]);

  /* ---------------- scroll to top on phase change ---------------- */
  useEffect(() => {
    const id = window.requestAnimationFrame(() =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );
    return () => window.cancelAnimationFrame(id);
  }, [phase, confirmed]);

  /* ---------------- available dates for the current selection ---------------- */
  const enabledDays = useMemo(() => {
    const from = startOfDay(new Date());
    const to = addDays(from, db.settings.maxAdvanceDays);
    if (serviceId) {
      return getAvailableDates(ctx, serviceId, employeeSel, from, to);
    }
    // no treatment chosen yet — allow any day the salon is open
    const set = new Set<string>();
    let cursor = from;
    while (cursor <= to) {
      if (salonWindow(ctx, cursor)) set.add(fmt.isoDate(cursor));
      cursor = addDays(cursor, 1);
    }
    return set;
  }, [ctx, serviceId, employeeSel, db.settings.maxAdvanceDays]);

  const daySlots = useMemo(() => {
    if (!serviceId || !day) return [];
    return getDaySlots(ctx, serviceId, employeeSel, day);
  }, [ctx, serviceId, employeeSel, day]);

  /* ---------------- keep the chosen time valid as other facets change ---------------- */
  useEffect(() => {
    if (!slotIso || !serviceId || !day) return;
    const ok = getDaySlots(ctx, serviceId, employeeSel, day).some(
      (s) => s.iso === slotIso,
    );
    if (!ok) setSlotIso(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, employeeSel, day]);

  /* ---------------- facet handlers (order-independent) ---------------- */
  function chooseService(id: string) {
    setServiceId(id);
    setPicker(null);
    if (employeeSel !== "any") {
      const emp = db.employees.find((e) => e.id === employeeSel);
      const svc = db.services.find((s) => s.id === id);
      if (emp && svc && !emp.serviceIds.includes(id)) {
        setEmployeeSel("any");
        const u = userById(emp.userId);
        toast.info(
          "Switched to any specialist",
          `${u?.firstName ?? "That specialist"} doesn’t offer ${svc.name}.`,
        );
      }
    }
  }

  function chooseEmployee(sel: string | "any") {
    setEmployeeSel(sel);
    setPicker(null);
  }

  function chooseDay(d: Date) {
    setDay(d);
    setSlotIso(null);
  }

  const finalEmployeeId =
    employeeSel === "any" ? assignedEmployee : (employeeSel as string);
  const canContinue = !!serviceId && !!day && !!slotIso;

  function goToDetails() {
    if (!canContinue) return;
    if (employeeSel === "any" && serviceId && slotIso) {
      setAssignedEmployee(
        pickEmployeeForSlot(
          ctx,
          serviceId,
          toDate(slotIso),
          eligibleEmployees.map((e) => e.id),
        ),
      );
    }
    setPhase("details");
  }

  const detailsValid =
    details.firstName.trim() &&
    details.lastName.trim() &&
    /.+@.+\..+/.test(details.email) &&
    details.phone.trim().length >= 6;

  const priceDue = Math.max(0, (service?.price ?? 0) - (promo?.amount ?? 0));

  function applyPromo() {
    if (!service) return;
    setPromoError(null);
    const result = checkPromoCode(promoInput, service.price);
    if (result.kind === "invalid") {
      setPromoError(result.reason);
      setPromo(null);
      return;
    }
    if (result.kind === "coupon") {
      setPromo({ kind: "coupon", code: result.coupon.code, amount: result.discount });
      toast.success(`Code applied — ${formatPrice(result.discount, db.settings.currency)} off`);
    } else {
      setPromo({ kind: "giftcard", code: result.giftCard.code, amount: result.amount });
      toast.success(`Gift card applied — ${formatPrice(result.amount, db.settings.currency)}`);
    }
  }

  function clearPromo() {
    setPromo(null);
    setPromoInput("");
    setPromoError(null);
  }

  function handleConfirm() {
    if (!serviceId || !slotIso || !finalEmployeeId) return;

    const existing = user
      ? user
      : db.users.find(
          (u) => u.email.toLowerCase() === details.email.trim().toLowerCase(),
        );
    if (existing?.blocked) {
      toast.error(
        "We can't complete this booking online",
        "Please contact the salon directly to arrange your appointment.",
      );
      return;
    }

    const customerId = existing
      ? existing.id
      : createCustomer({
          firstName: details.firstName.trim(),
          lastName: details.lastName.trim(),
          email: details.email.trim(),
          phone: details.phone.trim(),
        }).id;

    const appt = book({
      customerId,
      employeeId: finalEmployeeId,
      serviceId,
      start: slotIso,
      customerNotes: details.notes.trim() || undefined,
      source: "ONLINE",
      status: user ? "CONFIRMED" : "PENDING",
      couponCode: promo?.kind === "coupon" ? promo.code : undefined,
      discountAmount: promo?.kind === "coupon" ? promo.amount : undefined,
      giftCardCode: promo?.kind === "giftcard" ? promo.code : undefined,
      giftCardAmountUsed: promo?.kind === "giftcard" ? promo.amount : undefined,
    });
    setConfirmed(appt.id);
    toast.success("Appointment booked", "A confirmation email is on its way.");
  }

  /* =============================================================== *
   * Success
   * =============================================================== */
  if (confirmed) {
    const appt = db.appointments.find((a) => a.id === confirmed);
    const emp = finalEmployeeId && db.employees.find((e) => e.id === finalEmployeeId);
    const empUser = emp && userById(emp.userId);
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
          <CircleCheck size={30} />
        </div>
        <h1 className="mt-6 font-serif text-3xl font-medium text-foreground">
          You’re booked in
        </h1>
        <p className="mt-2 text-sm text-muted">
          We’ve emailed your confirmation to {details.email || user?.email}.
        </p>
        <div className="mt-8 rounded-2xl border border-border bg-surface p-6 text-left shadow-[var(--shadow-card)]">
          <Row label="Treatment" value={service?.name ?? ""} />
          <Row
            label="Specialist"
            value={empUser ? fullName(empUser) : "Assigned specialist"}
          />
          <Row label="When" value={appt ? fmt.fullDate(appt.start) : ""} />
          <Row
            label="Time"
            value={appt ? fmt.timeRange(appt.start, appt.end) : ""}
          />
          <Row
            label="Price"
            value={formatPrice(priceDue, db.settings.currency)}
            last
          />
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <Button onClick={() => router.push("/account/appointments")}>
              View my appointments
            </Button>
          ) : (
            <Button onClick={() => router.push("/login")}>
              Sign in to manage it
            </Button>
          )}
          <Button variant="outline" onClick={() => window.location.reload()}>
            Book another
          </Button>
        </div>
      </div>
    );
  }

  /* =============================================================== *
   * Flow
   * =============================================================== */
  const specialistLabel =
    employeeSel === "any"
      ? "Any available specialist"
      : (() => {
          const emp = db.employees.find((e) => e.id === employeeSel);
          const u = emp && userById(emp.userId);
          return u ? fullName(u) : "Any available specialist";
        })();

  const summaryBits = [
    service?.name,
    specialistLabel,
    day ? fmt.relativeDay(day) : null,
    slotIso ? fmt.time(slotIso) : null,
  ].filter(Boolean);

  return (
    <div ref={topRef} className="mx-auto max-w-5xl scroll-mt-20 px-4 py-10 sm:px-6">
      <PhaseNav
        phase={phase}
        onJump={(p) => {
          if (p === "arrange") setPhase("arrange");
          if (p === "details" && canContinue) goToDetails();
        }}
      />

      {/* ---------------- ARRANGE ---------------- */}
      {phase === "arrange" && (
        <div className="mt-8 animate-fade-in">
          <h1 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
            Build your appointment
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Choose a treatment, a specialist, a date and a time — in any order.
            Change anything without starting over.
          </p>

          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            {/* left: treatment + specialist */}
            <div className="space-y-4">
              <Facet
                icon={<Scissors size={18} />}
                label="Treatment"
                value={
                  service
                    ? `${service.name} · ${formatDuration(
                        service.durationMinutes,
                      )} · ${formatPrice(service.price, db.settings.currency)}`
                    : null
                }
                placeholder="Choose a treatment"
                done={!!service}
                onClick={() => setPicker("service")}
              />
              <Facet
                icon={<UserRound size={18} />}
                label="Specialist"
                value={service || employeeSel !== "any" ? specialistLabel : null}
                placeholder="Any available specialist"
                done={employeeSel !== "any"}
                onClick={() => setPicker("specialist")}
              />

              <div className="rounded-2xl border border-dashed border-border-strong bg-surface-muted p-4 text-xs leading-relaxed text-muted">
                <span className="font-medium text-muted-strong">Tip.</span> Start
                wherever suits you — pick a date first and we’ll show which
                treatments and specialists are free, or pick a specialist and see
                their next openings.
              </div>
            </div>

            {/* right: date + time */}
            <div className="space-y-4">
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
                  <CalendarDays size={13} /> Date
                </p>
                <MiniCalendar
                  value={day}
                  onSelect={chooseDay}
                  enabledDays={enabledDays}
                  minDate={startOfDay(new Date())}
                  maxDate={addDays(new Date(), db.settings.maxAdvanceDays)}
                />
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
                  <Clock3 size={13} /> Time
                </p>
                <div className="rounded-2xl border border-border bg-surface p-3">
                  {!serviceId ? (
                    <p className="px-1 py-6 text-center text-sm text-muted">
                      Choose a treatment to see available times.
                    </p>
                  ) : !day ? (
                    <p className="px-1 py-6 text-center text-sm text-muted">
                      Pick a date to see available times.
                    </p>
                  ) : daySlots.length === 0 ? (
                    <p className="px-1 py-6 text-center text-sm text-muted">
                      No open times on {fmt.dayMonth(day)}. Try another date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {daySlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => setSlotIso(slot.iso)}
                          className={cn(
                            "rounded-xl border py-2 text-sm font-medium transition-all",
                            slotIso === slot.iso
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-surface text-foreground hover:border-primary/50 hover:bg-primary-soft/40",
                          )}
                        >
                          {fmt.time(slot.iso)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* sticky summary + continue */}
          <div className="sticky bottom-0 z-10 mt-8 -mx-4 border-t border-border bg-background/92 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {summaryBits.length
                    ? summaryBits.join("  ·  ")
                    : "Your selection will appear here"}
                </p>
                <p className="text-xs text-muted">
                  {service
                    ? `${formatPrice(
                        service.price,
                        db.settings.currency,
                      )} · pay at the salon`
                    : "No treatment selected"}
                </p>
              </div>
              <Button onClick={goToDetails} disabled={!canContinue}>
                Continue <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- DETAILS ---------------- */}
      {phase === "details" && (
        <div className="mt-8 animate-fade-in">
          <h1 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
            Your details
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {user
              ? "We’ve pulled these from your account — edit anything that’s changed."
              : "So we can send your confirmation and reminders."}
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" required>
                  <Input
                    value={details.firstName}
                    onChange={(e) =>
                      setDetails({ ...details, firstName: e.target.value })
                    }
                  />
                </Field>
                <Field label="Last name" required>
                  <Input
                    value={details.lastName}
                    onChange={(e) =>
                      setDetails({ ...details, lastName: e.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label="Email" required>
                <Input
                  type="email"
                  value={details.email}
                  disabled={!!user}
                  onChange={(e) =>
                    setDetails({ ...details, email: e.target.value })
                  }
                />
              </Field>
              <Field label="Phone" required>
                <Input
                  value={details.phone}
                  onChange={(e) =>
                    setDetails({ ...details, phone: e.target.value })
                  }
                />
              </Field>
              <Field label="Notes or special requests" hint="Optional">
                <Textarea
                  value={details.notes}
                  onChange={(e) =>
                    setDetails({ ...details, notes: e.target.value })
                  }
                  placeholder="Allergies, preferences, anything we should know…"
                />
              </Field>

              <Field
                label="Promo code or gift card"
                hint="Optional"
                error={promoError ?? undefined}
              >
                {promo ? (
                  <div className="flex items-center justify-between rounded-xl border border-success/40 bg-success-soft px-3.5 py-2.5 text-sm">
                    <span className="font-medium text-success">
                      {promo.code} applied — {formatPrice(promo.amount, db.settings.currency)}{" "}
                      off
                    </span>
                    <button
                      onClick={clearPromo}
                      className="text-xs font-medium text-muted-strong underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="e.g. WELCOME10"
                      className="uppercase"
                    />
                    <Button type="button" variant="outline" onClick={applyPromo}>
                      Apply
                    </Button>
                  </div>
                )}
              </Field>

              {!user ? (
                <p className="text-xs text-muted">
                  Already have an account?{" "}
                  <Link
                    href="/login?next=/book"
                    className="text-primary underline"
                  >
                    Sign in
                  </Link>{" "}
                  for one-tap booking.
                </p>
              ) : null}
            </div>

            <SelectionCard
              service={service ?? null}
              specialist={specialistLabel}
              day={day}
              slotIso={slotIso}
              currency={db.settings.currency}
              onEdit={() => setPhase("arrange")}
            />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setPhase("arrange")}>
              Back
            </Button>
            <Button
              onClick={() => setPhase("confirm")}
              disabled={!detailsValid}
            >
              Review booking <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* ---------------- CONFIRM ---------------- */}
      {phase === "confirm" && (
        <div className="mt-8 animate-fade-in">
          <h1 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
            Confirm your appointment
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            One last look before we lock it in.
          </p>

          <div className="mx-auto mt-6 max-w-lg">
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
              <div className="border-b border-border bg-surface-muted px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  Appointment
                </p>
                <p className="mt-1 font-serif text-xl text-foreground">
                  {service?.name}
                </p>
              </div>
              <div className="px-6 py-2">
                <Row
                  label="Specialist"
                  value={
                    employeeSel === "any"
                      ? `${
                          finalEmployeeId
                            ? fullName(
                                userById(
                                  db.employees.find(
                                    (e) => e.id === finalEmployeeId,
                                  )!.userId,
                                )!,
                              )
                            : "Assigned specialist"
                        } (auto-matched)`
                      : specialistLabel
                  }
                />
                <Row label="Date" value={slotIso ? fmt.fullDate(slotIso) : ""} />
                <Row
                  label="Time"
                  value={
                    slotIso && service
                      ? fmt.timeRange(
                          slotIso,
                          new Date(
                            toDate(slotIso).getTime() +
                              service.durationMinutes * 60000,
                          ),
                        )
                      : ""
                  }
                />
                <Row
                  label="Duration"
                  value={formatDuration(service?.durationMinutes ?? 0)}
                />
                <Row
                  label="Name"
                  value={`${details.firstName} ${details.lastName}`}
                />
                <Row
                  label="Contact"
                  value={`${details.email} · ${details.phone}`}
                  last={!details.notes}
                />
                {details.notes ? (
                  <Row label="Notes" value={details.notes} last={!promo} />
                ) : null}
                {promo ? (
                  <Row
                    label={`${promo.kind === "coupon" ? "Coupon" : "Gift card"} · ${promo.code}`}
                    value={`− ${formatPrice(promo.amount, db.settings.currency)}`}
                    last
                  />
                ) : null}
              </div>
              <div className="flex items-center justify-between border-t border-border bg-surface-muted px-6 py-4">
                <span className="text-sm text-muted">Total due at salon</span>
                <span className="font-serif text-2xl text-primary">
                  {formatPrice(priceDue, db.settings.currency)}
                </span>
              </div>
            </div>

            <div className="mt-3 flex justify-center gap-4 text-sm">
              <button
                onClick={() => setPhase("arrange")}
                className="font-medium text-primary hover:text-primary-hover"
              >
                Change time or specialist
              </button>
              <button
                onClick={() => setPhase("details")}
                className="font-medium text-primary hover:text-primary-hover"
              >
                Edit details
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-muted">
              Free to reschedule or cancel up to{" "}
              {db.settings.cancellationWindowHours} hours before.
            </p>
          </div>

          <div className="mx-auto mt-8 flex max-w-lg items-center justify-between">
            <Button variant="ghost" onClick={() => setPhase("details")}>
              Back
            </Button>
            <Button onClick={handleConfirm}>Confirm booking</Button>
          </div>
        </div>
      )}

      {/* ---------------- pickers ---------------- */}
      <Dialog
        open={picker === "service"}
        onClose={() => setPicker(null)}
        title="Choose a treatment"
        description="Every service is tailored on the day to your skin and goals."
        size="lg"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {activeServices.map((s) => {
            const incompatible =
              employeeSel !== "any" &&
              !db.employees
                .find((e) => e.id === employeeSel)
                ?.serviceIds.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => chooseService(s.id)}
                className={cn(
                  "flex gap-3 rounded-2xl border p-3 text-left transition-all",
                  serviceId === s.id
                    ? "border-primary bg-primary-soft/50 ring-1 ring-primary"
                    : "border-border bg-surface hover:border-primary/40",
                )}
              >
                <SmartImage
                  src={s.image}
                  alt={s.name}
                  fallbackKey={s.id}
                  rounded="rounded-xl"
                  className="h-16 w-16 shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{s.name}</span>
                    <span className="shrink-0 font-serif text-primary">
                      {formatPrice(s.price, db.settings.currency)}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {formatDuration(s.durationMinutes)} · {s.category}
                  </span>
                  {incompatible ? (
                    <span className="mt-1 block text-[11px] text-warning">
                      Not offered by your chosen specialist — we’ll switch to “Any”.
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </Dialog>

      <Dialog
        open={picker === "specialist"}
        onClose={() => setPicker(null)}
        title="Choose your specialist"
        description={
          serviceId
            ? "Only specialists who perform this treatment are shown."
            : "Pick anyone, or let us match you."
        }
        size="lg"
      >
        <div className="grid gap-3">
          <button
            onClick={() => chooseEmployee("any")}
            className={cn(
              "flex items-center gap-4 rounded-2xl border p-4 text-left transition-all",
              employeeSel === "any"
                ? "border-primary bg-primary-soft/50 ring-1 ring-primary"
                : "border-border bg-surface hover:border-primary/40",
            )}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Sparkles size={20} />
            </span>
            <span>
              <span className="block font-medium text-foreground">
                Any available specialist
              </span>
              <span className="block text-sm text-muted">
                Usually the widest choice of times.
              </span>
            </span>
            {employeeSel === "any" ? (
              <Check size={18} className="ml-auto text-primary" />
            ) : null}
          </button>

          {eligibleEmployees.map((e) => {
            const u = userById(e.userId)!;
            return (
              <button
                key={e.id}
                onClick={() => chooseEmployee(e.id)}
                className={cn(
                  "flex items-center gap-4 rounded-2xl border p-4 text-left transition-all",
                  employeeSel === e.id
                    ? "border-primary bg-primary-soft/50 ring-1 ring-primary"
                    : "border-border bg-surface hover:border-primary/40",
                )}
              >
                <Avatar src={e.profileImage} name={fullName(u)} size="lg" />
                <span className="min-w-0">
                  <span className="block font-medium text-foreground">
                    {fullName(u)}
                  </span>
                  <span className="block text-sm text-accent">{e.jobTitle}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {e.bio}
                  </span>
                </span>
                {employeeSel === e.id ? (
                  <Check size={18} className="ml-auto shrink-0 text-primary" />
                ) : null}
              </button>
            );
          })}
        </div>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PhaseNav({
  phase,
  onJump,
}: {
  phase: Phase;
  onJump: (p: Phase) => void;
}) {
  const idx = PHASES.findIndex((p) => p.id === phase);
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {PHASES.map((p, i) => {
        const state = i < idx ? "done" : i === idx ? "current" : "todo";
        return (
          <li key={p.id} className="flex flex-1 items-center gap-2 sm:gap-3">
            <button
              onClick={() => (i <= idx ? onJump(p.id) : undefined)}
              disabled={i > idx}
              className="flex items-center gap-2"
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  state === "done"
                    ? "bg-primary text-primary-foreground"
                    : state === "current"
                      ? "bg-primary text-primary-foreground ring-4 ring-primary-soft"
                      : "bg-surface-sunken text-muted",
                )}
              >
                {state === "done" ? <Check size={13} /> : i + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-xs font-medium sm:text-sm",
                  i === idx ? "inline" : "hidden sm:inline",
                  i <= idx ? "text-foreground" : "text-muted",
                )}
              >
                {p.label}
              </span>
            </button>
            {i < PHASES.length - 1 ? (
              <span
                className={cn(
                  "h-px flex-1",
                  i < idx ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function Facet({
  icon,
  label,
  value,
  placeholder,
  done,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  placeholder: string;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
        done
          ? "border-primary/40 bg-primary-soft/30"
          : "border-border bg-surface hover:border-primary/40",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          done ? "bg-primary text-primary-foreground" : "bg-surface-sunken text-muted",
        )}
      >
        {done ? <Check size={18} /> : icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </span>
        <span
          className={cn(
            "block truncate text-sm",
            value ? "font-medium text-foreground" : "text-muted",
          )}
        >
          {value || placeholder}
        </span>
      </span>
      <Pencil size={15} className="shrink-0 text-muted" />
    </button>
  );
}

function SelectionCard({
  service,
  specialist,
  day,
  slotIso,
  currency,
  onEdit,
}: {
  service: { name: string; price: number; durationMinutes: number } | null;
  specialist: string;
  day: Date | null;
  slotIso: string | null;
  currency: string;
  onEdit: () => void;
}) {
  return (
    <div className="h-fit rounded-2xl border border-border bg-surface-muted p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Your selection
        </p>
        <button
          onClick={onEdit}
          className="text-xs font-medium text-primary hover:text-primary-hover"
        >
          Edit
        </button>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <Line term="Treatment" desc={service?.name ?? "—"} />
        <Line term="Specialist" desc={specialist} />
        <Line term="Date" desc={day ? fmt.fullDate(day) : "—"} />
        <Line
          term="Time"
          desc={
            slotIso && service
              ? fmt.timeRange(
                  slotIso,
                  new Date(
                    toDate(slotIso).getTime() + service.durationMinutes * 60000,
                  ),
                )
              : "—"
          }
        />
      </dl>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted">Total</span>
        <span className="font-serif text-lg text-primary">
          {formatPrice(service?.price ?? 0, currency)}
        </span>
      </div>
    </div>
  );
}

function Line({ term, desc }: { term: string; desc: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{term}</dt>
      <dd className="text-right font-medium text-foreground">{desc}</dd>
    </div>
  );
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-2.5 text-sm",
        !last && "border-b border-border",
      )}
    >
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
