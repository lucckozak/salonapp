"use client";

import Link from "next/link";
import {
  CalendarCheck,
  Clock3,
  Leaf,
  Sparkles,
  Star,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { fullName } from "@/lib/utils";
import { LinkButton } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/card";
import { SmartImage } from "@/components/ui/smart-image";
import { Skeleton } from "@/components/ui/misc";
import { ServiceCard } from "@/components/services/service-card";
import { SpecialistCard } from "@/components/specialists/specialist-card";
import { IMAGES } from "@/lib/data/images";

const BENEFITS = [
  {
    icon: Star,
    title: "Experienced specialists",
    body: "A small, senior team — every therapist is hand-picked and continually trained.",
  },
  {
    icon: Sparkles,
    title: "Personalised treatments",
    body: "Each service is adjusted to your skin, your goals and the day you're having.",
  },
  {
    icon: Leaf,
    title: "Premium products",
    body: "Clean, results-driven skincare and low-tox polishes we're happy to stand behind.",
  },
  {
    icon: CalendarCheck,
    title: "Easy online booking",
    body: "See real availability and reserve in under two minutes — reschedule anytime.",
  },
];

export default function HomePage() {
  const { db, hydrated } = useStore();
  const popular = db.services.filter((s) => s.active && s.popular).slice(0, 6);
  const services = popular.length
    ? popular
    : db.services.filter((s) => s.active).slice(0, 6);
  const team = db.employees.filter((e) => e.active).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              {db.settings.name}
            </p>
            <h1 className="mt-4 font-serif text-[2.6rem] font-medium leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              {db.settings.tagline || "Beauty, tailored to you."}
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
              Browse our services, choose your specialist, and book a time that
              actually works — all online, in under two minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton href="/book" size="lg">
                Book an appointment
              </LinkButton>
              <LinkButton href="/services" variant="outline" size="lg">
                Explore treatments
              </LinkButton>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted">
              <span className="inline-flex items-center gap-2">
                <Star size={15} className="fill-accent text-accent" /> 4.8 average
                rating
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 size={15} /> Open 7 days
              </span>
            </div>
          </div>

          <div className="relative">
            <SmartImage
              src={IMAGES.heroPortrait}
              alt="A calm facial treatment in progress"
              fallbackKey="hero"
              rounded="rounded-[2rem]"
              className="aspect-[4/5] w-full shadow-[var(--shadow-pop)]"
            />
            <div className="absolute -bottom-6 -left-6 hidden w-52 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-pop)] sm:block">
              <p className="font-serif text-2xl text-foreground">1,284</p>
              <p className="text-xs text-muted">clients cared for this year</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex items-end justify-between gap-6">
          <SectionTitle
            eyebrow="Treatments"
            title="Our most-loved services"
            description="A focused menu — done exceptionally well."
          />
          <Link
            href="/services"
            className="hidden shrink-0 text-sm font-medium text-primary hover:text-primary-hover sm:block"
          >
            View all →
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {!hydrated
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[22rem]" />
              ))
            : services.map((s) => (
                <ServiceCard key={s.id} service={s} currency={db.settings.currency} />
              ))}
        </div>
      </section>

      {/* Specialists */}
      <section className="bg-surface-muted py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle
            eyebrow="The team"
            title="Meet our specialists"
            description="Senior therapists who take the time to get it right."
            align="center"
          />
          <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {!hydrated
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[26rem]" />
                ))
              : team.map((e) => {
                  const user = db.users.find((u) => u.id === e.userId)!;
                  return (
                    <SpecialistCard
                      key={e.id}
                      employee={e}
                      user={user}
                      serviceCount={e.serviceIds.length}
                    />
                  );
                })}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <SectionTitle
          eyebrow={`Why ${db.settings.name}`}
          title="Considered care, start to finish"
          align="center"
        />
        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
                <b.icon size={19} />
              </span>
              <h3 className="mt-4 text-base font-medium text-foreground">
                {b.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-center sm:px-16">
          <div className="relative z-10 mx-auto max-w-xl">
            <h2 className="font-serif text-3xl font-medium text-primary-foreground sm:text-4xl">
              Ready for your next appointment?
            </h2>
            <p className="mt-3 text-[15px] text-primary-foreground/80">
              Real-time availability for every specialist. No phone calls, no
              back-and-forth.
            </p>
            <div className="mt-7">
              <LinkButton
                href="/book"
                size="lg"
                className="bg-surface text-primary hover:bg-surface-muted"
              >
                Book now
              </LinkButton>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/5" />
        </div>
      </section>
    </div>
  );
}
