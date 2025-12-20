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
      {/* Sidebar */}
      <aside className="hidden md:block w-64 shrink-0">
        <AppSidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-end gap-4 border-b bg-background/80 px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BusinessSelector />
            </div>

            <UserNav />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/20 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
