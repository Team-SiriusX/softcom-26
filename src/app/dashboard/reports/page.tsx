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
          Please select a business from the dropdown above or{" "}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">
            Balance sheet, P&L, and cash flow statements
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <Tabs defaultValue="balance-sheet" className="space-y-4">
        <TabsList>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
        </TabsList>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet" className="space-y-4">
          <Card>
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
                  {/* Assets */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">ASSETS</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">
                          Current Assets
                        </h4>
                        <div className="space-y-1 ml-4">
                          {balanceSheet.assets.currentAssets.accounts.map(
                            (acc: any) => (
                              <div
                                key={acc.id}
                                className="flex justify-between text-sm"
                              >
                                <span>{acc.name}</span>
                                <span>${acc.balance.toLocaleString()}</span>
                              </div>
                            )
                          )}
                          <div className="flex justify-between font-medium pt-2 border-t">
                            <span>Total Current Assets</span>
                            <span>
                              $
                              {balanceSheet.assets.currentAssets.total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">
                          Fixed Assets
                        </h4>
                        <div className="space-y-1 ml-4">
                          {balanceSheet.assets.fixedAssets.accounts.map(
                            (acc: any) => (
                              <div
                                key={acc.id}
                                className="flex justify-between text-sm"
                              >
                                <span>{acc.name}</span>
                                <span>${acc.balance.toLocaleString()}</span>
                              </div>
                            )
                          )}
                          <div className="flex justify-between font-medium pt-2 border-t">
                            <span>Total Fixed Assets</span>
                            <span>
                              $
                              {balanceSheet.assets.fixedAssets.total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between font-bold text-lg pt-4 border-t-2">
                        <span>TOTAL ASSETS</span>
                        <span>
                          ${balanceSheet.assets.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities */}
                  <div className="pt-6 border-t-2">
                    <h3 className="font-semibold text-lg mb-4">
                      LIABILITIES & EQUITY
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">
                          Current Liabilities
                        </h4>
                        <div className="space-y-1 ml-4">
                          {balanceSheet.liabilities.currentLiabilities.accounts.map(
                            (acc: any) => (
                              <div
                                key={acc.id}
                                className="flex justify-between text-sm"
                              >
                                <span>{acc.name}</span>
                                <span>${acc.balance.toLocaleString()}</span>
                              </div>
                            )
                          )}
                          <div className="flex justify-between font-medium pt-2 border-t">
                            <span>Total Current Liabilities</span>
                            <span>
                              $
                              {balanceSheet.liabilities.currentLiabilities.total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between font-medium text-base pt-2 border-t">
                        <span>TOTAL LIABILITIES</span>
                        <span>
                          ${balanceSheet.liabilities.total.toLocaleString()}
                        </span>
                      </div>

                      <div className="pt-4">
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">
                          Equity
                        </h4>
                        <div className="space-y-1 ml-4">
                          {balanceSheet.equity.ownersEquity.accounts.map(
                            (acc: any) => (
                              <div
                                key={acc.id}
                                className="flex justify-between text-sm"
                              >
                                <span>{acc.name}</span>
                                <span>${acc.balance.toLocaleString()}</span>
                              </div>
                            )
                          )}
                          {balanceSheet.equity.retainedEarnings.accounts.map(
                            (acc: any) => (
                              <div
                                key={acc.id}
                                className="flex justify-between text-sm"
                              >
                                <span>{acc.name}</span>
                                <span>${acc.balance.toLocaleString()}</span>
                              </div>
                            )
                          )}
                          <div className="flex justify-between font-medium pt-2 border-t">
                            <span>TOTAL EQUITY</span>
                            <span>
                              ${balanceSheet.equity.total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between font-bold text-lg pt-4 border-t-2">
                        <span>TOTAL LIABILITIES & EQUITY</span>
                        <span>
                          $
                          {balanceSheet.totals.liabilitiesAndEquity.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Balance Check */}
                  <Card className={balanceSheet.totals.isBalanced ? "bg-green-50 dark:bg-green-900/10" : "bg-red-50 dark:bg-red-900/10"}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Balance Check:</span>
                        <span className={balanceSheet.totals.isBalanced ? "text-green-600" : "text-red-600"}>
                          {balanceSheet.totals.isBalanced
                            ? "✓ Balanced"
                            : "✗ Not Balanced"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Key Metrics */}
                  <div className="grid gap-4 md:grid-cols-3 pt-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Working Capital</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          ${balanceSheet.metrics.workingCapital.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Current Ratio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {balanceSheet.metrics.currentRatio.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Debt-to-Equity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {balanceSheet.metrics.debtToEquityRatio.toFixed(2)}
                        </div>
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
          <Card>
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
                  {/* Revenue */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">REVENUE</h3>
                    <div className="space-y-1 ml-4">
                      {profitLoss.revenue.operatingRevenue.accounts.map((acc: any) => (
                        <div key={acc.id} className="flex justify-between text-sm">
                          <span>{acc.name}</span>
                          <span>${acc.balance.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Total Revenue</span>
                        <span>${profitLoss.revenue.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">EXPENSES</h3>
                    <div className="space-y-1 ml-4">
                      {profitLoss.expenses.operatingExpenses.accounts.map((acc: any) => (
                        <div key={acc.id} className="flex justify-between text-sm">
                          <span>{acc.name}</span>
                          <span>${acc.balance.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Total Expenses</span>
                        <span>${profitLoss.expenses.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Income */}
                  <div className="flex justify-between font-bold text-xl pt-4 border-t-2">
                    <span>NET INCOME</span>
                    <span className={profitLoss.summary.netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                      ${profitLoss.summary.netIncome.toLocaleString()}
                    </span>
                  </div>

                  {/* Margins */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Gross Profit Margin</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {profitLoss.summary.grossProfitMargin.toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Operating Margin</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {profitLoss.summary.operatingMargin.toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Net Profit Margin</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {profitLoss.summary.netProfitMargin.toFixed(1)}%
                        </div>
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
          <Card>
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
                  <div className="space-y-4">
                    {["operating", "investing", "financing"].map((category) => (
                      <div key={category}>
                        <h3 className="font-semibold text-base mb-2 capitalize">
                          {category} Activities
                        </h3>
                        <div className="ml-4 text-sm">
                          <div className="flex justify-between font-medium">
                            <span>Net Cash Flow</span>
                            <span className={(cashFlow as any)[category].total >= 0 ? "text-green-600" : "text-red-600"}>
                              ${(cashFlow as any)[category].total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Opening Balance</span>
                      <span>${cashFlow.summary.openingBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Net Cash Flow</span>
                      <span className={cashFlow.summary.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}>
                        ${cashFlow.summary.netCashFlow.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-xl pt-2 border-t">
                      <span>Closing Balance</span>
                      <span>${cashFlow.summary.closingBalance.toLocaleString()}</span>
                    </div>
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
