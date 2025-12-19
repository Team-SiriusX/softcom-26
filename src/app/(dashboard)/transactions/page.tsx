"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  const transactions = [
    {
      id: "1",
      date: "2024-01-15",
      description: "Office Supplies Purchase",
      amount: -245.5,
      type: "EXPENSE",
      category: "Operating Expense",
      account: "Cash",
      referenceNumber: "CHK-001",
    },
    {
      id: "2",
      date: "2024-01-14",
      description: "Client Payment - Project A",
      amount: 15000.0,
      type: "INCOME",
      category: "Operating Revenue",
      account: "Accounts Receivable",
      referenceNumber: "INV-1024",
    },
    {
      id: "3",
      date: "2024-01-14",
      description: "Software Subscription",
      amount: -99.0,
      type: "EXPENSE",
      category: "Operating Expense",
      account: "Cash",
      referenceNumber: "AUTO-456",
    },
    {
      id: "4",
      date: "2024-01-13",
      description: "Consulting Services",
      amount: 5250.0,
      type: "INCOME",
      category: "Operating Revenue",
      account: "Cash",
      referenceNumber: "INV-1023",
    },
    {
      id: "5",
      date: "2024-01-12",
      description: "Rent Payment",
      amount: -2500.0,
      type: "EXPENSE",
      category: "Operating Expense",
      account: "Cash",
      referenceNumber: "CHK-002",
    },
    {
      id: "6",
      date: "2024-01-11",
      description: "Equipment Purchase",
      amount: -3200.0,
      type: "EXPENSE",
      category: "Fixed Asset",
      account: "Equipment",
      referenceNumber: "PO-789",
    },
  ]

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || transaction.type === typeFilter
    return matchesSearch && matchesType
  })

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
              <Link href="/transactions" className="text-sm font-medium text-foreground">
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
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage all your financial transactions</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="TRANSFER">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transactions List */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Description</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Category</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Account</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                      <td className="px-6 py-4 text-sm">{transaction.date}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium">{transaction.description}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{transaction.referenceNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            transaction.type === "INCOME"
                              ? "default"
                              : transaction.type === "EXPENSE"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {transaction.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{transaction.category}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{transaction.account}</td>
                      <td
                        className={`px-6 py-4 text-sm font-semibold text-right ${
                          transaction.amount > 0 ? "text-chart-1" : "text-foreground"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
