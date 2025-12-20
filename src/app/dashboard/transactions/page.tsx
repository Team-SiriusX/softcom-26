"use client";

import { useState, useCallback } from "react";
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
  X,
  Upload,
  ArrowUpDown,
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
import { CSVImportDialog } from "./_components/csv-import-dialog";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

export default function TransactionsPage() {
  const { selectedBusinessId } = useSelectedBusiness();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "amount" | "description" | "createdAt">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Convert DateRange to string format for API
  const startDate = dateRange?.from
    ? format(dateRange.from, "yyyy-MM-dd")
    : undefined;
  const endDate = dateRange?.to
    ? format(dateRange.to, "yyyy-MM-dd")
    : undefined;

  const { data: transactionsData, isLoading } = useGetTransactions(
    selectedBusinessId || undefined,
    { type: typeFilter, startDate, endDate, sortBy, sortOrder }
  );

  const exportToCSV = useCallback(() => {
    const transactions = transactionsData?.data || [];
    if (transactions.length === 0) return;

    const headers = [
      "Date",
      "Description",
      "Amount",
      "Type",
      "Account",
      "Category",
      "Reference",
      "Notes",
    ];
    const rows = transactions.map((t: any) => [
      format(new Date(t.date), "yyyy-MM-dd"),
      t.description || "",
      String(t.amount),
      t.type,
      t.ledgerAccount?.name || "",
      t.category?.name || "",
      t.referenceNumber || "",
      t.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
    ...rows.map((row: string[]) =>
        row.map((cell) => `"${(cell ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [transactionsData]);
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
          <Link
            href="/dashboard/business"
            className="font-medium underline text-primary"
          >
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
  const filteredTransactions = transactions.filter((t: any) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      t.description,
      t.category?.name,
      t.ledgerAccount?.name,
      t.type,
      t.isReconciled ? "reconciled" : "pending",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your financial records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-full bg-background gap-2"
            onClick={() => setIsImportOpen(true)}
            title="Import CSV"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button
            variant="outline"
            className="rounded-full bg-background gap-2"
            aria-label="Download CSV"
            onClick={exportToCSV}
            disabled={!transactionsData?.data?.length}
            title="Export to CSV"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-full gap-2 bg-[#22D3EE] text-black hover:bg-[#22D3EE]/90"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <TransactionFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      <CSVImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        accounts={accounts || []}
        categories={categories || []}
      />

      <Card className="bg-card border border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by description, category, account…"
                className="h-10 pl-9 rounded-full bg-background"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {/* Type Filter */}
                <Select
                  value={typeFilter ?? "ALL"}
                  onValueChange={(v) =>
                    setTypeFilter(v === "ALL" ? undefined : v)
                  }
                >
                  <SelectTrigger className="h-10 w-[160px] rounded-full bg-background">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Range Picker */}
                <DateRangePicker
                  date={dateRange}
                  onDateChange={setDateRange}
                  placeholder="Select date range"
                  className="w-full sm:w-[300px]"
                />

                {/* Sort By */}
                <Select
                  value={`${sortBy}-${sortOrder}`}
                  onValueChange={(v) => {
                    const [field, order] = v.split("-") as [typeof sortBy, typeof sortOrder];
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                >
                  <SelectTrigger className="h-10 w-[180px] rounded-full bg-background">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Date (Newest)</SelectItem>
                    <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                    <SelectItem value="amount-desc">Amount (High-Low)</SelectItem>
                    <SelectItem value="amount-asc">Amount (Low-High)</SelectItem>
                    <SelectItem value="description-asc">Description (A-Z)</SelectItem>
                    <SelectItem value="description-desc">Description (Z-A)</SelectItem>
                    <SelectItem value="createdAt-desc">Recently Added</SelectItem>
                  </SelectContent>
                </Select>

                {/* Active Filters Badge */}
                {(typeFilter || dateRange) && (
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-primary/10 text-primary border-primary/20 h-8 px-3"
                  >
                    {[
                      typeFilter && `Type: ${typeFilter}`,
                      dateRange?.from && "Date Range",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </Badge>
                )}
              </div>

              {/* Results Count */}
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredTransactions.length} result(s)
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-border/60 overflow-hidden bg-background">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-border/60">
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
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction: any) => (
                    <TableRow
                      key={transaction.id}
                      className="border-border/60 transition-colors hover:bg-[#22D3EE]/10"
                    >
                      <TableCell className="font-medium">
                        {format(new Date(transaction.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="rounded-full font-normal bg-muted/50"
                        >
                          {transaction.category?.name || "Uncategorized"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {transaction.ledgerAccount?.name}
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-bold",
                          transaction.type === "INCOME"
                            ? "text-green-500"
                            : "text-red-500"
                        )}
                      >
                        {transaction.type === "INCOME" ? "+" : "-"}$
                        {transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {transaction.isReconciled ? (
                          <div className="flex justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="rounded-full border-dashed border-muted-foreground/50 text-muted-foreground font-normal"
                          >
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-full hover:bg-muted"
                              aria-label="Row actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-xl"
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                reconcileMutation.mutate(transaction.id, {
                                  onSuccess: () => {
                                    toast.success(
                                      transaction.isReconciled
                                        ? "Transaction marked as pending"
                                        : "Transaction reconciled"
                                    );
                                  },
                                  onError: (error) => {
                                    toast.error(error.message);
                                  },
                                })
                              }
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              {transaction.isReconciled
                                ? "Mark Pending"
                                : "Reconcile"}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500 focus:text-red-500"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Are you sure you want to delete this transaction?"
                                  )
                                ) {
                                  deleteMutation.mutate(transaction.id, {
                                    onSuccess: () => {
                                      toast.success(
                                        "Transaction deleted successfully"
                                      );
                                    },
                                    onError: (error) => {
                                      toast.error(error.message);
                                    },
                                  });
                                }
                              }}
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
