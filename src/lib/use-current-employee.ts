"use client";

import { useAuth } from "./auth";
import { useStore } from "./store";

export function useCurrentEmployee() {
  const { user } = useAuth();
  const { employeeByUserId } = useStore();
  return user ? (employeeByUserId(user.id) ?? null) : null;
}
