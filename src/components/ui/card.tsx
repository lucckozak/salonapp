import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-6", className)} {...props} />;
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-medium tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  className,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "space-y-3",
        align === "center" && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-medium tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="text-[15px] leading-relaxed text-muted">{description}</p>
      ) : null}
    </div>
  );
}
