/**
 * Voice Assistant Component - GPT Whisper Style
 *
 * Minimal, elegant voice-enabled RAG assistant interface
 * with dynamic whisper-style animations.
 */

"use client";

<<<<<<< HEAD
import { useState, useEffect, useRef } from "react";
=======
import { useState, useCallback, useEffect, useRef } from "react";
>>>>>>> 7345fd7204f372eeb7d55bc3368b0e535b2188ea
import { useVoiceAgent } from "@/hooks/use-voice-agent";
import { useSpeechSynthesis } from "./voice-output";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { Mic, X, Square, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Bot } from "lucide-react";
import { WhisperVisualizer } from "./whisper-visualizer";
=======
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

export function VoiceAssistant({ className }: { className?: string }) {
  const { selectedBusinessId } = useSelectedBusiness();
  const { data: session } = useSession();
  const router = useRouter();
  const userName = session?.user?.name?.split(" ")[0] || "there";

  const { messages, isProcessing, sendMessage, clearConversation } =
    useVoiceAgent();

  const { speak, stop, isSpeaking } = useSpeechSynthesis();

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [showConversation, setShowConversation] = useState(false);
  const recognitionRef = useRef<any>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
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

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        sendMessage(transcript);
      }
    };

    recognitionRef.current = recognition;
  }, [sendMessage]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isSpeaking) {
      stop();
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Keyboard shortcut for space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        toggleListening();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isListening, isSpeaking]);

  // Auto-speak response
=======
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

  const lastMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      lastAssistantMessage &&
      lastAssistantMessage.content !== lastMessageRef.current &&
      !isListening
    ) {
      lastMessageRef.current = lastAssistantMessage.content;
      speak(lastAssistantMessage.content);
    }
  }, [lastAssistantMessage, isListening, speak]);

  // Auto-scroll conversation
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages]);

  // Get current status text
  const getStatusText = () => {
    if (isListening) return "Listening...";
    if (isProcessing) return "Thinking...";
    if (isSpeaking) return "Speaking...";
    return `Hi ${userName}`;
  };

  const getSubtitleText = () => {
    if (isListening) return "Speak now";
    if (isProcessing) return "Processing your request";
    if (isSpeaking && lastAssistantMessage) {
      const text = lastAssistantMessage.content;
      return text.length > 100 ? text.substring(0, 100) + "..." : text;
    }
    if (lastAssistantMessage) {
      const text = lastAssistantMessage.content;
      return text.length > 100 ? text.substring(0, 100) + "..." : text;
    }
    return "Tap the microphone to start";
  };

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
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-full overflow-hidden bg-black text-white",
        className
      )}
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-black to-neutral-950" />

      {/* Ambient glow effect */}
      <div
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full transition-all duration-1000 blur-[120px]",
          isListening
            ? "bg-white/10 scale-110"
            : isSpeaking
              ? "bg-white/8 scale-105"
              : isProcessing
                ? "bg-white/5 scale-100 animate-pulse"
                : "bg-white/3 scale-95"
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
      />

      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 left-6 z-20 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        onClick={() => router.push("/dashboard")}
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Action buttons top right */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            onClick={() => setShowConversation(!showConversation)}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        )}
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-400 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors"
            onClick={clearConversation}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
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

      {/* Main content area */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-2xl px-8">
        {/* Whisper visualizer */}
        <div
          className={cn(
            "w-20 h-20 mb-12 transition-all duration-500",
            isListening && "scale-125",
            isSpeaking && "scale-110",
            isProcessing && "scale-100"
          )}
        >
          <WhisperVisualizer
            isListening={isListening}
            isSpeaking={isSpeaking}
            isProcessing={isProcessing}
          />
        </div>

        {/* Status text */}
        <div className="text-center space-y-4">
          <h1
            className={cn(
              "text-4xl md:text-5xl font-light tracking-tight transition-all duration-500",
              isListening && "text-white",
              isSpeaking && "text-neutral-200",
              isProcessing && "text-neutral-300",
              !isListening && !isSpeaking && !isProcessing && "text-neutral-100"
            )}
          >
            {getStatusText()}
          </h1>

          <p
            className={cn(
              "text-lg md:text-xl font-light max-w-md mx-auto leading-relaxed transition-all duration-500",
              isListening
                ? "text-neutral-300"
                : isSpeaking
                  ? "text-neutral-400"
                  : "text-neutral-500"
            )}
          >
            {getSubtitleText()}
          </p>
        </div>
      </div>

      {/* Microphone button */}
      <div className="absolute bottom-16 z-20">
        <Button
          size="lg"
          className={cn(
            "h-20 w-20 rounded-full shadow-2xl transition-all duration-300 border-0",
            isListening
              ? "bg-white text-black hover:bg-neutral-200 scale-110 ring-4 ring-white/20"
              : isSpeaking
                ? "bg-neutral-800 text-white hover:bg-neutral-700 ring-2 ring-white/10"
                : "bg-white text-black hover:bg-neutral-200"
          )}
          onClick={toggleListening}
          disabled={!isSupported}
        >
          {isListening ? (
            <Square className="h-8 w-8 fill-current" />
          ) : isSpeaking ? (
            <Square className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>

        {/* Ripple effect when listening */}
        {isListening && (
          <>
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
            <div
              className="absolute inset-0 rounded-full bg-white/10 animate-ping"
              style={{ animationDelay: "0.2s" }}
            />
          </>
        )}
      </div>

      {/* Conversation panel (slide in from right) */}
      <div
        className={cn(
          "absolute top-0 right-0 h-full w-full md:w-96 bg-neutral-950/95 backdrop-blur-xl border-l border-white/10 transform transition-transform duration-300 z-30",
          showConversation ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-medium">Conversation</h2>
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-400 hover:text-white hover:bg-white/10 rounded-full"
              onClick={() => setShowConversation(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div
            ref={conversationRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.length === 0 ? (
              <div className="text-center text-neutral-500 py-12">
                No messages yet
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-white text-black rounded-br-md"
                        : "bg-neutral-800 text-white rounded-bl-md"
                    )}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.confidence && (
                      <p className="text-xs mt-2 opacity-60">
                        {message.confidence} confidence
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-neutral-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      {!isListening && !isSpeaking && !isProcessing && (
        <div className="absolute bottom-6 text-neutral-600 text-sm transition-opacity duration-500">
          Press{" "}
          <kbd className="px-2 py-1 bg-neutral-900 rounded text-neutral-400 text-xs">
            Space
          </kbd>{" "}
          or tap to speak
        </div>
      )}
    </div>
  );
}
