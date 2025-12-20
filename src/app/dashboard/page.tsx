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
  Activity,
  AlertCircle,
  Wallet,
  CreditCard,
  FileText,
  BarChart3,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { selectedBusinessId } = useSelectedBusiness();
  const { data: overview, isLoading } = useGetAnalyticsOverview(selectedBusinessId || undefined);

  if (!selectedBusinessId) {
    return (
      <Alert variant="default" className="bg-card border-none shadow-md">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertTitle>No Business Selected</AlertTitle>
        <AlertDescription>
          Please select a business from the header or{" "}
          <Link href="/dashboard/business" className="font-medium underline text-primary">
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your financial performance
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-none shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cash Position</CardTitle>
            <div className="p-2 bg-cyan-500/10 rounded-full">
                <Wallet className="h-4 w-4 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${overview?.cash.current.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current cash and bank balances
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${overview?.revenue.monthly.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue for current month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Expenses
            </CardTitle>
            <div className="p-2 bg-red-500/10 rounded-full">
                <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${overview?.expenses.monthly.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Expenses for current month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-full">
                <Activity className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${overview?.netIncome.monthly.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Profit margin: <span className={cn((overview?.netIncome.margin || 0) >= 0 ? "text-green-500" : "text-red-500")}>{overview?.netIncome.margin.toFixed(1) || 0}%</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Working Capital
            </CardTitle>
            <CardDescription>
              Current assets minus current liabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold text-foreground">
                ${overview?.workingCapital.amount.toLocaleString() || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Current Ratio:{" "}
                <span className="font-medium text-foreground">{overview?.workingCapital.currentRatio.toFixed(2) || 0}</span>
              </p>
            </div>
            <div className="text-sm">
              {(overview?.workingCapital.currentRatio || 0) >= 2 ? (
                <div className="flex items-center gap-2 text-green-500 bg-green-500/10 p-2 rounded-lg w-fit">
                  <TrendingUp className="h-4 w-4" />
                  Strong liquidity position
                </div>
              ) : (overview?.workingCapital.currentRatio || 0) >= 1 ? (
                <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 p-2 rounded-lg w-fit">
                  <Activity className="h-4 w-4" />
                  Adequate liquidity
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-2 rounded-lg w-fit">
                  <TrendingDown className="h-4 w-4" />
                  Low liquidity - monitor closely
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Burn Rate & Runway
            </CardTitle>
            <CardDescription>Monthly cash consumption rate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold text-foreground">
                ${overview?.burnRate.monthly.toLocaleString() || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                per month average
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Cash Runway: </span>
              <span className={cn(
                  "font-bold px-2 py-1 rounded-md",
                  (overview?.burnRate.runway || 0) < 6 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
              )}>
                {overview?.burnRate.runway.toFixed(1) || 0} months
              </span>
            </div>
            {(overview?.burnRate.runway || 0) < 6 && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-200">
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
      <Card className="bg-card border-none shadow-lg">
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
          <CardDescription>Current month transaction activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">
                {overview?.transactionCount || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Total transactions this month
              </p>
            </div>
            <Link href="/dashboard/transactions">
              <Button className="gap-2 rounded-full">
                View All Transactions
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/dashboard/transactions">
          <Card className="bg-card border-none shadow-lg hover:shadow-xl hover:bg-accent/50 transition-all duration-200 cursor-pointer group">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 group-hover:text-primary transition-colors">
                <Plus className="h-5 w-5" />
                Add Transaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Record new income or expense
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/reports">
          <Card className="bg-card border-none shadow-lg hover:shadow-xl hover:bg-accent/50 transition-all duration-200 cursor-pointer group">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 group-hover:text-primary transition-colors">
                <FileText className="h-5 w-5" />
                View Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Balance sheet, P&L, cash flow
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/analytics">
          <Card className="bg-card border-none shadow-lg hover:shadow-xl hover:bg-accent/50 transition-all duration-200 cursor-pointer group">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 group-hover:text-primary transition-colors">
                <BarChart3 className="h-5 w-5" />
                Deep Analytics
              </CardTitle>
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
