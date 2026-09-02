"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export function FullPageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-3 text-muted">
      <Loader2 className="animate-spin" size={22} />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}

export function RequireRole({
  roles,
  children,
  redirectTo = "/login",
}: {
  roles: Role[];
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const { user, role, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`${redirectTo}?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (role && !roles.includes(role)) {
      const home =
        role === "ADMIN" ? "/admin" : role === "EMPLOYEE" ? "/staff" : "/account";
      router.replace(home);
    }
  }, [ready, user, role, roles, router, redirectTo]);

  if (!ready) return <FullPageLoader />;
  if (!user || (role && !roles.includes(role)))
    return <FullPageLoader label="Redirecting…" />;

  return <>{children}</>;
}
