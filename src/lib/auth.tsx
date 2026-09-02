"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Role, User } from "./types";
import { useStore } from "./store";

const SESSION_KEY = "maisonlumiere:session";

interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthValue {
  user: User | null;
  role: Role | null;
  ready: boolean;
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  signUp: (input: SignUpInput) => { ok: boolean; error?: string };
  signOut: () => void;
  updateProfile: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setUserId(window.localStorage.getItem(SESSION_KEY));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persist = useCallback((id: string | null) => {
    setUserId(id);
    try {
      if (id) window.localStorage.setItem(SESSION_KEY, id);
      else window.localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<AuthValue>(() => {
    const user = userId ? store.userById(userId) ?? null : null;

    return {
      user,
      role: user?.role ?? null,
      ready: ready && store.hydrated,

      signIn: (email, password) => {
        const match = store.db.users.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
        );
        if (!match) return { ok: false, error: "No account found for that email." };
        if (match.password !== password)
          return { ok: false, error: "Incorrect password." };
        persist(match.id);
        return { ok: true };
      },

      signUp: (input) => {
        const exists = store.db.users.some(
          (u) => u.email.toLowerCase() === input.email.trim().toLowerCase(),
        );
        if (exists)
          return { ok: false, error: "An account with that email already exists." };
        const created = store.createCustomer({
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email: input.email.trim(),
          phone: input.phone.trim(),
          password: input.password,
        });
        persist(created.id);
        return { ok: true };
      },

      signOut: () => persist(null),

      updateProfile: (patch) => {
        if (!user) return;
        store.saveCustomer({ ...user, ...patch });
      },
    };
  }, [userId, ready, store, persist]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
