"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import { useCreateLedgerAccount } from "@/hooks/use-ledger-accounts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountFormDialog({
  open,
  onOpenChange,
}: AccountFormDialogProps) {
  const { selectedBusinessId } = useSelectedBusiness();
  const createMutation = useCreateLedgerAccount();
  const [accountType, setAccountType] = useState<string>("");

  const form = useForm({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      type: "",
      subType: "",
      normalBalance: "",
    },
  });

  const onSubmit = (data: any) => {
    if (!selectedBusinessId) {
      toast.error("Please select a business first");
      return;
    }

    const payload: any = {
      businessId: selectedBusinessId,
      code: data.code,
      name: data.name,
      description: data.description || undefined,
      type: data.type,
      subType: data.subType,
      normalBalance: data.normalBalance,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Account created successfully");
        onOpenChange(false);
        form.reset();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const getSubTypeOptions = (type: string) => {
    switch (type) {
      case "ASSET":
        return [
          { value: "CURRENT_ASSET", label: "Current Asset" },
          { value: "FIXED_ASSET", label: "Fixed Asset" },
        ];
      case "LIABILITY":
        return [
          { value: "CURRENT_LIABILITY", label: "Current Liability" },
          { value: "LONG_TERM_LIABILITY", label: "Long-term Liability" },
        ];
      case "EQUITY":
        return [
          { value: "OWNERS_EQUITY", label: "Owner's Equity" },
          { value: "RETAINED_EARNINGS", label: "Retained Earnings" },
        ];
      case "REVENUE":
        return [{ value: "OPERATING_REVENUE", label: "Operating Revenue" }];
      case "EXPENSE":
        return [{ value: "OPERATING_EXPENSE", label: "Operating Expense" }];
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Ledger Account</DialogTitle>
          <DialogDescription>
            Add a new account to your chart of accounts
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Account Code *</Label>
            <Input
              id="code"
              {...form.register("code", { required: true })}
              placeholder="e.g. 1000"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Account Name *</Label>
            <Input
              id="name"
              {...form.register("name", { required: true })}
              placeholder="e.g. Cash"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Account Type *</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => {
                form.setValue("type", value);
                setAccountType(value);
                form.setValue("subType", "");
                // Set normal balance based on type
                if (
                  value === "ASSET" ||
                  value === "EXPENSE"
                ) {
                  form.setValue("normalBalance", "DEBIT");
                } else {
                  form.setValue("normalBalance", "CREDIT");
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ASSET">Asset</SelectItem>
                <SelectItem value="LIABILITY">Liability</SelectItem>
                <SelectItem value="EQUITY">Equity</SelectItem>
                <SelectItem value="REVENUE">Revenue</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {accountType && (
            <div className="space-y-2">
              <Label htmlFor="subType">Sub Type *</Label>
              <Select
                value={form.watch("subType")}
                onValueChange={(value) => form.setValue("subType", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select sub type" />
                </SelectTrigger>
                <SelectContent>
                  {getSubTypeOptions(accountType).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Optional description"
              rows={3}
              className="w-full"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
