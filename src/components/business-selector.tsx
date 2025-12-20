"use client";

import { useGetBusinesses } from "@/hooks/use-business";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function BusinessSelector() {
  const { data: businesses } = useGetBusinesses();
  const { selectedBusinessId, setSelectedBusinessId } = useSelectedBusiness();

  if (!businesses || businesses.length === 0) {
    return (
      <Button variant="outline" size="sm" asChild className="h-8 md:h-9">
        <Link href="/dashboard/business">
          <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
          <span className="hidden sm:inline">Create Business</span>
        </Link>
      </Button>
    );
  }

  return (
    <Select
      value={selectedBusinessId || undefined}
      onValueChange={setSelectedBusinessId}
    >
      <SelectTrigger className="w-[140px] sm:w-[180px] md:w-[200px] h-8 md:h-9 text-xs md:text-sm">
        <Building2 className="mr-1 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
        <SelectValue placeholder="Select business" />
      </SelectTrigger>
      <SelectContent>
        {businesses.map((business: any) => (
          <SelectItem key={business.id} value={business.id} className="text-xs md:text-sm">
            {business.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
