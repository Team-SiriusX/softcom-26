"use client";

import { useState } from "react";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import {
  useGetBalanceSheet,
  useGetProfitLoss,
  useGetCashFlow,
} from "@/hooks/use-reports";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Download, Calendar } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function ReportsPage() {
  const { selectedBusinessId } = useSelectedBusiness();
  const today = format(new Date(), "yyyy-MM-dd");
  const firstDayOfMonth = format(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    "yyyy-MM-dd"
  );

  const [balanceSheetDate, setBalanceSheetDate] = useState(today);
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);

  const { data: balanceSheet, isLoading: loadingBS } = useGetBalanceSheet(
    selectedBusinessId || undefined,
    balanceSheetDate
  );

  const { data: profitLoss, isLoading: loadingPL } = useGetProfitLoss(
    selectedBusinessId || undefined,
    startDate,
    endDate
  );

  const { data: cashFlow, isLoading: loadingCF } = useGetCashFlow(
    selectedBusinessId || undefined,
    startDate,
    endDate
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground mt-1">
            Balance sheet, P&L, and cash flow statements
          </p>
        </div>
        <Button className="h-10 rounded-full bg-[#22D3EE] text-black hover:bg-[#22D3EE]/90">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <Card className="bg-card border border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base tracking-tight flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Date controls
          </CardTitle>
          <CardDescription>Adjust the report dates without changing any data logic.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Balance sheet date</div>
              <Input
                type="date"
                value={balanceSheetDate}
                onChange={(e) => setBalanceSheetDate(e.target.value)}
                className="h-10 rounded-full bg-background"
              />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Start date</div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 rounded-full bg-background"
              />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">End date</div>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 rounded-full bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="balance-sheet" className="space-y-4">
        <TabsList className="rounded-full bg-card border border-border/60 p-1 w-fit">
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
        </TabsList>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet" className="space-y-4">
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>
                Financial position as of {format(new Date(balanceSheetDate), "MMMM dd, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBS ? (
                <div className="flex justify-center py-8">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : balanceSheet ? (
                <div className="space-y-6">
                  {/* KPI row */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Total Assets</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold tracking-tight">
                          ${balanceSheet.assets.total.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Total Liabilities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold tracking-tight">
                          ${balanceSheet.liabilities.total.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Total Equity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold tracking-tight">
                          ${balanceSheet.equity.total.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className={balanceSheet.totals.isBalanced ? "bg-green-50 dark:bg-green-900/10 border border-green-200/60" : "bg-red-50 dark:bg-red-900/10 border border-red-200/60"}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={balanceSheet.totals.isBalanced ? "text-green-700 dark:text-green-300 font-semibold" : "text-red-700 dark:text-red-300 font-semibold"}>
                          {balanceSheet.totals.isBalanced ? "✓ Balanced" : "✗ Not Balanced"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Assets vs Liabilities + Equity</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Two-column breakdown */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader>
                        <CardTitle className="tracking-tight">Assets</CardTitle>
                        <CardDescription>What the business owns</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Current assets</h4>
                            <span className="text-sm font-semibold">${balanceSheet.assets.currentAssets.total.toLocaleString()}</span>
                          </div>
                          <div className="mt-3 space-y-2">
                            {balanceSheet.assets.currentAssets.accounts.map((acc: any) => (
                              <div key={acc.id} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{acc.name}</span>
                                <span className="font-medium">${acc.balance.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-border/60 pt-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Fixed assets</h4>
                            <span className="text-sm font-semibold">${balanceSheet.assets.fixedAssets.total.toLocaleString()}</span>
                          </div>
                          <div className="mt-3 space-y-2">
                            {balanceSheet.assets.fixedAssets.accounts.map((acc: any) => (
                              <div key={acc.id} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{acc.name}</span>
                                <span className="font-medium">${acc.balance.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-t-2 border-border/60 pt-4 flex items-center justify-between">
                          <span className="text-sm font-semibold">Total assets</span>
                          <span className="text-base font-bold">${balanceSheet.assets.total.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader>
                        <CardTitle className="tracking-tight">Liabilities & Equity</CardTitle>
                        <CardDescription>What the business owes and retains</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Current liabilities</h4>
                            <span className="text-sm font-semibold">${balanceSheet.liabilities.currentLiabilities.total.toLocaleString()}</span>
                          </div>
                          <div className="mt-3 space-y-2">
                            {balanceSheet.liabilities.currentLiabilities.accounts.map((acc: any) => (
                              <div key={acc.id} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{acc.name}</span>
                                <span className="font-medium">${acc.balance.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-sm">
                            <span className="font-semibold">Total liabilities</span>
                            <span className="font-semibold">${balanceSheet.liabilities.total.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="border-t border-border/60 pt-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Equity</h4>
                            <span className="text-sm font-semibold">${balanceSheet.equity.total.toLocaleString()}</span>
                          </div>
                          <div className="mt-3 space-y-2">
                            {balanceSheet.equity.ownersEquity.accounts.map((acc: any) => (
                              <div key={acc.id} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{acc.name}</span>
                                <span className="font-medium">${acc.balance.toLocaleString()}</span>
                              </div>
                            ))}
                            {balanceSheet.equity.retainedEarnings.accounts.map((acc: any) => (
                              <div key={acc.id} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{acc.name}</span>
                                <span className="font-medium">${acc.balance.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-t-2 border-border/60 pt-4 flex items-center justify-between">
                          <span className="text-sm font-semibold">Total liabilities & equity</span>
                          <span className="text-base font-bold">${balanceSheet.totals.liabilitiesAndEquity.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Working Capital</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${balanceSheet.metrics.workingCapital.toLocaleString()}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Current Ratio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{balanceSheet.metrics.currentRatio.toFixed(2)}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Debt-to-Equity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{balanceSheet.metrics.debtToEquityRatio.toFixed(2)}</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit & Loss */}
        <TabsContent value="profit-loss" className="space-y-4">
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>
                {format(new Date(startDate), "MMM dd, yyyy")} to{" "}
                {format(new Date(endDate), "MMM dd, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPL ? (
                <div className="flex justify-center py-8">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : profitLoss ? (
                <div className="space-y-6">
                  {/* KPI row */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold tracking-tight">${profitLoss.revenue.total.toLocaleString()}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Total Expenses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold tracking-tight">${profitLoss.expenses.total.toLocaleString()}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Net Income</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={profitLoss.summary.netIncome >= 0 ? "text-2xl font-bold tracking-tight text-green-600" : "text-2xl font-bold tracking-tight text-red-600"}>
                          ${profitLoss.summary.netIncome.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Breakdown */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader>
                        <CardTitle className="tracking-tight">Revenue</CardTitle>
                        <CardDescription>Income earned during the period</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {profitLoss.revenue.operatingRevenue.accounts.map((acc: any) => (
                          <div key={acc.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{acc.name}</span>
                            <span className="font-medium">${acc.balance.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="pt-3 mt-2 border-t border-border/60 flex items-center justify-between">
                          <span className="text-sm font-semibold">Total revenue</span>
                          <span className="text-sm font-semibold">${profitLoss.revenue.total.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader>
                        <CardTitle className="tracking-tight">Expenses</CardTitle>
                        <CardDescription>Costs incurred during the period</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {profitLoss.expenses.operatingExpenses.accounts.map((acc: any) => (
                          <div key={acc.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{acc.name}</span>
                            <span className="font-medium">${acc.balance.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="pt-3 mt-2 border-t border-border/60 flex items-center justify-between">
                          <span className="text-sm font-semibold">Total expenses</span>
                          <span className="text-sm font-semibold">${profitLoss.expenses.total.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Margins */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Gross Profit Margin</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{profitLoss.summary.grossProfitMargin.toFixed(1)}%</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Operating Margin</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{profitLoss.summary.operatingMargin.toFixed(1)}%</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Net Profit Margin</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{profitLoss.summary.netProfitMargin.toFixed(1)}%</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow */}
        <TabsContent value="cash-flow" className="space-y-4">
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
              <CardDescription>
                {format(new Date(startDate), "MMM dd, yyyy")} to{" "}
                {format(new Date(endDate), "MMM dd, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCF ? (
                <div className="flex justify-center py-8">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : cashFlow ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Opening Balance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold tracking-tight">${cashFlow.summary.openingBalance.toLocaleString()}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Net Cash Flow</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={cashFlow.summary.netCashFlow >= 0 ? "text-2xl font-bold tracking-tight text-green-600" : "text-2xl font-bold tracking-tight text-red-600"}>
                          ${cashFlow.summary.netCashFlow.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-background border border-border/60 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Closing Balance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold tracking-tight">${cashFlow.summary.closingBalance.toLocaleString()}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    {["operating", "investing", "financing"].map((category) => {
                      const cfByCategory = cashFlow as unknown as Record<string, { total: number }>;
                      const total = cfByCategory[category]?.total ?? 0;
                      return (
                        <Card key={category} className="bg-background border border-border/60 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm tracking-tight capitalize">{category} activities</CardTitle>
                            <CardDescription>Net cash flow</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className={total >= 0 ? "text-2xl font-bold text-green-600" : "text-2xl font-bold text-red-600"}>
                              ${total.toLocaleString()}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
