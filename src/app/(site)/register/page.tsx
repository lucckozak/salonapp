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

function RegisterInner() {
  const { signUp, user, ready } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const next = params.get("next") || "/account";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) router.replace(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 6) {
      setError("Choose a password of at least 6 characters.");
      return;
    }
    const res = signUp(form);
    if (!res.ok) {
      setError(res.error ?? "Unable to create account.");
      return;
    }
    toast.success("Account created", "You're all set.");
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Book in seconds and keep your history in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-primary hover:text-primary-hover"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" required>
            <Input
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
          </Field>
          <Field label="Last name" required>
            <Input
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Email" required>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="Phone" required>
          <Input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
        <Field label="Password" required error={error ?? undefined}>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" size="lg">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <HydrationGate fallback={null}>
      <Suspense fallback={null}>
        <RegisterInner />
      </Suspense>
    </HydrationGate>
  );
}
