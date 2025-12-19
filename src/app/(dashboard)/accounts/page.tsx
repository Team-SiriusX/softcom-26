import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AccountsPage() {
  const accountGroups = [
    {
      type: "ASSET",
      name: "Assets",
      accounts: [
        { id: "1", code: "1000", name: "Cash", balance: 52450.0, subType: "CURRENT_ASSET" },
        { id: "2", code: "1100", name: "Accounts Receivable", balance: 18200.0, subType: "CURRENT_ASSET" },
        { id: "3", code: "1500", name: "Equipment", balance: 45000.0, subType: "FIXED_ASSET" },
        { id: "4", code: "1600", name: "Accumulated Depreciation", balance: -8500.0, subType: "FIXED_ASSET" },
      ],
    },
    {
      type: "LIABILITY",
      name: "Liabilities",
      accounts: [
        { id: "5", code: "2000", name: "Accounts Payable", balance: 12300.0, subType: "CURRENT_LIABILITY" },
        { id: "6", code: "2100", name: "Credit Card", balance: 3450.0, subType: "CURRENT_LIABILITY" },
        { id: "7", code: "2500", name: "Long-term Loan", balance: 50000.0, subType: "LONG_TERM_LIABILITY" },
      ],
    },
    {
      type: "EQUITY",
      name: "Equity",
      accounts: [
        { id: "8", code: "3000", name: "Owner's Equity", balance: 75000.0, subType: "OWNERS_EQUITY" },
        { id: "9", code: "3100", name: "Retained Earnings", balance: 24400.0, subType: "RETAINED_EARNINGS" },
      ],
    },
    {
      type: "REVENUE",
      name: "Revenue",
      accounts: [
        { id: "10", code: "4000", name: "Service Revenue", balance: 124582.0, subType: "OPERATING_REVENUE" },
        { id: "11", code: "4100", name: "Other Income", balance: 2340.0, subType: "OTHER_REVENUE" },
      ],
    },
    {
      type: "EXPENSE",
      name: "Expenses",
      accounts: [
        { id: "12", code: "5000", name: "Salaries Expense", balance: 28000.0, subType: "OPERATING_EXPENSE" },
        { id: "13", code: "5100", name: "Rent Expense", balance: 7500.0, subType: "OPERATING_EXPENSE" },
        { id: "14", code: "5200", name: "Utilities", balance: 1890.0, subType: "OPERATING_EXPENSE" },
        { id: "15", code: "5300", name: "Office Supplies", balance: 2450.0, subType: "OPERATING_EXPENSE" },
        { id: "16", code: "5400", name: "Software & Subscriptions", balance: 2551.0, subType: "OPERATING_EXPENSE" },
      ],
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
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/transactions" className="text-sm text-muted-foreground hover:text-foreground">
                Transactions
              </Link>
              <Link href="/accounts" className="text-sm font-medium text-foreground">
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
            <h1 className="text-3xl font-semibold tracking-tight">Chart of Accounts</h1>
            <p className="text-sm text-muted-foreground mt-1">Complete ledger account structure</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
        </div>

        {/* Account Groups */}
        <div className="space-y-6">
          {accountGroups.map((group) => (
            <Card key={group.type}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {group.name}
                  <Badge variant="outline">{group.accounts.length}</Badge>
                </CardTitle>
                <CardDescription>
                  {group.type === "ASSET" && "Resources owned by the business"}
                  {group.type === "LIABILITY" && "Obligations owed to others"}
                  {group.type === "EQUITY" && "Owner's residual interest"}
                  {group.type === "REVENUE" && "Income from business operations"}
                  {group.type === "EXPENSE" && "Costs of business operations"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left text-xs font-medium text-muted-foreground pb-3">Code</th>
                        <th className="text-left text-xs font-medium text-muted-foreground pb-3">Account Name</th>
                        <th className="text-left text-xs font-medium text-muted-foreground pb-3">Sub Type</th>
                        <th className="text-right text-xs font-medium text-muted-foreground pb-3">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {group.accounts.map((account) => (
                        <tr key={account.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                          <td className="py-3 text-sm font-mono text-muted-foreground">{account.code}</td>
                          <td className="py-3 text-sm font-medium">{account.name}</td>
                          <td className="py-3 text-sm text-muted-foreground">{account.subType.replace(/_/g, " ")}</td>
                          <td className="py-3 text-sm font-semibold text-right">
                            ${Math.abs(account.balance).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
