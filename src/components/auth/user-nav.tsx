"use client";

import { useSession } from "@/lib/auth-client";
import { SignOutButton } from "./sign-out-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, CreditCard, Sparkles } from "lucide-react";
import { useGetSubscription, useCreatePortalSession } from "@/hooks/use-stripe";

export function UserNav() {
  const { data: session, isPending } = useSession();
  const { data: subscription } = useGetSubscription();
  const { mutate: openPortal, isPending: isPortalPending } =
    useCreatePortalSession();

  if (isPending) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-700" />
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/auth/sign-in">Sign In</Link>
        </Button>
        <Button asChild>
          <Link href="/auth/sign-up">Sign Up</Link>
        </Button>
      </div>
    );
  }

  const user = session.user;
  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  const tier =
    subscription && "tier" in subscription ? subscription.tier : "FREE";
  const tierColors: Record<string, string> = {
    FREE: "bg-muted text-muted-foreground",
    PRO: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    BUSINESS: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 md:h-10 w-auto gap-1 md:gap-2 rounded-full px-1 md:px-2 hover:bg-secondary"
        >
          <div className="hidden md:flex flex-col items-end text-sm">
            <span className="font-medium">{user.name}</span>
          </div>
          <Avatar className="h-7 w-7 md:h-8 md:w-8">
            <AvatarImage src={user.image || ""} alt={user.name || ""} />
            <AvatarFallback className="text-xs md:text-sm">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <Badge
                variant="outline"
                className={tierColors[tier] || tierColors.FREE}
              >
                {tier}
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        {tier === "FREE" ? (
          <DropdownMenuItem asChild>
            <Link href="/pricing" className="flex items-center">
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => openPortal()}
            disabled={isPortalPending}
            className="flex items-center cursor-pointer"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {isPortalPending ? "Opening..." : "Manage Subscription"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <button
            onClick={async () => {
              const { signOut } = await import("@/lib/auth-client");
              const { toast } = await import("sonner");
              try {
                await signOut();
                toast.success("Signed out successfully");
              } catch (error) {
                toast.error("Failed to sign out");
              }
            }}
            className="w-full justify-start flex items-center cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
