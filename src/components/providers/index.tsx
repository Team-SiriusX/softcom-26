import React from "react";
import { QueryProvider } from "./query-provider";
import { BusinessProvider } from "./business-provider";
import { Toaster } from "../ui/sonner";

export default function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryProvider>
      <BusinessProvider>
        <Toaster richColors />
        {children}
      </BusinessProvider>
    </QueryProvider>
  );
}
