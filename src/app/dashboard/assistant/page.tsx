/**
 * Voice Assistant Dashboard Page
 *
 * Full-page voice-enabled RAG assistant for the financial dashboard.
 */

"use client";

import { VoiceAssistant } from "@/components/assistant";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import { useGetSubscription, useFeatureAccess } from "@/hooks/use-stripe";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bot, Mic, MessageSquare, Zap, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function AssistantPage() {
  const { selectedBusinessId } = useSelectedBusiness();
  const { data: subscription, isLoading: subscriptionLoading } = useGetSubscription();
  const { canUseAI, aiQueriesRemaining } = useFeatureAccess();

  // Calculate usage stats
  const hasSubscription = subscription && "tier" in subscription;
  const tier = hasSubscription ? subscription.tier : "FREE";
  const aiQueriesUsed = hasSubscription ? subscription.aiQueriesUsed : 0;
  const aiQueriesLimit = hasSubscription ? subscription.aiQueriesLimit : 0;
  const usagePercentage = aiQueriesLimit > 0 ? Math.round((aiQueriesUsed / aiQueriesLimit) * 100) : 0;
  const isNearLimit = usagePercentage >= 80;

  if (!selectedBusinessId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Business Selected</AlertTitle>
        <AlertDescription>
          Please select a business from the header or{" "}
          <Link href="/dashboard/business" className="font-medium underline">
            create a new one
          </Link>
          .
        </AlertDescription>
      </Alert>
    );
  }

  // Show upgrade prompt for FREE tier
  if (!canUseAI && !subscriptionLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
            <p className="text-muted-foreground mt-1">
              Voice-enabled financial assistant powered by your business data
            </p>
          </div>
        </div>

        {/* Upgrade Card */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-xl mb-2">Upgrade to Unlock AI Assistant</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              The AI-powered financial assistant is available on Pro and Business plans. 
              Get intelligent insights, ask questions about your finances, and more.
            </p>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/pricing">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Plans
                </Link>
              </Button>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Pro</Badge>
                <span>30 AI queries/month</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Business</Badge>
                <span>150 AI queries/month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
          <p className="text-muted-foreground mt-1">
            Voice-enabled financial assistant powered by your business data
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Usage Badge */}
          {hasSubscription && aiQueriesLimit > 0 && (
            <Badge variant={isNearLimit ? "destructive" : "secondary"} className="gap-1">
              <Zap className="h-3 w-3" />
              {aiQueriesRemaining} queries left
            </Badge>
          )}
          <Badge variant="outline" className="w-fit">
            <Sparkles className="h-3 w-3 mr-1" />
            {tier}
          </Badge>
        </div>
      </div>

      {/* Usage Warning */}
      {isNearLimit && aiQueriesRemaining > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Approaching Query Limit</AlertTitle>
          <AlertDescription>
            You've used {aiQueriesUsed} of {aiQueriesLimit} AI queries this month. 
            Consider upgrading your plan for more queries.{" "}
            <Link href="/pricing" className="font-medium underline">
              View Plans
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Limit Reached Warning */}
      {aiQueriesRemaining <= 0 && aiQueriesLimit > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Query Limit Reached</AlertTitle>
          <AlertDescription>
            You've used all {aiQueriesLimit} AI queries for this billing period. 
            Upgrade your plan to continue using the AI assistant.{" "}
            <Link href="/pricing" className="font-medium underline">
              Upgrade Now
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Assistant */}
        <div className="lg:col-span-2">
          <VoiceAssistant className="h-[600px]" />
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Usage Card */}
          {hasSubscription && aiQueriesLimit > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  AI Usage
                </CardTitle>
                <CardDescription>
                  Your query usage this billing period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Queries used</span>
                  <span className="font-medium">
                    {aiQueriesUsed} / {aiQueriesLimit}
                  </span>
                </div>
                <Progress 
                  value={usagePercentage} 
                  className={isNearLimit ? "[&>div]:bg-destructive" : ""}
                />
                {tier !== "BUSINESS" && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/pricing">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Get More Queries
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Capabilities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                What I can help with
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CapabilityItem
                icon={<MessageSquare className="h-4 w-4" />}
                title="Transaction queries"
                description="Ask about recent transactions, spending patterns, or income sources"
              />
              <CapabilityItem
                icon={<MessageSquare className="h-4 w-4" />}
                title="Financial summaries"
                description="Get quick summaries of your cash flow, expenses, and revenue"
              />
              <CapabilityItem
                icon={<MessageSquare className="h-4 w-4" />}
                title="Actionable insights"
                description="Receive suggestions based on your financial data"
              />
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mic className="h-4 w-4 text-primary" />
                Voice tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Speak clearly and at a normal pace
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Ask specific questions for better answers
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Try: "What were my top expenses this month?"
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Or: "Show me my cash flow summary"
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Example Queries */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Example questions</CardTitle>
              <CardDescription>Click to try these queries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ExampleQuery query="What's my current cash balance?" />
              <ExampleQuery query="How much did I spend on marketing?" />
              <ExampleQuery query="What were my top 3 expenses this month?" />
              <ExampleQuery query="How is my revenue trending?" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CapabilityItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ExampleQuery({ query }: { query: string }) {
  return (
    <button
      className="w-full text-left text-sm p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
      onClick={() => {
        // Could integrate with the assistant to auto-fill
        navigator.clipboard?.writeText(query);
      }}
    >
      "{query}"
    </button>
  );
}
