"use client";

import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeApplier } from "@/components/theme-applier";
import { DemoPanel } from "@/components/demo/demo-panel";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AuthProvider>
        <ToastProvider>
          <ThemeApplier />
          {children}
          <DemoPanel />
        </ToastProvider>
      </AuthProvider>
    </StoreProvider>
  );
}
