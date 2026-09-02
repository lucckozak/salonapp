"use client";

import { useStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/misc";

/**
 * Renders `fallback` (default: a page of skeletons) until the client-side
 * store has loaded from localStorage / seed. Everything downstream can then
 * assume `db` is populated and avoid SSR/hydration mismatches.
 */
export function HydrationGate({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hydrated } = useStore();
  if (!hydrated) {
    return (
      fallback ?? (
        <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-10 sm:px-6">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-5 w-80" />
          <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52" />
            ))}
          </div>
        </div>
      )
    );
  }
  return <>{children}</>;
}
