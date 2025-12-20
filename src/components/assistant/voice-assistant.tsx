/**
 * Voice Assistant Component - GPT Whisper Style
 *
 * Minimal, elegant voice-enabled RAG assistant interface
 * with dynamic whisper-style animations.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useVoiceAgent } from "@/hooks/use-voice-agent";
import { useSpeechSynthesis } from "./voice-output";
import { Button } from "@/components/ui/button";
import { X, Square, MessageSquare, Mic, Trash2 } from "lucide-react";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { WhisperVisualizer } from "./whisper-visualizer";
import { cn } from "@/lib/utils";

export function VoiceAssistant({ className }: { className?: string }) {
  const { selectedBusinessId } = useSelectedBusiness();
  const { data: session } = useSession();
  const router = useRouter();
  const userName = session?.user?.name?.split(" ")[0] || "there";

  const { messages, isProcessing, sendMessage, clearConversation } =
    useVoiceAgent();

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [showConversation, setShowConversation] = useState(false);
  const recognitionRef = useRef<any>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  const {
    speak,
    stop,
    isSpeaking,
    isSupported: speechSupported,
  } = useSpeechSynthesis();

  const [autoSpeak, setAutoSpeak] = useState(true);

  // Track if the last input was via voice for auto-play
  const lastInputWasVoiceRef = useRef(false);
  const lastSpokenMessageIdRef = useRef<string | null>(null);

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
        lastInputWasVoiceRef.current = true;
        sendMessage(transcript);
      }
    };

    recognitionRef.current = recognition;
  }, [sendMessage]);

  const toggleListening = useCallback(() => {
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
  }, [isListening, isSpeaking, stop]);

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
  }, [toggleListening]);

  // Auto-speak latest assistant message when input was via voice
  const lastAssistantMessage = messages
    .filter((m) => m.role === "assistant")
    .slice(-1)[0];

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

  if (!selectedBusinessId) {
    return (
      <div
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-full overflow-hidden bg-black text-white",
          className
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-black to-neutral-950" />
        <div className="relative z-10 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-neutral-800 flex items-center justify-center">
            <Mic className="h-8 w-8 text-neutral-500" />
          </div>
          <h3 className="font-medium text-xl text-neutral-200">
            No Business Selected
          </h3>
          <p className="text-neutral-500 text-sm max-w-xs">
            Please select a business to use the financial assistant.
          </p>
          <Button
            variant="outline"
            className="mt-4 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            onClick={() => router.push("/dashboard/business")}
          >
            Select Business
          </Button>
        </div>
      </div>
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
