/**
 * Voice Agent React Hook
 *
 * Handles API communication, session management, and state.
 * Clean abstraction for the voice assistant component.
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
}

export interface AgentUsage {
  aiQueriesUsed: number;
  aiQueriesLimit: number;
  tier: string;
}

export interface UseVoiceAgentReturn {
  messages: AgentMessage[];
  isProcessing: boolean;
  sessionId: string | null;
  sendMessage: (query: string) => Promise<void>;
  clearConversation: () => void;
  error: string | null;
  limitReached: boolean;
  upgradeRequired: boolean;
}

export function useVoiceAgent(): UseVoiceAgentReturn {
  const { selectedBusinessId } = useSelectedBusiness();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  // Generate unique message ID
  const generateId = () =>
    `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Mutation for sending messages
  const mutation = useMutation({
    mutationFn: async (query: string) => {
      if (!selectedBusinessId) {
        throw new Error("No business selected");
      }

      const response = await client.api.agent.voice.$post({
        json: {
          query,
          sessionId: sessionId || undefined,
          businessId: selectedBusinessId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json() as { 
          error?: string; 
          limitReached?: boolean;
          upgradeRequired?: boolean;
        };
        
        // Check for specific error types
        if (errorData.limitReached) {
          throw Object.assign(new Error(errorData.error || "AI query limit reached"), { limitReached: true });
        }
        if (errorData.upgradeRequired) {
          throw Object.assign(new Error(errorData.error || "Upgrade required"), { upgradeRequired: true });
        }
        
        throw new Error(errorData.error || "Failed to process query");
      }

      return response.json();
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        // Invalidate subscription cache to update remaining queries
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
        
        // Reset error states
        setLimitReached(false);
        setUpgradeRequired(false);
        
        // Update session ID if new
        if (result.data.sessionId && result.data.sessionId !== sessionId) {
          setSessionId(result.data.sessionId);
        }

        // Add assistant message
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
    },
    onError: (err: Error & { limitReached?: boolean; upgradeRequired?: boolean }) => {
      setError(err.message);
      
      // Check for limit/upgrade errors
      if (err.limitReached) {
        setLimitReached(true);
        // Invalidate subscription to get fresh data
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
      }
      if (err.upgradeRequired) {
        setUpgradeRequired(true);
      }

      // Add error message to conversation with appropriate content
      let errorContent = "I'm sorry, I encountered an error processing your request. Please try again.";
      if (err.limitReached) {
        errorContent = "You've reached your AI query limit for this billing period. Please upgrade your plan or wait until your limit resets.";
      } else if (err.upgradeRequired) {
        errorContent = "The AI assistant is not available on the Free plan. Please upgrade to Pro or Business to use this feature.";
      }
      
      const errorMessage: AgentMessage = {
        id: generateId(),
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
        confidence: "none",
      };

      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  // Send a message
  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      // Add user message immediately
      const userMessage: AgentMessage = {
        id: generateId(),
        role: "user",
        content: query,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Send to API
      await mutation.mutateAsync(query);
    },
    [mutation, sessionId]
  );

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
    setLimitReached(false);
    setUpgradeRequired(false);
  }, []);

  return {
    messages,
    isProcessing: mutation.isPending,
    sessionId,
    sendMessage,
    clearConversation,
    error,
    limitReached,
    upgradeRequired,
  };
}
