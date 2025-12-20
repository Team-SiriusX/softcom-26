/**
 * Voice Assistant Dashboard Page
 *
 * Full-page voice-enabled RAG assistant for the financial dashboard.
 */

"use client";

import { VoiceAssistant } from "@/components/assistant";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Bot, Mic, MessageSquare, Zap } from "lucide-react";
import Link from "next/link";

export default function AssistantPage() {
  const { selectedBusinessId } = useSelectedBusiness();

  if (!selectedBusinessId) {
    return (
      <Alert>
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
        <Badge variant="secondary" className="w-fit">
          <Zap className="h-3 w-3 mr-1" />
          RAG-Powered
        </Badge>
      </div>

      {/* Main Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Assistant */}
        <div className="lg:col-span-2">
          <VoiceAssistant className="h-[600px]" />
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
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
