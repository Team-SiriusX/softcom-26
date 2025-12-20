"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import {
  useGetAnalyticsOverview,
  useGetRevenueTrends,
  useGetExpenseBreakdown,
  useGetProfitLoss,
  useGetCashFlow,
  useGetTopExpenses,
  useGetAccountBalanceHistory,
} from "@/hooks/use-analytics";
import { useGetLedgerAccounts } from "@/hooks/use-ledger-accounts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  BadgeDollarSign,
  ShieldCheck,
  AlertTriangle,
  LineChart as LineChartIcon,
  BarChart3,
  PieChart,
  Layers,
  Activity,
  Landmark,
  Sparkles,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, startOfYear, subDays, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart as RePieChart,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DateRange } from "react-day-picker";

const COLORS = [
  "#22D3EE",
  "#A78BFA",
  "#34D399",
  "#FBBF24",
  "#FB7185",
  "#60A5FA",
  "#F97316",
  "#14B8A6",
];

const moneyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function clampNumber(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function safePct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return n;
}

export default function AnalyticsPage() {
  const { selectedBusinessId } = useSelectedBusiness();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: new Date(),
  });

  const startDate = dateRange?.from ? dateRange.from.toISOString() : undefined;
  const endDate = dateRange?.to
    ? endOfDay(dateRange.to).toISOString()
    : dateRange?.from
      ? endOfDay(dateRange.from).toISOString()
      : undefined;

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

  const { data: ledgerAccounts, isLoading: accountsLoading } =
    useGetLedgerAccounts(selectedBusinessId || undefined, { isActive: true });

  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<
    string | undefined
  >(undefined);
  const [balanceInterval, setBalanceInterval] = useState<
    "daily" | "weekly" | "monthly"
  >("monthly");

  useEffect(() => {
    if (selectedLedgerAccountId) return;
    const first = (ledgerAccounts || []).find((a: any) => a?.id);
    if (first?.id) setSelectedLedgerAccountId(first.id);
  }, [ledgerAccounts, selectedLedgerAccountId]);

  const { data: balanceHistory, isLoading: historyLoading } =
    useGetAccountBalanceHistory(
      selectedBusinessId || undefined,
      selectedLedgerAccountId,
      startDate,
      endDate,
      balanceInterval
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

  const revenueGrowthData = useMemo(() => {
    if (!revenueChartData.length) return [];
    return revenueChartData.map((row: any, idx: number) => {
      const prev = revenueChartData[idx - 1]?.revenue ?? null;
      const pct = prev && prev > 0 ? ((row.revenue - prev) / prev) * 100 : 0;
      return {
        month: row.month,
        growth: safePct(pct),
      };
    });
  }, [revenueChartData]);

  // Format expense breakdown for pie chart
  const expensePieData = useMemo(() => {
    if (!expenseBreakdown?.categories) return [];
    return expenseBreakdown.categories.map((cat: any, index: number) => ({
      name: cat.name,
      value: cat.total,
      count: cat.count,
      color: cat.color || COLORS[index % COLORS.length],
      icon: cat.icon,
    }));
  }, [expenseBreakdown]);

  const plChartData = useMemo(() => {
    if (!profitLoss) return [];
    return [
      {
        name: "Revenue",
        amount: profitLoss.revenue.total,
        fill: "#34D399",
      },
      {
        name: "Expenses",
        amount: profitLoss.expenses.total,
        fill: "#FB7185",
      },
      {
        name: "Net Income",
        amount: profitLoss.netIncome,
        fill: profitLoss.netIncome >= 0 ? "#22D3EE" : "#FB7185",
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

  const cashBridgeData = useMemo(() => {
    if (!cashFlow) return [];
    return [
      { label: "Start", value: cashFlow.cashAtStart, kind: "neutral" },
      { label: "Operating", value: cashFlow.operating.net, kind: "delta" },
      { label: "Investing", value: cashFlow.investing.net, kind: "delta" },
      { label: "Financing", value: cashFlow.financing.net, kind: "delta" },
      { label: "End", value: cashFlow.cashAtEnd, kind: "neutral" },
    ];
  }, [cashFlow]);

  const balanceChartData = useMemo(() => {
    const history = balanceHistory?.history;
    if (!Array.isArray(history)) return [];
    return history.map((h: any) => ({
      date: format(new Date(h.date), "MMM d"),
      balance: Number(h.balance ?? 0),
      debit: Number(h.debit ?? 0),
      credit: Number(h.credit ?? 0),
    }));
  }, [balanceHistory]);

  const insights = useMemo(() => {
    const items: Array<{
      tone: "good" | "warn" | "bad";
      title: string;
      detail: string;
    }> = [];

    const runway = overview?.burnRate?.runway ?? 0;
    const netMargin = overview?.netIncome?.margin ?? 0;
    const cashChange = overview?.cash?.change ?? 0;

    if (runway > 0 && runway < 6) {
      items.push({
        tone: "bad",
        title: "Runway is tight",
        detail: `${runway.toFixed(1)} months at current burn.`,
      });
    } else if (runway >= 6 && runway < 12) {
      items.push({
        tone: "warn",
        title: "Runway is moderate",
        detail: `${runway.toFixed(1)} months — keep an eye on burn.`,
      });
    } else if (runway >= 12) {
      items.push({
        tone: "good",
        title: "Healthy runway",
        detail: `${runway.toFixed(1)} months of runway.`,
      });
    }

    if (netMargin < 0) {
      items.push({
        tone: "bad",
        title: "Negative margin",
        detail: `Net margin ${netMargin.toFixed(1)}% — expenses exceed revenue.`,
      });
    } else if (netMargin >= 0 && netMargin < 10) {
      items.push({
        tone: "warn",
        title: "Thin margin",
        detail: `Net margin ${netMargin.toFixed(1)}% — optimize costs and pricing.`,
      });
    } else if (netMargin >= 10) {
      items.push({
        tone: "good",
        title: "Strong margin",
        detail: `Net margin ${netMargin.toFixed(1)}% — great efficiency.`,
      });
    }

    if (Math.abs(cashChange) >= 10) {
      items.push({
        tone: cashChange > 0 ? "good" : "warn",
        title: cashChange > 0 ? "Cash accelerating" : "Cash down" ,
        detail: `${cashChange > 0 ? "+" : ""}${cashChange.toFixed(1)}% vs last month.`,
      });
    }

    const top = (expensePieData || []).slice(0, 1)[0];
    const totalExpense = expenseBreakdown?.total ?? 0;
    if (top && totalExpense > 0) {
      const share = (top.value / totalExpense) * 100;
      if (share >= 45) {
        items.push({
          tone: "warn",
          title: "Spend is concentrated",
          detail: `${top.name} is ${share.toFixed(0)}% of expenses.`,
        });
      }
    }

    return items.slice(0, 4);
  }, [overview, expensePieData, expenseBreakdown]);

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

  const kpi = {
    cash: Number(overview?.cash?.current ?? 0),
    cashChange: Number(overview?.cash?.change ?? 0),
    revenue: Number(overview?.revenue?.monthly ?? 0),
    revenueChange: Number(overview?.revenue?.change ?? 0),
    expenses: Number(overview?.expenses?.monthly ?? 0),
    expensesChange: Number(overview?.expenses?.change ?? 0),
    netIncome: Number(overview?.netIncome?.monthly ?? 0),
    netMargin: Number(overview?.netIncome?.margin ?? 0),
    burn: Number(overview?.burnRate?.monthly ?? 0),
    runway: Number(overview?.burnRate?.runway ?? 0),
    wc: Number(overview?.workingCapital?.amount ?? 0),
    currentRatio: Number(overview?.workingCapital?.currentRatio ?? 0),
    txCount: Number(overview?.transactionCount ?? 0),
  };

  const revenueConfig = {
    revenue: { label: "Revenue", color: "#22D3EE" },
    count: { label: "Entries", color: "#A78BFA" },
  } satisfies ChartConfig;

  const growthConfig = {
    growth: { label: "MoM Growth %", color: "#22D3EE" },
  } satisfies ChartConfig;

  const cashflowConfig = {
    inflows: { label: "Inflows", color: "#34D399" },
    outflows: { label: "Outflows", color: "#FB7185" },
    net: { label: "Net", color: "#22D3EE" },
  } satisfies ChartConfig;

  const balanceConfig = {
    balance: { label: "Balance", color: "#22D3EE" },
    debit: { label: "Debit", color: "#34D399" },
    credit: { label: "Credit", color: "#FB7185" },
  } satisfies ChartConfig;

  const isEmptyData =
    (revenueChartData?.length ?? 0) === 0 &&
    !expenseBreakdown?.categories?.length &&
    !profitLoss &&
    !cashFlow;

  return (
    <div className="space-y-8">
      <Card className="border-border/60 bg-gradient-to-br from-[#22D3EE]/10 via-background to-background shadow-sm">
        <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-3xl tracking-tight">Analytics</CardTitle>
            <CardDescription>
              High-signal insights, trends, and cash mechanics — all in one place.
            </CardDescription>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() =>
                  setDateRange({
                    from: subDays(new Date(), 30),
                    to: new Date(),
                  })
                }
              >
                30d
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() =>
                  setDateRange({
                    from: subDays(new Date(), 90),
                    to: new Date(),
                  })
                }
              >
                90d
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() =>
                  setDateRange({
                    from: startOfYear(new Date()),
                    to: new Date(),
                  })
                }
              >
                YTD
              </Button>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 justify-start rounded-full text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} –{" "}
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
              <PopoverContent align="end" className="w-auto p-0">
                <CalendarComponent
                  mode="range"
                  numberOfMonths={2}
                  selected={dateRange}
                  onSelect={setDateRange}
                  defaultMonth={dateRange?.from}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[220px] items-center justify-center">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cash</CardTitle>
                  <div className="rounded-full bg-[#22D3EE]/15 p-2">
                    <Wallet className="h-4 w-4 text-[#22D3EE]" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-semibold tabular-nums">
                    {moneyFormatter.format(kpi.cash)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {kpi.cashChange !== 0 ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1",
                          kpi.cashChange > 0 ? "text-emerald-600" : "text-amber-600"
                        )}
                      >
                        {kpi.cashChange > 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {kpi.cashChange > 0 ? "+" : ""}
                        {kpi.cashChange.toFixed(1)}%
                      </span>
                    ) : (
                      <span>vs last month</span>
                    )}
                    <span>•</span>
                    <span>Current position</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <div className="rounded-full bg-emerald-500/15 p-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-semibold tabular-nums">
                    {moneyFormatter.format(kpi.revenue)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        kpi.revenueChange >= 0 ? "text-emerald-600" : "text-amber-600"
                      )}
                    >
                      {kpi.revenueChange >= 0 ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      {kpi.revenueChange > 0 ? "+" : ""}
                      {kpi.revenueChange.toFixed(1)}%
                    </span>
                    <span>•</span>
                    <span>Monthly</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                  <div className="rounded-full bg-rose-500/15 p-2">
                    <TrendingDown className="h-4 w-4 text-rose-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-semibold tabular-nums">
                    {moneyFormatter.format(kpi.expenses)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        kpi.expensesChange <= 0 ? "text-emerald-600" : "text-amber-600"
                      )}
                    >
                      {kpi.expensesChange <= 0 ? (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      )}
                      {kpi.expensesChange > 0 ? "+" : ""}
                      {kpi.expensesChange.toFixed(1)}%
                    </span>
                    <span>•</span>
                    <span>Monthly</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Margin</CardTitle>
                  <div className="rounded-full bg-indigo-500/15 p-2">
                    <BadgeDollarSign className="h-4 w-4 text-indigo-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-semibold tabular-nums">
                    {kpi.netMargin.toFixed(1)}%
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "font-medium",
                        kpi.netIncome >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}
                    >
                      {moneyFormatter.format(kpi.netIncome)}
                    </span>
                    <span>•</span>
                    <span>Net income</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && isEmptyData ? (
        <Alert className="border-border/60 bg-card">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle>No analytics yet</AlertTitle>
          <AlertDescription>
            Add a few transactions and we’ll unlock revenue trends, spending mix,
            profitability, and cash flow insights.
          </AlertDescription>
        </Alert>
      ) : null}

      {!isLoading ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl bg-muted/40 p-2 md:grid-cols-5">
            <TabsTrigger value="overview" className="rounded-xl">
              Overview
            </TabsTrigger>
            <TabsTrigger value="revenue" className="rounded-xl">
              Revenue
            </TabsTrigger>
            <TabsTrigger value="spending" className="rounded-xl">
              Spending
            </TabsTrigger>
            <TabsTrigger value="cash" className="rounded-xl">
              Cash Flow
            </TabsTrigger>
            <TabsTrigger value="accounts" className="rounded-xl">
              Accounts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="border-border/60 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5 text-primary" />
                    Revenue velocity
                  </CardTitle>
                  <CardDescription>
                    Revenue and posting activity (last 12 months)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={revenueConfig} className="h-[340px] w-full">
                    <ComposedChart data={revenueChartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} interval={2} />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                      />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => {
                              if (name === "revenue") {
                                return (
                                  <div className="flex w-full items-center justify-between gap-6">
                                    <span className="text-muted-foreground">Revenue</span>
                                    <span className="font-mono font-medium tabular-nums">
                                      {moneyFormatter.format(Number(value))}
                                    </span>
                                  </div>
                                );
                              }

                              if (name === "count") {
                                return (
                                  <div className="flex w-full items-center justify-between gap-6">
                                    <span className="text-muted-foreground">Entries</span>
                                    <span className="font-mono font-medium tabular-nums">
                                      {Number(value).toLocaleString()}
                                    </span>
                                  </div>
                                );
                              }

                              return null;
                            }}
                          />
                        }
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar
                        yAxisId="left"
                        dataKey="revenue"
                        fill="var(--color-revenue)"
                        radius={[10, 10, 10, 10]}
                        name="revenue"
                        opacity={0.9}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="count"
                        stroke="var(--color-count)"
                        strokeWidth={2.5}
                        dot={false}
                        name="count"
                      />
                    </ComposedChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Executive Insights
                  </CardTitle>
                  <CardDescription>Key signals worth paying attention to</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights.length ? (
                    insights.map((ins) => (
                      <div
                        key={ins.title}
                        className={cn(
                          "rounded-2xl border border-border/60 p-3",
                          ins.tone === "good" && "bg-emerald-500/5",
                          ins.tone === "warn" && "bg-amber-500/5",
                          ins.tone === "bad" && "bg-rose-500/5"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{ins.title}</div>
                            <div className="text-xs text-muted-foreground">{ins.detail}</div>
                          </div>
                          {ins.tone === "good" ? (
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          ) : ins.tone === "bad" ? (
                            <AlertTriangle className="h-4 w-4 text-rose-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-border/60 p-4 text-sm text-muted-foreground">
                      Add more activity to unlock smarter insights.
                    </div>
                  )}

                  <div className="rounded-2xl border border-border/60 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current Ratio</span>
                      <span className="font-mono font-semibold tabular-nums">
                        {kpi.currentRatio.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Working capital: {moneyFormatter.format(kpi.wc)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Top Expense Categories
                  </CardTitle>
                  <CardDescription>Where your money is going</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(topExpenses || []).slice(0, 6).map((expense: any) => {
                    const maxTotal = Math.max(...(topExpenses || []).map((e: any) => e.total || 0), 1);
                    const pct = clampNumber((Number(expense.total || 0) / maxTotal) * 100, 0, 100);
                    return (
                      <div key={expense.name} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-sm font-medium">{expense.name}</div>
                          <div className="font-mono text-sm font-semibold tabular-nums">
                            {moneyFormatter.format(Number(expense.total || 0))}
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-[#22D3EE]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BadgeDollarSign className="h-5 w-5 text-primary" />
                    Profit & Loss Snapshot
                  </CardTitle>
                  <CardDescription>Selected period summary</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {plChartData.map((row: any) => (
                      <div key={row.name} className="rounded-2xl border border-border/60 p-3">
                        <div className="text-xs text-muted-foreground">{row.name}</div>
                        <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
                          {moneyFormatter.format(Number(row.amount || 0))}
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${clampNumber(
                                (Math.abs(Number(row.amount || 0)) / Math.max(kpi.revenue, 1)) * 100,
                                0,
                                100
                              )}%`,
                              backgroundColor: row.fill,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full">
                      Margin: {Number(profitLoss?.netMargin ?? 0).toFixed(2)}%
                    </Badge>
                    <Badge variant="outline" className="rounded-full">
                      Tx: {kpi.txCount.toLocaleString()}
                    </Badge>
                    <Badge variant="outline" className="rounded-full">
                      Runway: {kpi.runway ? `${kpi.runway.toFixed(1)} mo` : "—"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="border-border/60 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Revenue trend
                  </CardTitle>
                  <CardDescription>Smoothed revenue curve with fill</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={revenueConfig} className="h-[360px] w-full">
                    <AreaChart data={revenueChartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                      <defs>
                        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} interval={2} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => {
                              if (name === "revenue") {
                                return (
                                  <div className="flex w-full items-center justify-between gap-6">
                                    <span className="text-muted-foreground">Revenue</span>
                                    <span className="font-mono font-medium tabular-nums">
                                      {moneyFormatter.format(Number(value))}
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-revenue)"
                        strokeWidth={2.5}
                        fill="url(#revFill)"
                        dot={false}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Growth Momentum
                  </CardTitle>
                  <CardDescription>Month-over-month % change</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={growthConfig} className="h-[360px] w-full">
                    <AreaChart data={revenueGrowthData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                      <defs>
                        <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} interval={2} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v)}%`} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="growth"
                        stroke="var(--color-growth)"
                        fill="url(#growthFill)"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="spending" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="border-border/60 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Spending Distribution
                  </CardTitle>
                  <CardDescription>Category breakdown for the selected period</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-2">
                  <div className="h-[320px]">
                    <ChartContainer
                      config={{ value: { label: "Spend", color: "#22D3EE" } } satisfies ChartConfig}
                      className="h-[320px] w-full"
                    >
                      <RePieChart>
                        <Pie
                          data={expensePieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={70}
                          outerRadius={120}
                          paddingAngle={2}
                          stroke="transparent"
                        >
                          {expensePieData.map((entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              formatter={(value, name, item: any) => {
                                const label = item?.payload?.name || name;
                                return (
                                  <div className="flex w-full items-center justify-between gap-6">
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className="font-mono font-medium tabular-nums">
                                      {moneyFormatter.format(Number(value))}
                                    </span>
                                  </div>
                                );
                              }}
                            />
                          }
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                      </RePieChart>
                    </ChartContainer>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-border/60 p-3">
                      <div className="text-xs text-muted-foreground">Total expenses</div>
                      <div className="mt-1 text-2xl font-semibold tabular-nums">
                        {moneyFormatter.format(Number(expenseBreakdown?.total ?? 0))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(expensePieData || []).slice(0, 5).map((c: any) => (
                          <Badge key={c.name} variant="outline" className="rounded-full">
                            <span className="mr-1">{c.icon || "•"}</span>
                            {c.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 p-3">
                      <div className="text-xs text-muted-foreground">Concentration</div>
                      {expensePieData[0] && Number(expenseBreakdown?.total ?? 0) > 0 ? (
                        <div className="mt-1 text-sm">
                          <span className="font-medium">{expensePieData[0].name}</span> is{" "}
                          <span className="font-mono font-semibold tabular-nums">
                            {(
                              (Number(expensePieData[0].value || 0) / Number(expenseBreakdown?.total || 1)) *
                              100
                            ).toFixed(0)}
                            %
                          </span>
                          {" "}of spend.
                        </div>
                      ) : (
                        <div className="mt-1 text-sm text-muted-foreground">Not enough data.</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Top Categories
                  </CardTitle>
                  <CardDescription>Highest spend, ranked</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(expensePieData || []).slice(0, 8).map((cat: any, idx: number) => {
                    const total = Number(expenseBreakdown?.total ?? 0);
                    const pct = total > 0 ? (Number(cat.value || 0) / total) * 100 : 0;
                    return (
                      <div key={cat.name} className="rounded-2xl border border-border/60 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              <span className="mr-2">{cat.icon || "📊"}</span>
                              {cat.name}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {Number(cat.count || 0).toLocaleString()} tx • {pct.toFixed(1)}%
                            </div>
                          </div>
                          <div className="font-mono text-sm font-semibold tabular-nums">
                            {moneyFormatter.format(Number(cat.value || 0))}
                          </div>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${clampNumber(pct, 0, 100)}%`, backgroundColor: cat.color || COLORS[idx % COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cash" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="border-border/60 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    Cash flow mechanics
                  </CardTitle>
                  <CardDescription>Inflows, outflows, and net by activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={cashflowConfig} className="h-[360px] w-full">
                    <ComposedChart data={cashFlowChartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => {
                              const label =
                                name === "inflows" ? "Inflows" : name === "outflows" ? "Outflows" : "Net";
                              return (
                                <div className="flex w-full items-center justify-between gap-6">
                                  <span className="text-muted-foreground">{label}</span>
                                  <span className="font-mono font-medium tabular-nums">
                                    {moneyFormatter.format(Number(value))}
                                  </span>
                                </div>
                              );
                            }}
                          />
                        }
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="inflows" fill="var(--color-inflows)" radius={[10, 10, 0, 0]} />
                      <Bar dataKey="outflows" fill="var(--color-outflows)" radius={[10, 10, 0, 0]} />
                      <Line dataKey="net" stroke="var(--color-net)" strokeWidth={2.5} dot={false} />
                    </ComposedChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-primary" />
                    Cash Bridge
                  </CardTitle>
                  <CardDescription>Start → changes → end</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cashBridgeData.map((r: any) => (
                    <div key={r.label} className="flex items-center justify-between rounded-2xl border border-border/60 p-3">
                      <div className="text-sm font-medium">{r.label}</div>
                      <div
                        className={cn(
                          "font-mono text-sm font-semibold tabular-nums",
                          r.kind === "delta" && Number(r.value || 0) >= 0 && "text-emerald-600",
                          r.kind === "delta" && Number(r.value || 0) < 0 && "text-rose-600"
                        )}
                      >
                        {r.kind === "delta" ? (Number(r.value || 0) > 0 ? "+" : "") : ""}
                        {moneyFormatter.format(Number(r.value || 0))}
                      </div>
                    </div>
                  ))}

                  <div className="rounded-2xl border border-border/60 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Runway (est.)</div>
                      <div className="font-mono text-sm font-semibold tabular-nums">
                        {kpi.runway ? `${kpi.runway.toFixed(1)} mo` : "—"}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Burn: {moneyFormatter.format(kpi.burn)} / month
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5 text-primary" />
                    Account Balance History
                  </CardTitle>
                  <CardDescription>
                    Select an account to visualize balance movement over time
                  </CardDescription>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select
                    value={selectedLedgerAccountId}
                    onValueChange={(v) => setSelectedLedgerAccountId(v)}
                  >
                    <SelectTrigger className="h-10 w-full rounded-full sm:w-[320px]">
                      <SelectValue placeholder={accountsLoading ? "Loading accounts…" : "Select an account"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {(ledgerAccounts || []).map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.code ? `${a.code} · ` : ""}{a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={balanceInterval}
                    onValueChange={(v) => setBalanceInterval(v as any)}
                  >
                    <SelectTrigger className="h-10 w-full rounded-full sm:w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex h-[360px] items-center justify-center">
                    <Spinner className="h-8 w-8" />
                  </div>
                ) : balanceChartData.length ? (
                  <ChartContainer config={balanceConfig} className="h-[360px] w-full">
                    <ComposedChart data={balanceChartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => {
                              const label = name === "balance" ? "Balance" : name === "debit" ? "Debit" : "Credit";
                              return (
                                <div className="flex w-full items-center justify-between gap-6">
                                  <span className="text-muted-foreground">{label}</span>
                                  <span className="font-mono font-medium tabular-nums">
                                    {moneyFormatter.format(Number(value))}
                                  </span>
                                </div>
                              );
                            }}
                          />
                        }
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="var(--color-balance)"
                        fill="var(--color-balance)"
                        fillOpacity={0.12}
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Bar dataKey="debit" fill="var(--color-debit)" radius={[10, 10, 0, 0]} opacity={0.55} />
                      <Bar dataKey="credit" fill="var(--color-credit)" radius={[10, 10, 0, 0]} opacity={0.55} />
                    </ComposedChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-[240px] flex-col items-center justify-center rounded-2xl border border-border/60 bg-muted/20 text-center">
                    <LineChartIcon className="h-6 w-6 text-muted-foreground" />
                    <div className="mt-3 text-sm font-medium">No history in this range</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Try a wider date range or select a different account.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}
