/**
 * Conversation Display Component
 *
 * Renders the chat history between user and assistant.
 * Clean, accessible message list.
 */

"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { VoiceOutput } from "./voice-output";
import { User, Bot, Info } from "lucide-react";
import type { AgentMessage } from "@/hooks/use-voice-agent";

interface ConversationProps {
  messages: AgentMessage[];
  isProcessing?: boolean;
  className?: string;
}

export function Conversation({
  messages,
  isProcessing = false,
  className,
}: ConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-full text-center p-8",
          className
        )}
      >
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Financial Assistant</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Ask me about your transactions, expenses, revenue, or cash flow.
          I'll answer based on your business data.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={cn(
        "flex flex-col gap-4 overflow-y-auto p-4",
        className
      )}
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isProcessing && (
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 bg-muted rounded-2xl rounded-tl-sm p-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: AgentMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary" : "bg-primary/10"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>

      {/* Message */}
      <div
        className={cn(
          "flex-1 max-w-[80%] rounded-2xl p-4",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted rounded-tl-sm"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {/* Confidence badge for assistant */}
        {!isUser && message.confidence && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
            <Badge
              variant={
                message.confidence === "high"
                  ? "default"
                  : message.confidence === "medium"
                    ? "secondary"
                    : "outline"
              }
              className="text-xs"
            >
              {message.confidence} confidence
            </Badge>

            <VoiceOutput text={message.content} />
          </div>
        )}

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Info className="h-3 w-3" />
              <span>Sources</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {message.sources.map((source, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {source.source} ({(source.score * 100).toFixed(0)}%)
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
