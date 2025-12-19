import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BusinessSelector } from "@/components/business-selector";
import {
  Building2,
  Calculator,
  TrendingUp,
  FileText,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            <span className="font-bold text-xl">AccounTech</span>
          </div>
          <BusinessSelector />
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
              Accounting Software
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Powered by AI CFO
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Smart double-entry bookkeeping with AI-powered financial insights,
              real-time analytics, and automated reporting.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/business">
              <Button size="lg" className="w-full sm:w-auto">
                <Building2 className="mr-2 h-5 w-5" />
                Manage Businesses
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <TrendingUp className="mr-2 h-5 w-5" />
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          <div className="space-y-3 p-6 rounded-lg border bg-card">
            <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Calculator className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold">Double-Entry Bookkeeping</h3>
            <p className="text-muted-foreground">
              Professional accounting with automatic journal entries, trial
              balance, and account reconciliation.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-lg border bg-card">
            <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold">Real-Time Analytics</h3>
            <p className="text-muted-foreground">
              Live dashboard with cash flow, burn rate, working capital, and
              expense breakdowns by category.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-lg border bg-card">
            <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">Financial Reports</h3>
            <p className="text-muted-foreground">
              Generate balance sheets, P&L statements, and cash flow reports in
              seconds.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-24 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/business">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-start gap-2"
              >
                <Building2 className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Create Business</div>
                  <div className="text-sm text-muted-foreground">
                    Set up a new business entity
                  </div>
                </div>
              </Button>
            </Link>

            <Link href="/accounts">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-start gap-2"
              >
                <Calculator className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Chart of Accounts</div>
                  <div className="text-sm text-muted-foreground">
                    Configure your account structure
                  </div>
                </div>
              </Button>
            </Link>

            <Link href="/transactions">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-start gap-2"
              >
                <FileText className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Add Transaction</div>
                  <div className="text-sm text-muted-foreground">
                    Record income or expenses
                  </div>
                </div>
              </Button>
            </Link>

            <Link href="/reports">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-start gap-2"
              >
                <TrendingUp className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">View Reports</div>
                  <div className="text-sm text-muted-foreground">
                    Balance sheet & P&L statements
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
