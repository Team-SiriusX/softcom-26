"use client";

import { useState, useRef } from "react";
import { Check, X, Sparkles, Zap, Building2, ArrowRight, Home, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { client } from "@/lib/hono";
import { toast } from "sonner";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";

gsap.registerPlugin(useGSAP);

type BillingCycle = "monthly" | "annual";

const pricingTiers = [
  {
    name: "FREE",
    tier: "FREE",
    icon: Zap,
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Perfect for getting started with basic accounting",
    features: [
      { text: "Up to 50 transactions per month", included: true },
      { text: "Basic transaction entry (income, expenses)", included: true },
      { text: "Simple Profit & Loss statement", included: true },
      { text: "Basic Balance Sheet view", included: true },
      { text: "1 business account only", included: true },
      { text: "Export data to CSV", included: true },
      { text: "Email support (48-hour response)", included: true },
      { text: "AI features", included: false },
      { text: "Strategic CFO Agent", included: false },
      { text: "Tactical Advisor Agent", included: false },
      { text: "Cash flow predictions", included: false },
      { text: "Automated alerts", included: false },
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "PRO",
    tier: "PRO",
    icon: Sparkles,
    monthlyPrice: 49,
    annualPrice: 470, // ~$39/month
    monthlyPriceId:
      process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ||
      "price_1SgDUTANCfmBmRcJNfiirntx",
    annualPriceId:
      process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID ||
      "price_1SgDVzANCfmBmRcJgaCgAZFN",
    description: "AI-powered financial intelligence for growing businesses",
    features: [
      { text: "Everything in FREE, plus:", included: true, bold: true },
      { text: "Unlimited transactions", included: true },
      { text: "Up to 3 business accounts", included: true },
      { text: "Full analytics dashboard", included: true },
      { text: "Advanced financial reports", included: true },
      {
        text: "Strategic CFO Agent (Plan Mode)",
        included: true,
        highlight: true,
      },
      { text: "7-day cash flow predictions", included: true },
      { text: "30 AI queries per month", included: true },
      { text: "Automated alerts & warnings", included: true },
      { text: "Expense pattern analysis", included: true },
      { text: "Priority email support (24-hour)", included: true },
      { text: "Tactical Advisor (crisis response)", included: false },
      { text: "30-day predictions", included: false },
      { text: "Scenario simulations", included: false },
    ],
    cta: "Start 14-Day Free Trial",
    popular: true,
  },
  {
    name: "BUSINESS",
    tier: "BUSINESS",
    icon: Building2,
    monthlyPrice: 99,
    annualPrice: 950, // ~$79/month
    monthlyPriceId:
      process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID ||
      "price_1SgDVbANCfmBmRcJi74rbyDI",
    annualPriceId:
      process.env.NEXT_PUBLIC_STRIPE_BUSINESS_ANNUAL_PRICE_ID ||
      "price_1SgDVBANCfmBmRcJdGBajtkq",
    description: "Complete AI CFO system with real-time crisis management",
    features: [
      { text: "Everything in PRO, plus:", included: true, bold: true },
      {
        text: "Tactical Advisor Agent (Now Mode)",
        included: true,
        highlight: true,
      },
      { text: "Real-time crisis response chat", included: true },
      { text: "30-day cash flow predictions", included: true },
      { text: "150 AI queries per month", included: true },
      { text: "Dual-Agent system (both agents)", included: true },
      { text: "Scenario simulations", included: true },
      { text: "Unlimited business accounts", included: true },
      { text: "WhatsApp/SMS integration", included: true },
      { text: "Voice chat with AI CFO", included: true },
      { text: "API access for integrations", included: true },
      { text: "Custom financial models", included: true },
      { text: "Priority 24/7 chat support", included: true },
    ],
    cta: "Start 14-Day Free Trial",
    popular: false,
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      tl.from(".pricing-header", {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      })
        .from(
          ".pricing-toggle",
          {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.6"
        )
        .from(
          ".pricing-card",
          {
            y: 80,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out",
          },
          "-=0.4"
        )
        .from(
          ".pricing-footer",
          {
            y: 30,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
          },
          "-=0.3"
        );
    },
    { scope: containerRef }
  );

  const handleSubscribe = async (tier: string, priceId?: string) => {
    if (tier === "FREE") {
      if (!session) {
        router.push("/auth/sign-in?callbackUrl=/dashboard");
      } else {
        router.push("/dashboard");
      }
      return;
    }

    if (!session) {
      router.push("/auth/sign-in?callbackUrl=/pricing");
      return;
    }

    if (!priceId) {
      toast.error("Invalid pricing configuration");
      return;
    }

    setLoading(tier);

    try {
      const response = await client.api.stripe["create-checkout-session"]["$post"](
        {
          json: {
            priceId,
            mode: "subscription",
            successUrl: `${window.location.origin}/dashboard?subscription=success`,
            cancelUrl: `${window.location.origin}/pricing?subscription=canceled`,
            metadata: {
              userId: session.user.id,
              tier,
            },
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to start subscription. Please try again.");
      setLoading(null);
    }
  };

  const getPriceId = (tier: (typeof pricingTiers)[0]) => {
    if (tier.tier === "FREE") return undefined;
    return billingCycle === "monthly"
      ? tier.monthlyPriceId
      : tier.annualPriceId;
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-white"
    >
      {/* Navigation Header */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-200/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22D3EE]">
              <span className="text-lg font-black text-white">F</span>
            </div>
            <span className="text-lg font-bold text-neutral-950">
              FUTURE <span className="text-[#22D3EE]">FINANCE</span>
            </span>
          </Link>

          {/* Navigation Actions */}
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-full px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                <Home size={16} className="mr-2" />
                Home
              </Button>
            </Link>
            {session ? (
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="h-9 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-neutral-800"
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
                    className="h-9 rounded-full px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button
                    size="sm"
                    className="h-9 rounded-full bg-[#22D3EE] px-4 text-sm font-semibold text-white shadow-lg shadow-[#22D3EE]/30 hover:bg-[#06B6D4]"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22D3EE]/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-[#22D3EE]/5 blur-[100px]" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-neutral-100 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 pt-32 lg:px-8">{/* pt-32 for header spacing */}
        {/* Header */}
        <div className="pricing-header mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-1.5 shadow-sm">
            <Sparkles className="h-4 w-4 text-[#22D3EE]" />
            <span className="text-sm font-medium text-neutral-600">
              Simple, transparent pricing
            </span>
          </div>

          <h1 className="text-5xl font-black tracking-tight text-neutral-950 sm:text-6xl md:text-7xl">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-[#22D3EE] to-[#0EA5E9] bg-clip-text text-transparent">
              AI CFO
            </span>{" "}
            Plan
          </h1>
          <p className="mt-6 text-lg font-medium text-neutral-500 sm:text-xl">
            Start with basic accounting, upgrade for AI-powered intelligence
            that scales with your business
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="pricing-toggle mt-12 flex justify-center">
          <div className="relative inline-flex items-center gap-1 rounded-full bg-neutral-100 p-1.5">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`relative z-10 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
                billingCycle === "monthly"
                  ? "text-neutral-950"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`relative z-10 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
                billingCycle === "annual"
                  ? "text-neutral-950"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Annual
            </button>
            {/* Sliding background */}
            <div
              className={`absolute top-1.5 h-[calc(100%-12px)] w-[calc(50%-6px)] rounded-full bg-white shadow-md transition-all duration-300 ease-out ${
                billingCycle === "annual"
                  ? "left-[calc(50%+3px)]"
                  : "left-1.5"
              }`}
            />
          </div>
          {billingCycle === "annual" && (
            <div className="ml-3 flex items-center">
              <Badge className="bg-[#22D3EE] text-white shadow-lg shadow-[#22D3EE]/30">
                Save 20%
              </Badge>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {pricingTiers.map((tier, index) => {
            const Icon = tier.icon;
            const isPopular = tier.popular;

            return (
              <div
                key={tier.name}
                className={`pricing-card group relative overflow-hidden rounded-[2rem] transition-all duration-500 ${
                  isPopular
                    ? "bg-neutral-950 text-white lg:-mt-4 lg:mb-4"
                    : "border border-neutral-200 bg-white hover:border-[#22D3EE]/50 hover:shadow-xl hover:shadow-[#22D3EE]/5"
                }`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -right-12 top-8 rotate-45 bg-[#22D3EE] px-12 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                    Most Popular
                  </div>
                )}

                {/* Glow effect for popular card */}
                {isPopular && (
                  <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-[#22D3EE] blur-[80px] opacity-50" />
                )}

                <div className="relative p-8 lg:p-10">
                  {/* Icon and Name */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                        isPopular ? "bg-white/10" : "bg-neutral-100"
                      }`}
                    >
                      <Icon
                        className={`h-7 w-7 ${
                          isPopular ? "text-[#22D3EE]" : "text-neutral-700"
                        }`}
                      />
                    </div>
                    <div>
                      <h3
                        className={`text-xl font-bold ${
                          isPopular ? "text-white" : "text-neutral-950"
                        }`}
                      >
                        {tier.name}
                      </h3>
                      <p
                        className={`text-sm ${
                          isPopular ? "text-neutral-400" : "text-neutral-500"
                        }`}
                      >
                        {tier.description}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-8">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-5xl font-black tracking-tight ${
                          isPopular ? "text-white" : "text-neutral-950"
                        }`}
                      >
                        {tier.monthlyPrice === 0
                          ? "Free"
                          : `$${
                              billingCycle === "monthly"
                                ? tier.monthlyPrice
                                : Math.round(tier.annualPrice / 12)
                            }`}
                      </span>
                      {tier.monthlyPrice > 0 && (
                        <span
                          className={`text-lg ${
                            isPopular ? "text-neutral-400" : "text-neutral-500"
                          }`}
                        >
                          /month
                        </span>
                      )}
                    </div>
                    {tier.monthlyPrice > 0 && billingCycle === "annual" && (
                      <p
                        className={`mt-1 text-sm ${
                          isPopular ? "text-neutral-500" : "text-neutral-400"
                        }`}
                      >
                        ${tier.annualPrice} billed annually
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`mt-8 w-full rounded-xl py-6 text-base font-semibold transition-all duration-300 ${
                      isPopular
                        ? "bg-[#22D3EE] text-white hover:bg-[#06B6D4] hover:shadow-lg hover:shadow-[#22D3EE]/30"
                        : "bg-neutral-950 text-white hover:bg-neutral-800"
                    }`}
                    onClick={() =>
                      handleSubscribe(tier.tier, getPriceId(tier))
                    }
                    disabled={loading === tier.tier}
                  >
                    {loading === tier.tier ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="h-5 w-5 animate-spin"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {tier.cta}
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </Button>

                  {/* Features Divider */}
                  <div
                    className={`my-8 h-px ${
                      isPopular ? "bg-white/10" : "bg-neutral-200"
                    }`}
                  />

                  {/* Features */}
                  <ul className="space-y-4">
                    {tier.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className={`flex items-start gap-3 ${
                          "bold" in feature && feature.bold
                            ? "mt-6 font-semibold"
                            : ""
                        }`}
                      >
                        {feature.included ? (
                          <div
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              isPopular
                                ? "bg-[#22D3EE]/20"
                                : "bg-[#22D3EE]/10"
                            }`}
                          >
                            <Check
                              className={`h-3 w-3 ${
                                isPopular
                                  ? "text-[#22D3EE]"
                                  : "text-[#22D3EE]"
                              }`}
                            />
                          </div>
                        ) : (
                          <div
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              isPopular ? "bg-white/5" : "bg-neutral-100"
                            }`}
                          >
                            <X
                              className={`h-3 w-3 ${
                                isPopular
                                  ? "text-neutral-600"
                                  : "text-neutral-400"
                              }`}
                            />
                          </div>
                        )}
                        <span
                          className={`text-sm ${
                            !feature.included
                              ? isPopular
                                ? "text-neutral-600 line-through"
                                : "text-neutral-400 line-through"
                              : "highlight" in feature && feature.highlight
                              ? "font-medium text-[#22D3EE]"
                              : isPopular
                              ? "text-neutral-300"
                              : "text-neutral-600"
                          }`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pricing-footer mt-20 text-center">
          <div className="mx-auto max-w-2xl rounded-2xl border border-neutral-200 bg-neutral-50 p-8">
            <div className="flex items-center justify-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#22D3EE]/10">
                <Sparkles className="h-5 w-5 text-[#22D3EE]" />
              </div>
              <p className="text-lg font-semibold text-neutral-900">
                All paid plans include a 14-day free trial
              </p>
            </div>
            <p className="mt-3 text-neutral-500">
              No credit card required to start. Cancel anytime.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-neutral-500">
              <span>Questions?</span>
              <a
                href="mailto:support@example.com"
                className="font-medium text-[#22D3EE] transition-colors hover:text-[#0EA5E9]"
              >
                Contact our team →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
