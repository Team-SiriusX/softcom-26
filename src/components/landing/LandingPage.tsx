"use client";

import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Home, Activity, Grid, Bot, BarChart, Mail } from "lucide-react";
import Hero from "./Hero";
import HorizontalScroll from "./HorizontalScroll";
import Features from "./Features";
import AISection from "./AISection";
import Metrics from "./Metrics";
import CTA from "./CTA";
import Footer from "./Footer";
import DynamicNavigation from "../ui/dynamic-navigation";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  useEffect(() => {
    const lenis = new Lenis();

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  const navLinks = [
    { id: "home", label: "Home", href: "#", icon: <Home size={16} /> },
    { id: "process", label: "Process", href: "#", icon: <Activity size={16} /> },
    { id: "features", label: "Features", href: "#", icon: <Grid size={16} /> },
    { id: "ai", label: "AI", href: "#", icon: <Bot size={16} /> },
    { id: "metrics", label: "Metrics", href: "#", icon: <BarChart size={16} /> },
    { id: "contact", label: "Contact", href: "#", icon: <Mail size={16} /> },
  ];

  return (
    <main className="flex min-h-screen flex-col bg-white text-neutral-900 selection:bg-[#22D3EE] selection:text-white relative">
      <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2">
        <DynamicNavigation 
          links={navLinks}
          backgroundColor="rgba(255, 255, 255, 0.8)"
          highlightColor="rgba(34, 211, 238, 0.15)"
          textColor="#171717"
          glowIntensity={0}
          className="border-neutral-200/50"
        />
      </div>
      <Hero />
      <HorizontalScroll />
      <Features />
      <AISection />
      <Metrics />
      <CTA />
      <Footer />
    </main>
  );
}
