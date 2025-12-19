"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function CTA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(cardRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative flex w-full items-center justify-center bg-white py-32 px-4"
    >
      <div
        ref={cardRef}
        className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50 p-12 text-center shadow-2xl md:p-24"
      >
        {/* Glow Effect */}
        <div className="absolute -top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#22D3EE]/20 blur-[100px]" />

        <div className="relative z-10 space-y-8">
          <h2 className="text-4xl font-bold text-neutral-900 md:text-6xl">
            Ready to Shape the Future?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-neutral-500">
            Join thousands of forward-thinking individuals and businesses who are
            already experiencing the next generation of financial technology.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-14 min-w-[200px] bg-[#22D3EE] text-lg font-semibold text-white hover:bg-[#22D3EE]/90 shadow-lg shadow-[#22D3EE]/30"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          
          <p className="text-sm text-neutral-400">
            No credit card required for demo.
          </p>
        </div>
      </div>
    </section>
  );
}
