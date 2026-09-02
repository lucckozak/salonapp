"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import type { Service } from "@/lib/types";
import { cn, formatDuration, formatPrice } from "@/lib/utils";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";

export function ServiceCard({
  service,
  currency,
  href = "/book",
  className,
}: {
  service: Service;
  currency?: string;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={`${href}?service=${service.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <SmartImage
          src={service.image}
          alt={service.name}
          fallbackKey={service.id}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <Badge tone="neutral" className="bg-surface/90 backdrop-blur">
            {service.category}
          </Badge>
        </div>
        {service.popular ? (
          <div className="absolute right-3 top-3">
            <Badge tone="accent" className="bg-surface/90 backdrop-blur">
              Popular
            </Badge>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-medium text-foreground">{service.name}</h3>
          <span className="shrink-0 font-serif text-lg text-primary">
            {formatPrice(service.price, currency)}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
          {service.description}
        </p>
        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-strong">
          <Clock3 size={14} />
          {formatDuration(service.durationMinutes)}
          <span className="ml-auto text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Book →
          </span>
        </div>
      </div>
    </Link>
  );
}
