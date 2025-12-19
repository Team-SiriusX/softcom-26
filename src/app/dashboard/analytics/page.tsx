"use client";

import { useState, useMemo } from "react";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import {
  useGetAnalyticsOverview,
  useGetRevenueTrends,
  useGetExpenseBreakdown,
  useGetProfitLoss,
  useGetCashFlow,
  useGetTopExpenses,
  useGetAnalyticsDebug,
} from "@/hooks/use-analytics";
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
  Calendar,
  PieChart,
  BarChart3,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export default function AnalyticsPage() {
  const { selectedBusinessId } = useSelectedBusiness();
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1), // Start of year
    to: new Date(),
  });

  const startDate = dateRange.from.toISOString();
  const endDate = dateRange.to.toISOString();

  const { data: overview, isLoading: overviewLoading } =
    useGetAnalyticsOverview(selectedBusinessId || undefined);
  const { data: revenueTrends, isLoading: trendsLoading } =
    useGetRevenueTrends(selectedBusinessId || undefined, 12);
  const { data: expenseBreakdown, isLoading: expenseLoading } =
    useGetExpenseBreakdown(
      selectedBusinessId || undefined,
      startDate,
      endDate
    );
  const { data: profitLoss, isLoading: plLoading } = useGetProfitLoss(
    selectedBusinessId || undefined,
    startDate,
    endDate
  );
  const { data: cashFlow, isLoading: cashFlowLoading } = useGetCashFlow(
    selectedBusinessId || undefined,
    startDate,
    endDate
  );
  const { data: topExpenses } = useGetTopExpenses(
    selectedBusinessId || undefined,
    startDate,
    endDate,
    10
  );
  const { data: debugInfo } = useGetAnalyticsDebug(
    selectedBusinessId || undefined
  );

  // Format revenue trends data for chart
  const revenueChartData = useMemo(() => {
    if (!revenueTrends) return [];
    return revenueTrends.map((trend: any) => ({
      month: format(new Date(trend.month + "-01"), "MMM yyyy"),
      revenue: trend.revenue,
      count: trend.count,
    }));
  }, [revenueTrends]);

  // Format expense breakdown for pie chart
  const expensePieData = useMemo(() => {
    if (!expenseBreakdown?.categories) return [];
    return expenseBreakdown.categories.map((cat: any, index: number) => ({
      name: cat.name,
      value: cat.total,
      count: cat.count,
      color: cat.color || COLORS[index % COLORS.length],
    }));
  }, [expenseBreakdown]);

  // Format P&L data for chart
  const plChartData = useMemo(() => {
    if (!profitLoss) return [];
    return [
      {
        category: "Revenue",
        amount: profitLoss.revenue.total,
        type: "income",
      },
      {
        category: "Expenses",
        amount: profitLoss.expenses.total,
        type: "expense",
      },
      {
        category: "Net Income",
        amount: profitLoss.netIncome,
        type: profitLoss.netIncome >= 0 ? "income" : "expense",
      },
    ];
  }, [profitLoss]);

  // Format cash flow data for chart
  const cashFlowChartData = useMemo(() => {
    if (!cashFlow) return [];
    return [
      {
        category: "Operating",
        inflows: cashFlow.operating.inflows,
        outflows: -cashFlow.operating.outflows,
        net: cashFlow.operating.net,
      },
      {
        category: "Investing",
        inflows: cashFlow.investing.inflows,
        outflows: -cashFlow.investing.outflows,
        net: cashFlow.investing.net,
      },
      {
        category: "Financing",
        inflows: cashFlow.financing.inflows,
        outflows: -cashFlow.financing.outflows,
        net: cashFlow.financing.net,
      },
    ];
  }, [cashFlow]);

  if (!selectedBusinessId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Business Selected</AlertTitle>
        <AlertDescription>
          Please select a business from the header or create a new one.
        </AlertDescription>
      </Alert>
    );
  }

  const isLoading =
    overviewLoading ||
    trendsLoading ||
    expenseLoading ||
    plLoading ||
    cashFlowLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive financial insights and trends
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    setDateRange({
                      from: new Date(new Date().getFullYear(), 0, 1),
                      to: new Date(),
                    })
                  }
                >
                  Year to Date
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const now = new Date();
                    setDateRange({
                      from: new Date(now.getFullYear(), now.getMonth(), 1),
                      to: now,
                    });
                  }}
                >
                  This Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const now = new Date();
                    const lastMonth = new Date(
                      now.getFullYear(),
                      now.getMonth() - 1,
                      1
                    );
                    const lastMonthEnd = new Date(
                      now.getFullYear(),
                      now.getMonth(),
                      0
                    );
                    setDateRange({
                      from: lastMonth,
                      to: lastMonthEnd,
                    });
                  }}
                >
                  Last Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const now = new Date();
                    const threeMonthsAgo = new Date(
                      now.getFullYear(),
                      now.getMonth() - 3,
                      1
                    );
                    setDateRange({
                      from: threeMonthsAgo,
                      to: now,
                    });
                  }}
                >
                  Last 3 Months
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          {/* Debug Info Card - Remove this after verifying data */}
          {debugInfo && (
            <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <CardHeader>
                <CardTitle className="text-sm">Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <p>
                    <strong>Transactions:</strong> {debugInfo.counts.transactions}
                  </p>
                  <p>
                    <strong>Journal Entries:</strong>{" "}
                    {debugInfo.counts.journalEntries}
                  </p>
                  <p>
                    <strong>Ledger Accounts:</strong>{" "}
                    {debugInfo.counts.ledgerAccounts} (Revenue:{" "}
                    {debugInfo.counts.revenueAccounts}, Expense:{" "}
                    {debugInfo.counts.expenseAccounts}, Asset:{" "}
                    {debugInfo.counts.assetAccounts})
                  </p>
                  {debugInfo.counts.transactions === 0 && (
                    <p className="text-red-600 font-semibold">
                      ⚠️ No transactions found. Please create some transactions
                      first.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Cash Position
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(overview?.cash.current ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {overview?.cash.change !== undefined && overview.cash.change !== 0
                    ? `${overview.cash.change > 0 ? "+" : ""}${overview.cash.change.toFixed(1)}% vs last month`
                    : "Current cash balance"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Burn Rate
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(overview?.burnRate.monthly ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {overview?.burnRate.runway 
                    ? `Runway: ${overview.burnRate.runway.toFixed(1)} months`
                    : "No burn rate calculated"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Revenue Growth
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview?.revenue.change !== undefined 
                    ? `${overview.revenue.change > 0 ? "+" : ""}${overview.revenue.change.toFixed(1)}%`
                    : "0%"}
                </div>
                <p className="text-xs text-muted-foreground">
                  vs. previous period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Net Margin
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview?.netIncome.margin !== undefined
                    ? `${overview.netIncome.margin.toFixed(1)}%`
                    : "0%"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Profit margin
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Expense Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Top Expense Categories</CardTitle>
              <CardDescription>
                Highest spending categories in selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topExpenses?.slice(0, 5).map((expense: any, index: number) => {
                  const maxTotal = Math.max(
                    ...topExpenses.map((e: any) => e.total)
                  );
                  const percentage = (expense.total / maxTotal) * 100;

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {expense.name}
                        </span>
                        <span className="text-sm font-bold">
                          ${expense.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <Tabs defaultValue="revenue" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
              <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
              <TabsTrigger value="pl">P&L Statement</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            </TabsList>

            {/* Revenue Trend Chart */}
            <TabsContent value="revenue" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                  <CardDescription>
                    Monthly revenue over the last 12 months
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData}>
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) =>
                          `$${(value / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        formatter={(value: any) => [
                          `$${value.toLocaleString()}`,
                          "Revenue",
                        ]}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Revenue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expense Breakdown Pie Chart */}
            <TabsContent value="expenses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown by Category</CardTitle>
                  <CardDescription>
                    Distribution of expenses across categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => `$${value.toLocaleString()}`}
                      />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Detailed Expense List */}
              <Card>
                <CardHeader>
                  <CardTitle>Expense Details</CardTitle>
                  <CardDescription>
                    Complete breakdown with transaction counts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {expenseBreakdown?.categories.map(
                      (cat: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between border-b pb-3 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{
                                backgroundColor:
                                  cat.color || COLORS[index % COLORS.length],
                              }}
                            />
                            <div>
                              <p className="font-medium">{cat.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {cat.count} transactions
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              ${cat.total.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {expenseBreakdown.total > 0
                                ? (
                                    (cat.total / expenseBreakdown.total) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              %
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* P&L Statement Chart */}
            <TabsContent value="pl" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profit & Loss Statement</CardTitle>
                  <CardDescription>
                    Revenue, expenses, and net income for selected period
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={plChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis
                        tickFormatter={(value) =>
                          `$${(value / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        formatter={(value: any) => `$${value.toLocaleString()}`}
                      />
                      <Legend />
                      <Bar dataKey="amount" name="Amount">
                        {plChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.type === "income" ? "#10b981" : "#ef4444"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Detailed P&L */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {profitLoss?.revenue.accounts.map((account: any) => (
                        <div
                          key={account.id}
                          className="flex justify-between items-center"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {account.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {account.code}
                            </p>
                          </div>
                          <p className="font-bold text-green-600">
                            ${account.amount.toLocaleString()}
                          </p>
                        </div>
                      ))}
                      <div className="border-t pt-3 flex justify-between items-center">
                        <p className="font-bold">Total Revenue</p>
                        <p className="font-bold text-lg text-green-600">
                          ${profitLoss?.revenue.total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expense Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {profitLoss?.expenses.accounts.map((account: any) => (
                        <div
                          key={account.id}
                          className="flex justify-between items-center"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {account.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {account.code}
                            </p>
                          </div>
                          <p className="font-bold text-red-600">
                            ${account.amount.toLocaleString()}
                          </p>
                        </div>
                      ))}
                      <div className="border-t pt-3 flex justify-between items-center">
                        <p className="font-bold">Total Expenses</p>
                        <p className="font-bold text-lg text-red-600">
                          ${profitLoss?.expenses.total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Net Income Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Net Income Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-lg">
                      <span>Net Income</span>
                      <span
                        className={cn(
                          "font-bold text-2xl",
                          (profitLoss?.netIncome || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        ${profitLoss?.netIncome.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Net Profit Margin
                      </span>
                      <span className="font-bold">
                        {profitLoss?.netMargin.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cash Flow Chart */}
            <TabsContent value="cashflow" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cash Flow Analysis</CardTitle>
                  <CardDescription>
                    Operating, investing, and financing activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis
                        tickFormatter={(value) =>
                          `$${(value / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        formatter={(value: any) => `$${value.toLocaleString()}`}
                      />
                      <Legend />
                      <Bar dataKey="inflows" fill="#10b981" name="Inflows" />
                      <Bar dataKey="outflows" fill="#ef4444" name="Outflows" />
                      <Bar dataKey="net" fill="#3b82f6" name="Net Cash Flow" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Cash Flow Details */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Operating Activities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Inflows</span>
                      <span className="text-green-600 font-medium">
                        ${cashFlow?.operating.inflows.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Outflows</span>
                      <span className="text-red-600 font-medium">
                        ${cashFlow?.operating.outflows.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-bold">Net</span>
                      <span
                        className={cn(
                          "font-bold",
                          (cashFlow?.operating.net || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        ${cashFlow?.operating.net.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Investing Activities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Inflows</span>
                      <span className="text-green-600 font-medium">
                        ${cashFlow?.investing.inflows.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Outflows</span>
                      <span className="text-red-600 font-medium">
                        ${cashFlow?.investing.outflows.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-bold">Net</span>
                      <span
                        className={cn(
                          "font-bold",
                          (cashFlow?.investing.net || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        ${cashFlow?.investing.net.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Financing Activities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Inflows</span>
                      <span className="text-green-600 font-medium">
                        ${cashFlow?.financing.inflows.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Outflows</span>
                      <span className="text-red-600 font-medium">
                        ${cashFlow?.financing.outflows.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-bold">Net</span>
                      <span
                        className={cn(
                          "font-bold",
                          (cashFlow?.financing.net || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        ${cashFlow?.financing.net.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cash Position Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Cash Position Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Cash at Start
                      </span>
                      <span className="font-bold">
                        ${cashFlow?.cashAtStart.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Net Cash Flow
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          (cashFlow?.netCashFlow || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        ${cashFlow?.netCashFlow.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-bold text-lg">Cash at End</span>
                      <span className="font-bold text-2xl text-blue-600">
                        ${cashFlow?.cashAtEnd.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
