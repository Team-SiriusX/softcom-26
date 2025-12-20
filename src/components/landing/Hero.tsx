"use client";

import { useRef, Suspense } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { Environment, Float, ContactShadows, OrbitControls } from "@react-three/drei";
import { Model } from "../3d Model/Cash_register";

gsap.registerPlugin(useGSAP);

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      // Initial Reveal
      tl.from(titleRef.current, {
        y: 100,
        skewY: 5,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
      })
      .from(".hero-tag", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.1
      }, "-=0.8")
      .from(".hero-3d", {
        x: 100,
        opacity: 0,
        duration: 1.5,
        ease: "power3.out"
      }, "-=1");

    },
    { scope: containerRef }
  );

  return (
    <section
      id="home"
      ref={containerRef}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-white px-4 sm:px-6 pt-24 md:pt-20 lg:flex-row lg:justify-between lg:px-24"
    >
      {/* Background Gradients */}
      <div className="absolute left-0 top-0 -z-10 h-[300px] md:h-[500px] w-[300px] md:w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22D3EE]/10 blur-[80px] md:blur-[120px]" />
      <div className="absolute right-0 bottom-0 -z-10 h-[300px] md:h-[500px] w-[300px] md:w-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-[#22D3EE]/10 blur-[80px] md:blur-[120px]" />

      {/* Text Content */}
      <div className="relative z-10 flex flex-col items-start text-left w-full lg:w-1/2">
        <div className="mb-4 md:mb-6 flex gap-2 md:gap-3 flex-wrap">
          <span className="hero-tag rounded-full border border-neutral-200 bg-white px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-medium text-neutral-600 shadow-sm">
            Next Gen Fintech
          </span>
          <span className="hero-tag rounded-full bg-[#22D3EE] px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-bold text-white shadow-lg shadow-[#22D3EE]/30">
            v1.0 Live
          </span>
        </div>

        <h1
          ref={titleRef}
          className="max-w-4xl text-4xl font-black tracking-tighter text-neutral-950 sm:text-6xl md:text-7xl lg:text-8xl"
        >
          FUTURE <br />
          <span className="text-[#22D3EE]">FINANCE</span>
        </h1>

        <p className="hero-tag mt-4 md:mt-6 max-w-xl text-base md:text-lg font-medium text-neutral-500 sm:text-xl">
          Reimagining the digital economy with precision, speed, and unmatched elegance. Experience the new standard.
        </p>
        
        <div className="hero-tag mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
          <Button
            size="lg"
            className="h-12 md:h-14 rounded-full bg-neutral-950 px-6 md:px-8 text-base md:text-lg font-semibold text-white hover:bg-neutral-800 w-full sm:w-auto"
          >
            Start Now
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="group h-12 md:h-14 rounded-full border-neutral-200 px-6 md:px-8 text-base md:text-lg font-semibold text-neutral-950 hover:border-[#22D3EE] hover:bg-white w-full sm:w-auto"
          >
            Watch Reel
            <ArrowRight className="ml-2 h-4 md:h-5 w-4 md:w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>

      {/* 3D Model Section */}
      <div className="hero-3d relative h-[40vh] sm:h-[50vh] w-full mt-8 lg:mt-0 lg:h-[80vh] lg:w-1/2">
        <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <Environment preset="city" />
            <Suspense fallback={null}>
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <Model scale={4} position={[0, -0.5, 0]} rotation={[0, -0.5, 0]} />
                </Float>
                <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
            </Suspense>
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>
    </section>
  );
}
