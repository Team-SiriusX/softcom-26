import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-white text-neutral-900 antialiased flex flex-col items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute left-0 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22D3EE]/10 blur-[120px]" />
      <div className="absolute right-0 bottom-0 -z-10 h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-[#22D3EE]/10 blur-[120px]" />

      {/* Logo/Header */}
      <div className="absolute left-8 top-8 z-50">
        <Link href="/" className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight text-neutral-900">
              FUTURE <span className="text-[#22D3EE]">FINANCE</span>
            </h3>
        </Link>
      </div>

      {/* Content */}
      <div className="w-full max-w-md p-8 relative z-10">
        {children}
      </div>
    </div>
  );
}