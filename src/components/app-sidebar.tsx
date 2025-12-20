"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  BookOpen,
  Tag,
  FileText,
  PieChart,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Transactions",
    href: "/dashboard/transactions",
    icon: Receipt,
  },
  {
    name: "Accounts",
    href: "/dashboard/accounts",
    icon: BookOpen,
  },
  {
    name: "Categories",
    href: "/dashboard/categories",
    icon: Tag,
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: PieChart,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-6 pt-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-[#22D3EE] flex items-center justify-center shadow-sm">
             <span className="font-bold text-black">L</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">LOGO</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors",
                    isActive
                      ? "bg-[#22D3EE] text-black hover:bg-[#22D3EE]/90 shadow-sm"
                      : "text-sidebar-foreground hover:bg-[#22D3EE]/15 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
          
        </nav>
      </div>

      <div className="p-4">
        <SignOutButton>
            <Button
            variant="default"
            className="w-full justify-start gap-3 rounded-2xl bg-[#22D3EE] hover:bg-[#22D3EE]/90 text-black px-5 py-3 font-semibold shadow-sm"
            >
            <LogOut className="h-5 w-5" />
            LOGOUT
            </Button>
        </SignOutButton>
      </div>
    </div>
  );
}