"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Shield, Zap, Globe, Smartphone, Lock, CreditCard } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Features() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>(".bento-card");
      
      gsap.from(cards, {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
        }
      });
    },
    { scope: containerRef }
  );

  return (
    <section id="features" ref={containerRef} className="bg-white py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 max-w-2xl">
          <h2 className="text-5xl font-bold tracking-tight text-neutral-950 md:text-7xl">
            Everything you need. <br />
            <span className="text-[#22D3EE]">Nothing you don't.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2 h-[1200px] md:h-[800px]">
          {/* Large Card 1 */}
          <div className="bento-card group relative col-span-1 row-span-1 md:col-span-2 md:row-span-2 overflow-hidden rounded-[2rem] bg-neutral-50 p-10 transition-all hover:bg-neutral-100">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#22D3EE]/10 blur-3xl transition-all group-hover:bg-[#22D3EE]/20" />
            <Globe className="mb-8 h-12 w-12 text-[#22D3EE]" />
            <h3 className="text-4xl font-bold text-neutral-900">Global Network</h3>
            <p className="mt-4 max-w-md text-lg text-neutral-500">
              Access markets in over 150 countries with real-time currency conversion and local settlement.
            </p>
            <div className="absolute bottom-0 right-0 h-1/2 w-full translate-y-10 bg-gradient-to-t from-white to-transparent opacity-50" />
          </div>

          {/* Tall Card */}
          <div className="bento-card group relative col-span-1 row-span-1 md:row-span-2 overflow-hidden rounded-[2rem] bg-neutral-950 p-10 text-white transition-all hover:scale-[1.02]">
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#22D3EE] blur-[80px]" />
            <Shield className="mb-8 h-12 w-12 text-[#22D3EE]" />
            <h3 className="text-3xl font-bold">Vault Security</h3>
            <p className="mt-4 text-neutral-400">
              Military-grade encryption for every transaction. Your assets are insured up to $1M.
            </p>
            <div className="mt-12 flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl bg-white/5 p-4 backdrop-blur-sm">
                  <Lock className="h-5 w-5 text-[#22D3EE]" />
                  <div className="h-2 w-24 rounded-full bg-white/20" />
                </div>
              ))}
            </div>
          </div>

          {/* Wide Card */}
          <div className="bento-card group relative col-span-1 md:col-span-2 overflow-hidden rounded-[2rem] border border-neutral-200 bg-white p-10 transition-all hover:border-[#22D3EE]">
            <div className="flex items-start justify-between">
              <div>
                <Zap className="mb-6 h-10 w-10 text-[#22D3EE]" />
                <h3 className="text-2xl font-bold text-neutral-900">Instant Settlement</h3>
                <p className="mt-2 text-neutral-500">Funds arrive in seconds.</p>
              </div>
              <div className="text-5xl font-black text-neutral-100 group-hover:text-[#22D3EE]/20">0.1s</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
