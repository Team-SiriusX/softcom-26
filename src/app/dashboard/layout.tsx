"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { BusinessSelector } from "@/components/business-selector";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/auth/user-nav";
import { Building2 } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden md:block w-64 shrink-0">
        <AppSidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 md:h-16 items-center justify-between md:justify-end gap-2 md:gap-4 border-b bg-background/80 px-3 md:px-6 backdrop-blur">
          {/* Mobile Logo/Brand */}
          <Link href="/dashboard" className="md:hidden flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Dashboard</span>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <BusinessSelector />
            </div>

            <UserNav />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/20 p-3 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
