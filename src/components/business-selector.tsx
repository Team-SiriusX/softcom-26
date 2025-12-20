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
import { Building2, Crown, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  const selectedBusiness = businesses.find((b: any) => b.id === selectedBusinessId);

  return (
    <Select
      value={selectedBusinessId || undefined}
      onValueChange={setSelectedBusinessId}
    >

      

      <SelectTrigger className="w-[200px]">
        <Building2 className="mr-2 h-4 w-4" />
        <SelectValue placeholder="Select business">
          {selectedBusiness && (
            <div className="flex items-center gap-2">
              <span className="truncate">{selectedBusiness.name}</span>
              {selectedBusiness.role === "OWNER" && (
                <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
              )}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {businesses.map((business: any) => (
          <SelectItem key={business.id} value={business.id}>
            <div className="flex items-center justify-between w-full gap-2">
              <span className="truncate">{business.name}</span>
              {business.role === "OWNER" ? (
                <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
              ) : (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                  {business.role}
                </Badge>
              )}
            </div>

          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
