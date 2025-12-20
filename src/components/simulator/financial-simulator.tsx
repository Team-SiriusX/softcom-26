"use client";

import { useState } from "react";
import { useRunSimulation } from "@/hooks/use-simulator";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const EXAMPLE_QUERIES = [
  "What if I hired a sales person 3 months ago?",
  "What if we raised prices by 15% 2 months ago?",
  "What if we landed a $5000/month client 4 months ago?",
  "What if we invested $10000 in marketing 3 months ago?",
];

export function FinancialSimulator() {
  const [query, setQuery] = useState("");
  const { selectedBusinessId } = useSelectedBusiness();
  const { mutateAsync, data, isPending, error, reset } = useRunSimulation();

  const handleSubmit = async (queryText: string) => {
    if (!selectedBusinessId || !queryText.trim()) return;

    try {
      await mutateAsync({
        businessId: selectedBusinessId,
        query: queryText.trim(),
      });
    } catch (err) {
      console.error("Simulation failed:", err);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    handleSubmit(example);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold">Financial Time Machine</h1>
        </div>
        <p className="text-muted-foreground">
          Ask "what if" questions about past financial decisions and see how they would have impacted your business.
        </p>
      </div>

      {/* No Business Selected */}
      {!selectedBusinessId && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Business Selected</AlertTitle>
          <AlertDescription>Please select a business to run simulations.</AlertDescription>
        </Alert>
      )}

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Ask a "What If" Question</CardTitle>
          <CardDescription>
            Describe a past scenario you want to explore (e.g., hiring someone, changing prices, landing a client)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="What if I hired a sales person 3 months ago?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isPending) {
                  handleSubmit(query);
                }
              }}
              disabled={isPending || !selectedBusinessId}
              className="flex-1"
            />
            <Button
              onClick={() => handleSubmit(query)}
              disabled={isPending || !query.trim() || !selectedBusinessId}
              className="min-w-[120px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Simulate
                </>
              )}
            </Button>
          </div>

          {/* Example Queries */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExampleClick(example)}
                  disabled={isPending || !selectedBusinessId}
                  className="text-xs"
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isPending && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Simulation Failed</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {data && !isPending && (
        <div className="space-y-4">
          {/* Impact Overview */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {data.impact.amount >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                    Financial Impact
                  </CardTitle>
                  <CardDescription className="mt-1">{data.query}</CardDescription>
                </div>
                <Badge variant={data.impact.amount >= 0 ? "default" : "destructive"} className="text-lg px-4 py-2">
                  {data.impact.amount >= 0 ? "+" : ""}
                  {formatCurrency(data.impact.amount)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Percentage Change</p>
                  <p className="text-2xl font-bold">
                    {data.impact.percent >= 0 ? "+" : ""}
                    {data.impact.percent}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(data.reality[data.reality.length - 1].balance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base leading-relaxed">{data.verdict.analysis}</p>

              <div className="space-y-2">
                <p className="font-semibold text-sm">Key Factors:</p>
                {data.verdict.reasoning.map((reason, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{reason}</p>
                  </div>
                ))}
              </div>

              <Alert>
                <ArrowRight className="h-4 w-4" />
                <AlertTitle>Recommendation</AlertTitle>
                <AlertDescription>{data.verdict.recommendation}</AlertDescription>
              </Alert>

              <div className="flex items-center gap-2 pt-2">
                <Badge variant="outline">Confidence: {Math.round(data.verdict.confidence * 100)}%</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Month-by-Month Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Month-by-Month Impact</CardTitle>
              <CardDescription>How the scenario would have affected each month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.impact.breakdownByMonth.map((month) => (
                  <div
                    key={month.month}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{new Date(month.month).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                      })}</p>
                      {month.keyFactors.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">{month.keyFactors[0]}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          month.difference >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {month.difference >= 0 ? "+" : ""}
                        {formatCurrency(month.difference)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cumulative: {formatCurrency(month.cumulativeDifference)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reset Button */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => { reset(); setQuery(""); }}>
              Run Another Simulation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
