"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const metrics = [
  { value: 50, suffix: "M+", label: "Transactions Processed" },
  { value: 99.99, suffix: "%", label: "Uptime Guarantee" },
  { value: 150, suffix: "+", label: "Countries Supported" },
  { value: 2, suffix: "B+", label: "Assets Secured" },
];

export default function Metrics() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>(".metric-item");

      items.forEach((item) => {
        const valueElement = item.querySelector(".metric-value");
        const targetValue = parseFloat(item.dataset.value || "0");

        gsap.fromTo(
          valueElement,
          { innerText: 0 },
          {
            innerText: targetValue,
            duration: 2,
            ease: "power2.out",
            snap: { innerText: 1 }, // Snap to integers (or handle decimals manually if needed)
            scrollTrigger: {
              trigger: item,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
            onUpdate: function () {
              if (valueElement) {
                // Format number with commas or decimals
                const current = parseFloat(this.targets()[0].innerText);
                if (targetValue % 1 !== 0) {
                   valueElement.textContent = current.toFixed(2);
                } else {
                   valueElement.textContent = Math.round(current).toString();
                }
              }
            },
          }
        );
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      id="metrics"
      ref={containerRef}
      className="relative w-full border-y border-neutral-100 bg-white py-16 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-6 md:gap-12 md:grid-cols-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="metric-item flex flex-col items-center text-center"
              data-value={metric.value}
            >
              <div className="mb-2 flex items-baseline text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900">
                <span className="metric-value">0</span>
                <span className="text-[#22D3EE]">{metric.suffix}</span>
              </div>
              <p className="text-xs md:text-sm font-medium uppercase tracking-wider text-neutral-500">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
