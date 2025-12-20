/**
 * Voice Assistant Component
 *
 * Main component that combines voice input, conversation, and voice output.
 * Full-featured voice-enabled RAG assistant interface.
 */

"use client";

import { useState, useCallback } from "react";
import { useVoiceAgent } from "@/hooks/use-voice-agent";
import { useRefreshDashboardContext } from "@/hooks/use-dashboard-context";
import { useSpeechSynthesis } from "./voice-output";
import { VoiceInput } from "./voice-input";
import { Conversation } from "./conversation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Trash2,
  Volume2,
  VolumeX,
  Bot,
  Keyboard,
  Mic,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelectedBusiness } from "@/components/providers/business-provider";

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

  const { speak, stop, isSpeaking, isSupported: speechSupported } = useSpeechSynthesis();

  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [textInput, setTextInput] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(true);

  // Handle voice transcript
  const handleTranscript = useCallback(
    async (text: string) => {
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
      await sendMessage(message);
    },
    [textInput, isProcessing, sendMessage]
  );

  // Auto-speak latest assistant message
  const lastAssistantMessage = messages
    .filter((m) => m.role === "assistant")
    .slice(-1)[0];

  // Handle auto-speak for new messages
  const handleNewMessage = useCallback(() => {
    if (autoSpeak && lastAssistantMessage && speechSupported) {
      speak(lastAssistantMessage.content);
    }
  }, [autoSpeak, lastAssistantMessage, speechSupported, speak]);

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
            <div className="rounded-full bg-primary/10 p-2">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Financial Assistant</CardTitle>
              {sessionId && (
                <p className="text-xs text-muted-foreground">
                  Session: {sessionId.slice(0, 20)}...
                </p>
              )}
              {lastRefreshedAt && (
                <p className="text-xs text-muted-foreground">
                  Context refreshed: {lastRefreshedAt.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh dashboard context */}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await refreshDashboardContext();
                } catch {
                  // error is surfaced via dashboardContextError
                }
              }}
              disabled={isRefreshingDashboardContext || isProcessing}
              title="Refresh dashboard context"
            >
              <RefreshCcw
                className={cn(
                  "h-4 w-4",
                  isRefreshingDashboardContext && "animate-spin"
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
              title={`Switch to ${inputMode === "voice" ? "text" : "voice"} input`}
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
              placeholder="Ask about your finances..."
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
