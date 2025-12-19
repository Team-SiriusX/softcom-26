"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const texts = gsap.utils.toArray<HTMLElement>(".story-text");

      texts.forEach((text) => {
        gsap.fromTo(
          text,
          { opacity: 0.1, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            color: "#FFFFFF",
            scrollTrigger: {
              trigger: text,
              start: "top 80%",
              end: "top 40%",
              scrub: true,
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      gsap.to(progressBarRef.current, {
        height: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top center",
          end: "bottom center",
          scrub: true,
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-[200vh] w-full flex-col items-center bg-[#0B0E14] py-24"
    >
      <div className="absolute left-8 top-0 h-full w-[2px] bg-[#22D3EE]/10 md:left-1/2 md:-translate-x-1/2">
        <div
          ref={progressBarRef}
          className="h-0 w-full bg-gradient-to-b from-[#22D3EE] to-transparent"
        />
      </div>

      <div ref={textRef} className="relative z-10 w-full max-w-4xl space-y-48 px-4">
        <div className="story-text flex flex-col items-start md:items-end md:pr-16">
          <h2 className="text-4xl font-bold text-neutral-600 md:text-6xl">
            It started with a <span className="text-[#22D3EE]">vision</span>.
          </h2>
          <p className="mt-4 max-w-md text-lg text-neutral-500 md:text-right">
            To simplify the complex world of finance into a single, intuitive interface.
          </p>
        </div>

        <div className="story-text flex flex-col items-start md:pl-16">
          <h2 className="text-4xl font-bold text-neutral-600 md:text-6xl">
            Powered by <span className="text-[#22D3EE]">intelligence</span>.
          </h2>
          <p className="mt-4 max-w-md text-lg text-neutral-500">
            Our AI algorithms analyze market trends in real-time to give you the edge.
          </p>
        </div>

        <div className="story-text flex flex-col items-start md:items-end md:pr-16">
          <h2 className="text-4xl font-bold text-neutral-600 md:text-6xl">
            Built for <span className="text-[#22D3EE]">scale</span>.
          </h2>
          <p className="mt-4 max-w-md text-lg text-neutral-500 md:text-right">
            Whether you're an individual or an enterprise, our infrastructure grows with you.
          </p>
        </div>
      </div>
    </section>
  );
}
