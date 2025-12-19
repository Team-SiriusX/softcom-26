"use client";

import { useState } from "react";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import { useGetLedgerAccounts } from "@/hooks/use-ledger-accounts";
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
import { AlertCircle, Plus, Filter } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountFormDialog } from "./_components/account-form-dialog";

const accountTypeColors: Record<string, string> = {
  ASSET: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  LIABILITY: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  EQUITY: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  REVENUE: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  EXPENSE: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
};

export default function AccountsPage() {
  const { selectedBusinessId } = useSelectedBusiness();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: accounts, isLoading } = useGetLedgerAccounts(
    selectedBusinessId || undefined,
    { type: typeFilter, isActive: true }
  );

  if (!selectedBusinessId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Business Selected</AlertTitle>
        <AlertDescription>
          Please select a business from the header or{" "}
          <Link href="/business" className="font-medium underline">
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
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Group accounts by type
  const groupedAccounts = (accounts || []).reduce((acc: any, account: any) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Chart of Accounts
          </h1>
          <p className="text-muted-foreground">
            Manage your account structure and balances
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      <AccountFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((type) => {
          const typeAccounts = groupedAccounts[type] || [];
          const total = typeAccounts.reduce(
            (sum: number, acc: any) => sum + Number(acc.currentBalance),
            0
          );

          return (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{type}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${total.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {typeAccounts.length} account(s)
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="ASSET">Assets</SelectItem>
              <SelectItem value="LIABILITY">Liabilities</SelectItem>
              <SelectItem value="EQUITY">Equity</SelectItem>
              <SelectItem value="REVENUE">Revenue</SelectItem>
              <SelectItem value="EXPENSE">Expenses</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Accounts</CardTitle>
          <CardDescription>
            {(accounts || []).length} account(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!accounts || accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No accounts configured
              </h3>
              <p className="text-muted-foreground mb-4">
                Set up your chart of accounts to start tracking finances
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Default Accounts
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sub Type</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Normal Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account: any) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono font-medium">
                        {account.code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{account.name}</div>
                          {account.description && (
                            <div className="text-xs text-muted-foreground">
                              {account.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={accountTypeColors[account.type]}
                        >
                          {account.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {account.subType.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${Number(account.currentBalance).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{account.normalBalance}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
