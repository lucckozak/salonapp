"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { AuthShell } from "@/components/auth/auth-card";
import { HydrationGate } from "@/components/hydration-gate";
import { useToast } from "@/components/ui/toast";

function LoginInner() {
  const { signIn, user, role, ready } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const next = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const destFor = (r: string | null) =>
    next ||
    (r === "ADMIN" ? "/admin" : r === "EMPLOYEE" ? "/staff" : "/account");

  useEffect(() => {
    if (ready && user) router.replace(destFor(role));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, role]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = signIn(email, password);
    if (!res.ok) {
      setError(res.error ?? "Unable to sign in.");
      return;
    }
    toast.success("Welcome back");
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Manage your appointments and book faster."
      onDemo={(e) => {
        setEmail(e);
        setPassword("password");
        setError(null);
      }}
      footer={
        <>
          New here?{" "}
          <Link
            href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-primary hover:text-primary-hover"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" required>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" required error={error ?? undefined}>
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" size="lg">
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <HydrationGate fallback={null}>
      <Suspense fallback={null}>
        <LoginInner />
      </Suspense>
    </HydrationGate>
  );
}
