"use client";

import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Home,
  Activity,
  Grid,
  Bot,
  BarChart,
  DollarSign,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
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

  const { data: session } = useSession();
[,]
  const navLinks = [
    { id: "home", label: "Home", href: "#home", icon: <Home size={16} /> },
    {
      id: "process",
      label: "Process",
      href: "#process",
      icon: <Activity size={16} />,
    },
    {
      id: "features",
      label: "Features",
      href: "#features",
      icon: <Grid size={16} />,
    },
    { id: "ai", label: "AI", href: "#ai", icon: <Bot size={16} /> },
    {
      id: "metrics",
      label: "Metrics",
      href: "#metrics",
      icon: <BarChart size={16} />,
    },
    {
      id: "pricing",
      label: "Pricing",
      href: "/pricing",
      icon: <DollarSign size={16} />,
    },
  ];

  return (
    <main className="flex min-h-screen flex-col bg-white text-neutral-900 selection:bg-[#22D3EE] selection:text-white relative">
      {/* Navigation */}
      <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3">
        <DynamicNavigation
          links={navLinks}
          backgroundColor="rgba(255, 255, 255, 0.8)"
          highlightColor="rgba(34, 211, 238, 0.15)"
          textColor="#171717"
          glowIntensity={0}
          className="border-neutral-200/50"
        />

        {/* Auth Buttons */}
        <div className="flex items-center gap-2">
          {session ? (
            <Link href="/dashboard">
              <Button
                size="sm"
                className="h-10 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                <LayoutDashboard size={16} className="mr-2" />
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/sign-in">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-full px-5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button
                  size="sm"
                  className="h-10 rounded-full bg-[#22D3EE] px-5 text-sm font-semibold text-white shadow-lg shadow-[#22D3EE]/30 hover:bg-[#06B6D4]"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
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
