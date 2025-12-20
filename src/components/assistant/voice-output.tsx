/**
 * Voice Output Component
 *
 * Handles text-to-speech via Web Speech Synthesis API.
 * Browser-side text-to-voice conversion.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

type TtsProvider = "browser" | "elevenlabs";

function getDefaultProvider(): TtsProvider {
  const v = (process.env.NEXT_PUBLIC_TTS_PROVIDER || "browser").toLowerCase();
  return v === "elevenlabs" ? "elevenlabs" : "browser";
}

interface VoiceOutputProps {
  text: string;
  autoPlay?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  className?: string;
  /** Defaults to NEXT_PUBLIC_TTS_PROVIDER (browser | elevenlabs). */
  provider?: TtsProvider;
}

export function VoiceOutput({
  text,
  autoPlay = false,
  onStart,
  onEnd,
  className,
  provider,
}: VoiceOutputProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const providerRef = useRef<TtsProvider>(provider ?? getDefaultProvider());
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Keep provider in sync
  useEffect(() => {
    providerRef.current = provider ?? getDefaultProvider();
  }, [provider]);

  // Check for browser support
  useEffect(() => {
    // For browser provider we need SpeechSynthesis. For ElevenLabs we can always play audio.
    const p = providerRef.current;
    if (p === "browser" && !("speechSynthesis" in window)) setIsSupported(false);
  }, []);

  // Auto-play when text changes
  useEffect(() => {
    if (autoPlay && text && isSupported) {
      speak();
    }
  }, [text, autoPlay, isSupported]);

  const cleanupAudioUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    // Stop browser TTS
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    // Stop ElevenLabs audio
    abortRef.current?.abort();
    abortRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    cleanupAudioUrl();
    setIsSpeaking(false);
  }, [cleanupAudioUrl]);

  const speak = useCallback(async () => {
    if (!isSupported || !text) return;

    const p = providerRef.current;
    stop();

    if (p === "elevenlabs") {
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        onStart?.();
        setIsSpeaking(true);

        const res = await fetch("/api/agent/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: ac.signal,
        });

        if (!res.ok) {
          // If ElevenLabs isn't configured/available, fall back to browser TTS.
          if ("speechSynthesis" in window) {
            providerRef.current = "browser";
            setIsSupported(true);
            setIsSpeaking(false);
            return void (await speak());
          }
          setIsSpeaking(false);
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          cleanupAudioUrl();
          setIsSpeaking(false);
          onEnd?.();
        };
        audio.onerror = () => {
          cleanupAudioUrl();
          setIsSpeaking(false);
        };

        await audio.play();
      } catch (e) {
        // Abort is normal on stop()
        if ((e as any)?.name !== "AbortError") {
          console.error("[VoiceOutput] ElevenLabs TTS failed", e);
        }
        cleanupAudioUrl();
        setIsSpeaking(false);
      } finally {
        abortRef.current = null;
      }

      return;
    }

    // Browser provider
    if (!("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.name.includes("Google") ||
        v.name.includes("Natural") ||
        v.name.includes("Samantha")
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      onStart?.();
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [cleanupAudioUrl, isSupported, onEnd, onStart, stop, text]);

  const toggle = useCallback(() => {
    if (isSpeaking) {
      stop();
    } else {
      void speak();
    }
  }, [isSpeaking, speak, stop]);

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={cn("h-8 w-8 p-0 rounded-full", className)}
      title={isSpeaking ? "Stop speaking" : "Read aloud"}
    >
      {isSpeaking ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
}

/**
 * Hook for speech synthesis
 */
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const providerRef = useRef<TtsProvider>(getDefaultProvider());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const p = providerRef.current;
    if (p === "browser" && !("speechSynthesis" in window)) setIsSupported(false);
  }, []);

  const cleanupAudioUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    cleanupAudioUrl();
    setIsSpeaking(false);
  }, [cleanupAudioUrl]);

  const speak = useCallback(async (text: string) => {
    if (!isSupported || !text) return;

    const p = providerRef.current;
    stop();

    if (p === "elevenlabs") {
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        setIsSpeaking(true);
        const res = await fetch("/api/agent/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: ac.signal,
        });

        if (!res.ok) {
          if ("speechSynthesis" in window) {
            providerRef.current = "browser";
            setIsSupported(true);
            setIsSpeaking(false);
            return void (await speak(text));
          }
          setIsSpeaking(false);
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          cleanupAudioUrl();
          setIsSpeaking(false);
        };
        audio.onerror = () => {
          cleanupAudioUrl();
          setIsSpeaking(false);
        };
        await audio.play();
      } catch (e) {
        if ((e as any)?.name !== "AbortError") {
          console.error("[useSpeechSynthesis] ElevenLabs TTS failed", e);
        }
        cleanupAudioUrl();
        setIsSpeaking(false);
      } finally {
        abortRef.current = null;
      }
      return;
    }

    if (!("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.name.includes("Google") || v.name.includes("Natural")
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [cleanupAudioUrl, isSupported, stop]);

  return { speak, stop, isSpeaking, isSupported };
}
