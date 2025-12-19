import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-[#0B0E14] text-white antialiased flex flex-col items-center justify-center">
      {/* Logo/Header - Simplified */}
      <div className="absolute left-8 top-8 z-50">
        <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22D3EE]">
              <span className="text-xl font-bold text-[#0B0E14]">U</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white">
                Uni Connect
              </h1>
            </div>
        </Link>
      </div>

      {/* Content */}
      <div className="w-full max-w-md p-4">
        {children}
      </div>
    </div>
  );
}