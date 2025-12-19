"use client";

import { useForm } from "react-hook-form";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import { useCreateTransaction } from "@/hooks/use-transactions";
import { useGetLedgerAccounts } from "@/hooks/use-ledger-accounts";
import { useGetCategories } from "@/hooks/use-categories";
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
import { format } from "date-fns";

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionFormDialog({
  open,
  onOpenChange,
}: TransactionFormDialogProps) {
  const { selectedBusinessId } = useSelectedBusiness();
  const createMutation = useCreateTransaction();
  const { data: accounts } = useGetLedgerAccounts(selectedBusinessId || undefined);
  const { data: categories } = useGetCategories(selectedBusinessId || undefined);

  const form = useForm({
    defaultValues: {
      type: "",
      date: format(new Date(), "yyyy-MM-dd"),
      amount: "",
      description: "",
      ledgerAccountId: "",
      contraAccountId: "",
      categoryId: "",
      referenceNumber: "",
    },
  });

  const onSubmit = (data: any) => {
    if (!selectedBusinessId) {
      toast.error("Please select a business first");
      return;
    }

    createMutation.mutate(
      {
        businessId: selectedBusinessId,
        type: data.type,
        date: data.date,
        amount: Number(data.amount),
        description: data.description,
        ledgerAccountId: data.ledgerAccountId,
        contraAccountId: data.contraAccountId,
        categoryId: data.categoryId || undefined,
        referenceNumber: data.referenceNumber || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Transaction created successfully");
          onOpenChange(false);
          form.reset();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const transactionType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
          <DialogDescription>
            Record a new transaction in your books
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type *</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => form.setValue("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              {...form.register("date", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              {...form.register("amount", { required: true })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ledgerAccountId">Account *</Label>
            <Select
              value={form.watch("ledgerAccountId")}
              onValueChange={(value) => form.setValue("ledgerAccountId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account: any) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contraAccountId">
              {transactionType === "INCOME"
                ? "From Account (Revenue) *"
                : transactionType === "EXPENSE"
                ? "To Account (Expense) *"
                : "Contra Account *"}
            </Label>
            <Select
              value={form.watch("contraAccountId")}
              onValueChange={(value) => form.setValue("contraAccountId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contra account" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account: any) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(transactionType === "INCOME" || transactionType === "EXPENSE") && (
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select
                value={form.watch("categoryId")}
                onValueChange={(value) => form.setValue("categoryId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    ?.filter((cat: any) =>
                      transactionType === "INCOME"
                        ? cat.type === "INCOME"
                        : cat.type === "EXPENSE"
                    )
                    .map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...form.register("description", { required: true })}
              placeholder="Describe the transaction"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference Number</Label>
            <Input
              id="referenceNumber"
              {...form.register("referenceNumber")}
              placeholder="Optional reference or invoice #"
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
              {createMutation.isPending ? "Creating..." : "Create Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
