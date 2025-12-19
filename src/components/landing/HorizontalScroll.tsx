"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const cards = [
  {
    id: "01",
    title: "Global Infrastructure",
    description: "Built on a network that spans 150+ countries with 99.99% uptime.",
  },
  {
    id: "02",
    title: "Real-time Intelligence",
    description: "Processing millions of data points per second to give you the edge.",
  },
  {
    id: "03",
    title: "Seamless Integration",
    description: "Drop-in APIs that work with your existing stack in minutes.",
  },
  {
    id: "04",
    title: "Bank-Grade Security",
    description: "Enterprise-level encryption and compliance out of the box.",
  },
  {
    id: "05",
    title: "Automated Compliance",
    description: "Stay ahead of regulations with our AI-driven compliance engine.",
  },
  {
    id: "06",
    title: "24/7 Expert Support",
    description: "Dedicated financial experts available round the clock for your needs.",
  },
];

export default function HorizontalScroll() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const getScrollAmount = () => {
        let slidesWidth = sectionRef.current!.scrollWidth;
        return -(slidesWidth - window.innerWidth);
      };

      const tween = gsap.to(sectionRef.current, {
        x: getScrollAmount,
        ease: "none",
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          end: () => `+=${Math.abs(getScrollAmount())}`,
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      const cards = gsap.utils.toArray<HTMLElement>(".horizontal-card");
      cards.forEach((card) => {
        gsap.from(card.querySelector(".card-inner"), {
          scale: 0.8,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            containerAnimation: tween,
            start: "left center+=200",
            toggleActions: "play none none reverse",
          },
        });
      });

      return () => {
        tween.kill();
      };
    },
    { scope: triggerRef }
  );

  return (
    <section ref={triggerRef} className="relative overflow-hidden bg-white">
      {/* Background Blur */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22D3EE]/5 blur-[100px]" />
        <div className="absolute right-0 bottom-0 h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-[#22D3EE]/5 blur-[100px]" />
      </div>

      <div
        ref={sectionRef}
        className="relative z-10 flex h-screen flex-nowrap flex-row items-center"
        style={{ width: `${(cards.length + 1) * 100}vw` }}
      >
        {/* Intro Slide */}
        <div className="flex h-full w-screen flex-shrink-0 flex-col justify-center px-12 md:px-24">
          <h2 className="text-6xl font-black uppercase tracking-tighter text-neutral-900 md:text-9xl">
            The <span className="text-[#22D3EE]">Process</span>
          </h2>
          <p className="mt-8 max-w-xl text-xl text-neutral-500">
            Scroll to explore how we transform the financial landscape.
          </p>
          <div className="mt-8 flex items-center gap-2 text-[#22D3EE]">
            <span className="text-sm font-bold uppercase tracking-widest">Scroll Right</span>
            <ArrowRight className="animate-pulse" />
          </div>
        </div>

        {/* Cards */}
        {cards.map((card) => (
          <div
            key={card.id}
            className="horizontal-card flex h-full w-screen flex-shrink-0 items-center justify-center px-8"
          >
            <div className="card-inner group relative flex h-[60vh] w-full max-w-4xl flex-col justify-between overflow-hidden rounded-[3rem] bg-neutral-50 p-12 transition-all duration-500 hover:bg-[#22D3EE] hover:shadow-2xl hover:shadow-[#22D3EE]/30 md:p-24 border border-neutral-100">
              <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#22D3EE]/10 blur-3xl transition-all duration-500 group-hover:bg-white/20" />
              
              <span className="font-mono text-8xl font-bold text-neutral-200 transition-colors duration-300 group-hover:text-white/40">
                {card.id}
              </span>

              <div className="relative z-10">
                <h3 className="text-4xl font-bold text-neutral-900 transition-colors duration-300 group-hover:text-white md:text-6xl">
                  {card.title}
                </h3>
                <p className="mt-6 max-w-2xl text-xl text-neutral-500 transition-colors duration-300 group-hover:text-white/90">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
