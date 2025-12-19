import React from "react";
import { QueryProvider } from "./query-provider";
import { Toaster } from "../ui/sonner";

export default function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryProvider>
      <Toaster richColors />
      {children}
    </QueryProvider>
  );
}
