const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/app/dashboard/transactions/page.tsx');

const content = `"use client";

import { useState } from "react";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import {
  useGetTransactions,
  useDeleteTransaction,
  useReconcileTransaction,
} from "@/hooks/use-transactions";
import { useGetLedgerAccounts } from "@/hooks/use-ledger-accounts";
import { useGetCategories } from "@/hooks/use-categories";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Plus,
  Filter,
  Download,
  Trash2,
  Edit,
  CheckCircle2,
  MoreHorizontal,
  Search,
} from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TransactionFormDialog } from "./_components/transaction-form-dialog";
import { cn } from "@/lib/utils";

export default function TransactionsPage() {
  const { selectedBusinessId } = useSelectedBusiness();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: transactionsData, isLoading } = useGetTransactions(
    selectedBusinessId || undefined,
    { type: typeFilter }
  );
  const { data: accounts } = useGetLedgerAccounts(
    selectedBusinessId || undefined
  );
  const { data: categories } = useGetCategories(
    selectedBusinessId || undefined
  );
  const deleteMutation = useDeleteTransaction();
  const reconcileMutation = useReconcileTransaction();

  if (!selectedBusinessId) {
    return (
      <Alert variant="default" className="bg-card border-none shadow-md">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertTitle>No Business Selected</AlertTitle>
        <AlertDescription>
          Please select a business from the header or{" "}
          <Link href="/business" className="font-medium underline text-primary">
            create a new one
          </Link>
          .
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  const transactions = transactionsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your financial records
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="rounded-full gap-2">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <TransactionFormDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <Card className="bg-card border-none shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                    placeholder="Search transactions..." 
                    className="pl-9 bg-secondary/50 border-none rounded-full"
                />
            </div>
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] rounded-full bg-secondary/50 border-none">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="rounded-full border-none bg-secondary/50">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary/30">
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction: any) => (
                    <TableRow key={transaction.id} className="hover:bg-accent/50 border-border/50 transition-colors">
                      <TableCell className="font-medium">
                        {format(new Date(transaction.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-full font-normal bg-secondary/50">
                          {transaction.category?.name || "Uncategorized"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {transaction.account?.name}
                        </span>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-bold",
                        transaction.type === "INCOME" ? "text-green-500" : "text-red-500"
                      )}>
                        {transaction.type === "INCOME" ? "+" : "-"}\$
                        {transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {transaction.status === "RECONCILED" ? (
                          <div className="flex justify-center">
                             <CheckCircle2 className="h-5 w-5 text-green-500" />
                          </div>
                        ) : (
                          <Badge variant="outline" className="rounded-full border-dashed border-muted-foreground/50 text-muted-foreground font-normal">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => reconcileMutation.mutate(transaction.id)}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              {transaction.status === "RECONCILED" ? "Mark Pending" : "Reconcile"}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="text-red-500 focus:text-red-500"
                                onClick={() => deleteMutation.mutate(transaction.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
`;

fs.writeFileSync(filePath, content);
console.log('File updated successfully');
