import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Receipt, Book } from "lucide-react"

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Revenue",
      value: "$124,582.00",
      change: "+12.5%",
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "Total Expenses",
      value: "$42,391.00",
      change: "-3.2%",
      trend: "down",
      icon: Receipt,
    },
    {
      title: "Net Income",
      value: "$82,191.00",
      change: "+18.7%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Total Accounts",
      value: "24",
      change: "+2",
      trend: "up",
      icon: Book,
    },
  ]

  const recentTransactions = [
    {
      id: "1",
      description: "Office Supplies Purchase",
      amount: -245.5,
      type: "EXPENSE",
      date: "2024-01-15",
      category: "Operating Expense",
    },
    {
      id: "2",
      description: "Client Payment - Project A",
      amount: 15000.0,
      type: "INCOME",
      date: "2024-01-14",
      category: "Operating Revenue",
    },
    {
      id: "3",
      description: "Software Subscription",
      amount: -99.0,
      type: "EXPENSE",
      date: "2024-01-14",
      category: "Operating Expense",
    },
    {
      id: "4",
      description: "Consulting Services",
      amount: 5250.0,
      type: "INCOME",
      date: "2024-01-13",
      category: "Operating Revenue",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-semibold">
              FinanceOS
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-foreground">
                Dashboard
              </Link>
              <Link href="/transactions" className="text-sm text-muted-foreground hover:text-foreground">
                Transactions
              </Link>
              <Link href="/accounts" className="text-sm text-muted-foreground hover:text-foreground">
                Accounts
              </Link>
              <Link href="/categories" className="text-sm text-muted-foreground hover:text-foreground">
                Categories
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button size="sm">New Transaction</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your financial performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{stat.value}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-3 w-3 text-chart-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-chart-2" />
                    )}
                    <span className={`text-xs ${stat.trend === "up" ? "text-chart-1" : "text-chart-2"}`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground">from last month</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest financial activities</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions">
                View all
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <div className="font-medium">{transaction.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{transaction.date}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {transaction.category}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      transaction.type === "INCOME" ? "text-chart-1" : "text-foreground"
                    }`}
                  >
                    {transaction.amount > 0 ? "+" : ""}
                    {transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
