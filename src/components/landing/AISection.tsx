"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Database, Brain, Zap } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function AISection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=300%",
          scrub: true,
          pin: true,
          anticipatePin: 1,
        },
      });

      // Step 1: Data (Initial State) -> Step 2: Insight
      tl.to(".step-1", { opacity: 0.2, scale: 0.8, duration: 1 })
        .fromTo(
          ".step-2",
          { opacity: 0, scale: 1.2, y: 50 },
          { opacity: 1, scale: 1, y: 0, duration: 1 }
        )
        .to(".line-1", { height: "100%", duration: 1 }, "<");

      // Step 2: Insight -> Step 3: Action
      tl.to(".step-2", { opacity: 0.2, scale: 0.8, duration: 1 })
        .fromTo(
          ".step-3",
          { opacity: 0, scale: 1.2, y: 50 },
          { opacity: 1, scale: 1, y: 0, duration: 1 }
        )
        .to(".line-2", { height: "100%", duration: 1 }, "<");
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative flex h-screen w-full items-center justify-center bg-white overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#22D3EE]/5 via-transparent to-transparent" />

      <div className="grid w-full max-w-6xl grid-cols-1 gap-12 px-4 md:grid-cols-2">
        {/* Left: Visuals */}
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="step-1 flex flex-col items-center text-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#22D3EE]/10 text-[#22D3EE] shadow-xl shadow-[#22D3EE]/20">
              <Database className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900">Raw Data</h3>
            <p className="text-neutral-500">Millions of data points processed instantly.</p>
          </div>

          <div className="line-1 h-0 w-1 bg-[#22D3EE]" />

          <div className="step-2 flex flex-col items-center text-center opacity-0">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#22D3EE]/10 text-[#22D3EE] shadow-xl shadow-[#22D3EE]/20">
              <Brain className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900">AI Insight</h3>
            <p className="text-neutral-500">Patterns detected and analyzed by our core.</p>
          </div>

          <div className="line-2 h-0 w-1 bg-[#22D3EE]" />

          <div className="step-3 flex flex-col items-center text-center opacity-0">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#22D3EE]/10 text-[#22D3EE] shadow-xl shadow-[#22D3EE]/20">
              <Zap className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900">Smart Action</h3>
            <p className="text-neutral-500">Automated execution for optimal results.</p>
          </div>
        </div>

        {/* Right: Text Context */}
        <div className="flex flex-col justify-center space-y-6">
          <h2 className="text-4xl font-bold leading-tight text-neutral-900 md:text-6xl">
            From Data to <br />
            <span className="text-[#22D3EE]">Decision</span>
          </h2>
          <p className="text-lg text-neutral-500">
            Our proprietary AI engine transforms raw market data into actionable
            financial strategies in milliseconds. Watch as complexity becomes
            clarity.
          </p>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-[#22D3EE] animate-pulse" />
              <span className="font-mono text-sm text-[#22D3EE]">
                System Active: Processing...
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-2 w-3/4 rounded bg-neutral-100" />
              <div className="h-2 w-1/2 rounded bg-neutral-100" />
              <div className="h-2 w-5/6 rounded bg-neutral-100" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
