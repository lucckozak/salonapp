"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CustomerTabBar } from "@/components/layout/customer-tab-bar";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = useAuth();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className={cn("flex-1", role === "CUSTOMER" && "pb-20 md:pb-0")}>
        {children}
      </main>
      <SiteFooter />
      <CustomerTabBar />
    </div>
  );
}
