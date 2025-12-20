"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface WhisperVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  className?: string;
}

export function WhisperVisualizer({
  isListening,
  isSpeaking,
  isProcessing,
  className,
}: WhisperVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
        canvasRef.current.width = rect.width * window.devicePixelRatio;
        canvasRef.current.height = rect.height * window.devicePixelRatio;
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.scale(dpr, dpr);

    const centerX = width / (2 * dpr);
    const centerY = height / (2 * dpr);
    const time = Date.now() / 1000;

    // Determine animation parameters based on state
    let intensity = 0.3;
    let speed = 1;
    let barCount = 5;
    let hue = 0; // White/gray

    if (isListening) {
      intensity = 1;
      speed = 2;
      barCount = 5;
    } else if (isSpeaking) {
      intensity = 0.8;
      speed = 1.5;
      barCount = 5;
    } else if (isProcessing) {
      intensity = 0.5;
      speed = 3;
      barCount = 3;
    }

    // Draw whisper-style bars
    const barWidth = 4;
    const maxBarHeight = 60 * intensity;
    const gap = 8;
    const totalWidth = barCount * barWidth + (barCount - 1) * gap;
    const startX = centerX - totalWidth / 2;

    for (let i = 0; i < barCount; i++) {
      // Create wave-like motion with different phases
      const phase = (i / barCount) * Math.PI * 2;
      const wave1 = Math.sin(time * speed * 2 + phase) * 0.5 + 0.5;
      const wave2 = Math.sin(time * speed * 3 + phase * 1.5) * 0.3 + 0.5;
      const wave3 = Math.sin(time * speed * 1.5 + phase * 0.8) * 0.2 + 0.5;

      let barHeight: number;

      if (isProcessing) {
        // Pulsing effect for processing
        barHeight = maxBarHeight * (0.4 + wave1 * 0.6);
      } else if (isListening || isSpeaking) {
        // Dynamic wave for listening/speaking
        barHeight = maxBarHeight * (wave1 * 0.4 + wave2 * 0.35 + wave3 * 0.25);
      } else {
        // Gentle idle breathing
        barHeight = maxBarHeight * (0.3 + wave1 * 0.2);
      }

      const x = startX + i * (barWidth + gap);
      const y = centerY - barHeight / 2;

      // Create gradient
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);

      if (isListening) {
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0.9)");
      } else if (isSpeaking) {
        gradient.addColorStop(0, "rgba(200, 200, 200, 0.8)");
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.9)");
        gradient.addColorStop(1, "rgba(200, 200, 200, 0.8)");
      } else if (isProcessing) {
        const pulse = Math.sin(time * 4) * 0.3 + 0.7;
        gradient.addColorStop(0, `rgba(150, 150, 150, ${pulse * 0.6})`);
        gradient.addColorStop(0.5, `rgba(200, 200, 200, ${pulse * 0.8})`);
        gradient.addColorStop(1, `rgba(150, 150, 150, ${pulse * 0.6})`);
      } else {
        gradient.addColorStop(0, "rgba(100, 100, 100, 0.4)");
        gradient.addColorStop(0.5, "rgba(150, 150, 150, 0.5)");
        gradient.addColorStop(1, "rgba(100, 100, 100, 0.4)");
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
      ctx.fill();
    }

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    animationRef.current = requestAnimationFrame(animate);
  }, [isListening, isSpeaking, isProcessing]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("w-full h-full", className)}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
