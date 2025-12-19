"use client";

import { useSelectedBusiness } from "@/components/providers/business-provider";
import { useGetAnalyticsOverview } from "@/hooks/use-analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { selectedBusinessId } = useSelectedBusiness();
  const { data: overview, isLoading } = useGetAnalyticsOverview(selectedBusinessId || undefined);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your financial performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Position</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${overview?.cash.current.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Current cash and bank balances
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${overview?.revenue.monthly.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue for current month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${overview?.expenses.monthly.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Expenses for current month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${overview?.netIncome.monthly.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Profit margin: {overview?.netIncome.margin.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Working Capital</CardTitle>
            <CardDescription>
              Current assets minus current liabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">
                ${overview?.workingCapital.amount.toLocaleString() || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Current Ratio:{" "}
                {overview?.workingCapital.currentRatio.toFixed(2) || 0}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {(overview?.workingCapital.currentRatio || 0) >= 2 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  Strong liquidity position
                </div>
              ) : (overview?.workingCapital.currentRatio || 0) >= 1 ? (
                <div className="flex items-center gap-2 text-yellow-600">
                  <Activity className="h-4 w-4" />
                  Adequate liquidity
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-4 w-4" />
                  Low liquidity - monitor closely
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Burn Rate & Runway</CardTitle>
            <CardDescription>Monthly cash consumption rate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">
                ${overview?.burnRate.monthly.toLocaleString() || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                per month average
              </p>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Cash Runway: </span>
              <span className="font-semibold">
                {overview?.burnRate.runway.toFixed(1) || 0} months
              </span>
            </div>
            {(overview?.burnRate.runway || 0) < 6 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Low runway warning. Consider reducing expenses or increasing
                  revenue.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
          <CardDescription>Current month transaction activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {overview?.transactionCount || 0}
              </div>
              <p className="text-sm text-muted-foreground">
                Total transactions this month
              </p>
            </div>
            <Link href="/dashboard/transactions">
              <Button>View All Transactions</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/transactions">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">Add Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Record new income or expense
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/reports">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">View Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Balance sheet, P&L, cash flow
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/analytics">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">Deep Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Trends, charts, and insights
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
