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
      <Button variant="outline" size="sm" asChild>
        <Link href="/business">
          <Building2 className="mr-2 h-4 w-4" />
          Create Business
        </Link>
      </Button>
    );
  }

  return (
    <Select
      value={selectedBusinessId || undefined}
      onValueChange={setSelectedBusinessId}
    >
      <SelectTrigger className="w-[200px]">
        <Building2 className="mr-2 h-4 w-4" />
        <SelectValue placeholder="Select business" />
      </SelectTrigger>
      <SelectContent>
        {businesses.map((business: any) => (
          <SelectItem key={business.id} value={business.id}>
            {business.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
