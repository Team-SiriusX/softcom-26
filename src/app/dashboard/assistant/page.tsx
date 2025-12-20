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
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Business Selected</AlertTitle>
          <AlertDescription>
            Please select a business from the header or{" "}
            <Link href="/business" className="font-medium underline">
              create a new one
            </Link>
            .
          </AlertDescription>
        </Alert>
      </div>
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
    <div className="fixed inset-0 z-[100] bg-black">
      <VoiceAssistant className="h-full w-full rounded-none border-0" />
    </div>
  );
}
