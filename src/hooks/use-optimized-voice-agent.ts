/**
 * Optimized Voice Agent Hook
 *
 * Drop-in replacement for use-voice-agent.ts with:
 * - Streaming support
 * - Semantic caching
 * - Intent-based routing
 * - Better error handling
 */

import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { useSelectedBusiness } from "@/components/providers/business-provider";

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  confidence?: "high" | "medium" | "low" | "none";
  sources?: Array<{
    text: string;
    source: string;
    score: number;
  }>;
  isStreaming?: boolean; // NEW: Indicates partial message
}

export interface AgentUsage {
  aiQueriesUsed: number;
  aiQueriesLimit: number;
  tier: string;
}

export interface UseOptimizedVoiceAgentReturn {
  messages: AgentMessage[];
  isProcessing: boolean;
  sessionId: string | null;
  sendMessage: (query: string, useStreaming?: boolean) => Promise<void>;
  clearConversation: () => void;
  error: string | null;
  limitReached: boolean;
  upgradeRequired: boolean;
}

export function useOptimizedVoiceAgent(): UseOptimizedVoiceAgentReturn {
  const { selectedBusinessId } = useSelectedBusiness();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const generateId = () =>
    `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  /**
   * Send message with optional streaming
   */
  const sendMessage = useCallback(
    async (query: string, useStreaming: boolean = true) => {
      if (!selectedBusinessId) {
        throw new Error("No business selected");
      }

      setIsProcessing(true);
      setError(null);

      // Add user message immediately
      const userMessage: AgentMessage = {
        id: generateId(),
        role: "user",
        content: query,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        if (useStreaming) {
          // STREAMING RESPONSE
          await handleStreamingResponse(query, selectedBusinessId);
        } else {
          // NON-STREAMING (OPTIMIZED)
          await handleOptimizedResponse(query, selectedBusinessId);
        }
      } catch (err) {
        handleError(err);
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedBusinessId]
  );

  /**
   * Handle streaming response (SSE)
   */
  const handleStreamingResponse = async (
    query: string,
    businessId: string
  ) => {
    const response = await fetch("/api/agent/voice/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        sessionId: sessionId || undefined,
        businessId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to process query");
    }

    // Create assistant message placeholder
    const assistantMessageId = generateId();
    let fullContent = "";

    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);

    // Process SSE stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error("No response body");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));

          if (data.type === "chunk") {
            fullContent += data.content;
            // Update message with new content
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: fullContent }
                  : m
              )
            );
          } else if (data.type === "metadata") {
            // Update with final metadata
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      confidence: data.confidence,
                      sources: data.sources,
                      isStreaming: false,
                    }
                  : m
              )
            );
            if (data.sessionId) setSessionId(data.sessionId);
          } else if (data.type === "error") {
            throw new Error(data.error);
          }
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ["subscription"] });
  };

  /**
   * Handle optimized non-streaming response
   */
  const handleOptimizedResponse = async (
    query: string,
    businessId: string
  ) => {
    const response = await client.api.agent.voice.optimized.$post({
      json: {
        query,
        sessionId: sessionId || undefined,
        businessId,
      },
    });

    if (!response.ok) {
      const errorData = (await response.json()) as {
        error?: string;
        limitReached?: boolean;
        upgradeRequired?: boolean;
      };

      if (errorData.limitReached) {
        throw Object.assign(new Error(errorData.error || "Limit reached"), {
          limitReached: true,
        });
      }
      if (errorData.upgradeRequired) {
        throw Object.assign(new Error(errorData.error || "Upgrade required"), {
          upgradeRequired: true,
        });
      }

      throw new Error(errorData.error || "Failed to process query");
    }

    const result = await response.json();

    if (result.success && result.data) {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });

      if (result.data.sessionId && result.data.sessionId !== sessionId) {
        setSessionId(result.data.sessionId);
      }

      const assistantMessage: AgentMessage = {
        id: generateId(),
        role: "assistant",
        content: result.data.answer,
        timestamp: new Date(),
        confidence: result.data.confidence,
        sources: result.data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setError(null);
    }
  };

  /**
   * Handle errors
   */
  const handleError = (err: any) => {
    setError(err.message);

    if (err.limitReached) {
      setLimitReached(true);
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    }
    if (err.upgradeRequired) {
      setUpgradeRequired(true);
    }

    let errorContent = "I'm sorry, I encountered an error. Please try again.";
    if (err.limitReached) {
      errorContent =
        "You've reached your AI query limit. Please upgrade your plan or wait until your limit resets.";
    } else if (err.upgradeRequired) {
      errorContent =
        "The AI assistant is not available on the Free plan. Please upgrade to Pro or Business.";
    }

    const errorMessage: AgentMessage = {
      id: generateId(),
      role: "assistant",
      content: errorContent,
      timestamp: new Date(),
      confidence: "none",
    };

    setMessages((prev) => [...prev, errorMessage]);
  };

  const clearConversation = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
    setLimitReached(false);
    setUpgradeRequired(false);
  }, []);

  return {
    messages,
    isProcessing,
    sessionId,
    sendMessage,
    clearConversation,
    error,
    limitReached,
    upgradeRequired,
  };
}
