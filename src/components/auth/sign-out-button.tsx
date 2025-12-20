"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";

interface SignOutButtonProps {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export function SignOutButton({ 
  variant = "ghost", 
  className = "", 
  children,
  showIcon = true 
}: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut({
        fetchOptions: {
          onRequest: () => setLoading(true),
          onResponse: () => setLoading(false),
          onError: (ctx) => {
            toast.error(ctx.error?.message || "Failed to sign out");
          },
          onSuccess: () => {
            toast.success("Signed out successfully");
          },
        },
      });
      // Always redirect after signOut completes
      router.push("/auth/sign-in");
      router.refresh();
    } catch (error) {
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleSignOut}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {showIcon && <LogOut className="mr-2 h-4 w-4" />}
          {children || "Sign Out"}
        </>
      )}
    </Button>
  );
}
