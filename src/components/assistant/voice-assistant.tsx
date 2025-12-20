/**
 * Voice Assistant Component
 *
 * Main component that combines voice input, conversation, and voice output.
 * Full-featured voice-enabled RAG assistant interface.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useVoiceAgent } from "@/hooks/use-voice-agent";
import { useRefreshDashboardContext } from "@/hooks/use-dashboard-context";
import { useSpeechSynthesis } from "./voice-output";
import { VoiceInput } from "./voice-input";
import { Conversation } from "./conversation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Send,
  Trash2,
  Volume2,
  VolumeX,
  Bot,
  Keyboard,
  Mic,
  RefreshCcw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import { useGetAnalyticsOverview } from "@/hooks/use-analytics";
import { useGetTransactions } from "@/hooks/use-transactions";
import { useGetLedgerAccounts } from "@/hooks/use-ledger-accounts";
import { useMemo } from "react";

interface VoiceAssistantProps {
  className?: string;
}

export function VoiceAssistant({ className }: VoiceAssistantProps) {
  const { selectedBusinessId } = useSelectedBusiness();
  const {
    refresh: refreshDashboardContext,
    isRefreshing: isRefreshingDashboardContext,
    error: dashboardContextError,
    lastRefreshedAt,
  } = useRefreshDashboardContext();
  const {
    messages,
    isProcessing,
    sessionId,
    sendMessage,
    clearConversation,
    error,
  } = useVoiceAgent();

  // Fetch financial data for proactive insights
  const { data: analytics } = useGetAnalyticsOverview(
    selectedBusinessId ?? undefined
  );
  const { data: recentTransactions } = useGetTransactions(
    selectedBusinessId ?? undefined,
    {
      limit: 10,
      sortBy: "date",
      sortOrder: "desc",
    }
  );
  const { data: accounts } = useGetLedgerAccounts(
    selectedBusinessId ?? undefined
  );

  const {
    speak,
    stop,
    isSpeaking,
    isSupported: speechSupported,
  } = useSpeechSynthesis();

  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [textInput, setTextInput] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isIndexing, setIsIndexing] = useState(false);

  // Calculate immediate financial insights
  const financialInsights = useMemo(() => {
    if (!analytics || !accounts) return null;

    const insights: {
      type: "warning" | "success" | "info";
      message: string;
      icon: any;
    }[] = [];

    // Check cash flow health
    const cashAccount = accounts.find(
      (acc: any) =>
        acc.code === "1000" || acc.name.toLowerCase().includes("cash")
    );
    if (cashAccount) {
      const cashBalance = Number(cashAccount.currentBalance);
      if (cashBalance < 0) {
        insights.push({
          type: "warning",
          message: `⚠️ Negative cash balance: ${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(cashBalance)}`,
          icon: AlertTriangle,
        });
      } else if (cashBalance < 1000) {
        insights.push({
          type: "warning",
          message: `⚠️ Low cash reserves: ${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(cashBalance)}`,
          icon: AlertTriangle,
        });
      } else {
        insights.push({
          type: "success",
          message: `✅ Healthy cash position: ${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(cashBalance)}`,
          icon: CheckCircle2,
        });
      }
    }

    // Analyze revenue trends
    if (analytics.revenue?.monthly !== undefined) {
      const revenue = Number(analytics.revenue.monthly);
      if (revenue > 0) {
        insights.push({
          type: "success",
          message: `📈 Monthly revenue: ${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(revenue)}`,
          icon: TrendingUp,
        });
      } else {
        insights.push({
          type: "warning",
          message: "📉 No revenue recorded this month",
          icon: TrendingDown,
        });
      }
    }

    // Profit margin check
    if (analytics.netIncome?.margin !== undefined) {
      const margin = Number(analytics.netIncome.margin);
      if (margin < 0) {
        insights.push({
          type: "warning",
          message: `⚠️ Operating at a loss: ${margin.toFixed(1)}% margin`,
          icon: AlertTriangle,
        });
      } else if (margin > 20) {
        insights.push({
          type: "success",
          message: `✅ Strong profit margin: ${margin.toFixed(1)}%`,
          icon: CheckCircle2,
        });
      }
    }

    return insights.length > 0 ? insights : null;
  }, [analytics, accounts]);

  // Generate quick action suggestions based on recent activity
  const quickSuggestions = useMemo(() => {
    const suggestions: string[] = [];

    if (!recentTransactions?.data || recentTransactions.data.length === 0) {
      suggestions.push("Log your first transaction");
      suggestions.push("Set up your chart of accounts");
    } else {
      suggestions.push("What's my cash flow this month?");
      suggestions.push("Show me top expenses");
      suggestions.push("How can I improve profitability?");
      suggestions.push("Create a budget plan");
    }

    return suggestions;
  }, [recentTransactions]);

  // Track if the last input was via voice for auto-play
  const lastInputWasVoiceRef = useRef(false);
  const lastSpokenMessageIdRef = useRef<string | null>(null);

  // Handle voice transcript
  const handleTranscript = useCallback(
    async (text: string) => {
      lastInputWasVoiceRef.current = true;
      await sendMessage(text);
    },
    [sendMessage]
  );

  // Handle text submit
  const handleTextSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!textInput.trim() || isProcessing) return;

      const message = textInput.trim();
      setTextInput("");
      lastInputWasVoiceRef.current = false;
      await sendMessage(message);
    },
    [textInput, isProcessing, sendMessage]
  );

  // Auto-speak latest assistant message when input was via voice
  const lastAssistantMessage = messages
    .filter((m) => m.role === "assistant")
    .slice(-1)[0];

  // Auto-play audio response when input was via voice
  useEffect(() => {
    if (
      lastAssistantMessage &&
      lastAssistantMessage.id !== lastSpokenMessageIdRef.current &&
      lastInputWasVoiceRef.current &&
      autoSpeak &&
      speechSupported &&
      !isProcessing
    ) {
      lastSpokenMessageIdRef.current = lastAssistantMessage.id;
      speak(lastAssistantMessage.content);
    }
  }, [lastAssistantMessage, autoSpeak, speechSupported, isProcessing, speak]);

  if (!selectedBusinessId) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Business Selected</h3>
          <p className="text-muted-foreground text-sm">
            Please select a business to use the financial assistant.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Your Financial Advisor
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                {financialInsights && financialInsights.length > 0
                  ? "I've analyzed your finances and have some insights"
                  : "Ready to help with your financial decisions"}
              </CardDescription>
              <div className="flex items-center gap-2 mt-1">
                {lastRefreshedAt && (
                  <p className="text-xs text-muted-foreground">
                    Updated: {lastRefreshedAt.toLocaleTimeString()}
                  </p>
                )}
                {isIndexing && (
                  <Badge variant="secondary" className="text-xs">
                    Indexing...
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh dashboard context */}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  setIsIndexing(true);
                  await refreshDashboardContext();
                  // Give indexing a moment to start
                  setTimeout(() => setIsIndexing(false), 2000);
                } catch {
                  setIsIndexing(false);
                  // error is surfaced via dashboardContextError
                }
              }}
              disabled={isRefreshingDashboardContext || isProcessing}
              title="Refresh dashboard context and index data for faster search"
            >
              <RefreshCcw
                className={cn(
                  "h-4 w-4",
                  (isRefreshingDashboardContext || isIndexing) && "animate-spin"
                )}
              />
            </Button>

            {/* Auto-speak toggle */}
            {speechSupported && (
              <Button
                variant={autoSpeak ? "secondary" : "ghost"}
                size="sm"
                onClick={() => {
                  setAutoSpeak(!autoSpeak);
                  if (isSpeaking) stop();
                }}
                title={autoSpeak ? "Disable auto-speak" : "Enable auto-speak"}
              >
                {autoSpeak ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Input mode toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setInputMode(inputMode === "voice" ? "text" : "voice")
              }
              title={`Switch to ${
                inputMode === "voice" ? "text" : "voice"
              } input`}
            >
              {inputMode === "voice" ? (
                <Keyboard className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>

            {/* Clear conversation */}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearConversation}
              disabled={messages.length === 0}
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {(error || dashboardContextError) && (
          <Badge variant="destructive" className="mt-2">
            {error || dashboardContextError}
          </Badge>
        )}
      </CardHeader>

      {/* Financial Insights Panel */}
      {financialInsights &&
        financialInsights.length > 0 &&
        messages.length === 0 && (
          <div className="border-b bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Immediate Financial Health Check
              </h3>
            </div>
            <div className="space-y-2">
              {financialInsights.map((insight, idx) => {
                const Icon = insight.icon;
                return (
                  <Alert
                    key={idx}
                    variant={
                      insight.type === "warning" ? "destructive" : "default"
                    }
                    className="py-2"
                  >
                    <Icon className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {insight.message}
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>

            {/* Quick suggestions */}
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">
                💡 Try asking:
              </p>
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.slice(0, 3).map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      if (inputMode === "text") {
                        setTextInput(suggestion);
                      } else {
                        handleTranscript(suggestion);
                      }
                    }}
                    disabled={isProcessing}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Conversation */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <Conversation
          messages={messages}
          isProcessing={isProcessing}
          className="h-full"
        />
      </CardContent>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t p-4">
        {inputMode === "voice" ? (
          <div className="flex flex-col items-center gap-2">
            <VoiceInput
              onTranscript={handleTranscript}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Tap to speak, or{" "}
              <button
                className="underline hover:text-foreground"
                onClick={() => setInputMode("text")}
              >
                type instead
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ask me anything: budgets, forecasts, tax planning..."
              disabled={isProcessing}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    </Card>
  );
}
