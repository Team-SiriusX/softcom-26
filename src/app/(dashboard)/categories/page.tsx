"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, MoreVertical } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function CategoriesPage() {
  const categories = [
    {
      id: "1",
      name: "Operating Revenue",
      type: "INCOME",
      color: "#10b981",
      transactionCount: 24,
      isActive: true,
    },
    {
      id: "2",
      name: "Other Revenue",
      type: "INCOME",
      color: "#3b82f6",
      transactionCount: 5,
      isActive: true,
    },
    {
      id: "3",
      name: "Operating Expense",
      type: "EXPENSE",
      color: "#ef4444",
      transactionCount: 45,
      isActive: true,
    },
    {
      id: "4",
      name: "Cost of Goods Sold",
      type: "EXPENSE",
      color: "#f59e0b",
      transactionCount: 12,
      isActive: true,
    },
    {
      id: "5",
      name: "Marketing",
      type: "EXPENSE",
      color: "#8b5cf6",
      transactionCount: 8,
      isActive: true,
    },
    {
      id: "6",
      name: "Bank Transfer",
      type: "TRANSFER",
      color: "#6366f1",
      transactionCount: 3,
      isActive: true,
    },
  ]

  const groupedCategories = {
    INCOME: categories.filter((c) => c.type === "INCOME"),
    EXPENSE: categories.filter((c) => c.type === "EXPENSE"),
    TRANSFER: categories.filter((c) => c.type === "TRANSFER"),
  }

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
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/transactions" className="text-sm text-muted-foreground hover:text-foreground">
                Transactions
              </Link>
              <Link href="/accounts" className="text-sm text-muted-foreground hover:text-foreground">
                Accounts
              </Link>
              <Link href="/categories" className="text-sm font-medium text-foreground">
                Categories
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
            <p className="text-sm text-muted-foreground mt-1">Organize transactions by category</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        </div>

        {/* Category Groups */}
        <div className="space-y-6">
          {/* Income Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Income Categories
                <Badge variant="outline">{groupedCategories.INCOME.length}</Badge>
              </CardTitle>
              <CardDescription>Categories for tracking revenue and income</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedCategories.INCOME.map((category) => (
                  <div
                    key={category.id}
                    className="border border-border rounded-lg p-4 hover:border-foreground/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-8 w-8 rounded-md" style={{ backgroundColor: category.color }} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="font-medium mb-1">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">{category.transactionCount} transactions</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Expense Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Expense Categories
                <Badge variant="outline">{groupedCategories.EXPENSE.length}</Badge>
              </CardTitle>
              <CardDescription>Categories for tracking costs and expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedCategories.EXPENSE.map((category) => (
                  <div
                    key={category.id}
                    className="border border-border rounded-lg p-4 hover:border-foreground/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-8 w-8 rounded-md" style={{ backgroundColor: category.color }} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="font-medium mb-1">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">{category.transactionCount} transactions</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transfer Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Transfer Categories
                <Badge variant="outline">{groupedCategories.TRANSFER.length}</Badge>
              </CardTitle>
              <CardDescription>Categories for tracking internal transfers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedCategories.TRANSFER.map((category) => (
                  <div
                    key={category.id}
                    className="border border-border rounded-lg p-4 hover:border-foreground/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-8 w-8 rounded-md" style={{ backgroundColor: category.color }} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="font-medium mb-1">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">{category.transactionCount} transactions</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
