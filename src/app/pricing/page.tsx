"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { client } from "@/lib/hono";
import { toast } from "sonner";

type BillingCycle = "monthly" | "annual";

const pricingTiers = [
  {
    name: "FREE",
    tier: "FREE",
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
    monthlyPrice: 49,
    annualPrice: 470, // ~$39/month
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || "price_1SgDUTANCfmBmRcJNfiirntx",
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID || "price_1SgDVzANCfmBmRcJgaCgAZFN",
    description: "AI-powered financial intelligence for growing businesses",
    features: [
      { text: "Everything in FREE, plus:", included: true, bold: true },
      { text: "Unlimited transactions", included: true },
      { text: "Up to 3 business accounts", included: true },
      { text: "Full analytics dashboard", included: true },
      { text: "Advanced financial reports", included: true },
      { text: "Strategic CFO Agent (Plan Mode)", included: true, highlight: true },
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
    monthlyPrice: 99,
    annualPrice: 950, // ~$79/month
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID || "price_1SgDVbANCfmBmRcJi74rbyDI",
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_ANNUAL_PRICE_ID || "price_1SgDVBANCfmBmRcJdGBajtkq",
    description: "Complete AI CFO system with real-time crisis management",
    features: [
      { text: "Everything in PRO, plus:", included: true, bold: true },
      { text: "Tactical Advisor Agent (Now Mode)", included: true, highlight: true },
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
      const response = await client.api.stripe["create-checkout-session"].$post({
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
      });

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

  const getPrice = (tier: typeof pricingTiers[0]) => {
    if (tier.monthlyPrice === 0) return "Free";
    
    const price = billingCycle === "monthly" ? tier.monthlyPrice : tier.annualPrice;
    const perMonth = billingCycle === "annual" ? ` (${Math.round(tier.annualPrice / 12)}/mo)` : "/mo";
    
    return `$${price}${billingCycle === "annual" ? "/yr" : perMonth}`;
  };

  const getPriceId = (tier: typeof pricingTiers[0]) => {
    if (tier.tier === "FREE") return undefined;
    return billingCycle === "monthly" ? tier.monthlyPriceId : tier.annualPriceId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your AI CFO Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Start with basic accounting, upgrade for AI-powered intelligence
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-gray-700 shadow-sm font-medium"
                  : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === "annual"
                  ? "bg-white dark:bg-gray-700 shadow-sm font-medium"
                  : "text-muted-foreground"
              }`}
            >
              Annual
              <Badge variant="secondary" className="ml-2">
                Save 20%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative ${
                tier.popular
                  ? "border-primary shadow-lg scale-105"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{getPrice(tier)}</span>
                  {tier.monthlyPrice > 0 && billingCycle === "annual" && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Billed annually
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li
                      key={index}
                      className={`flex items-start gap-2 ${
                        feature.bold ? "font-semibold mt-4" : ""
                      } ${feature.highlight ? "text-primary" : ""}`}
                    >
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />
                      )}
                      <span className={!feature.included ? "text-muted-foreground line-through" : ""}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  variant={tier.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(tier.tier, getPriceId(tier))}
                  disabled={loading === tier.tier}
                >
                  {loading === tier.tier ? "Loading..." : tier.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center text-muted-foreground">
          <p className="mb-2">
            All paid plans include a 14-day free trial. No credit card required to start.
          </p>
          <p>
            Questions? Contact us at{" "}
            <a href="mailto:support@example.com" className="text-primary hover:underline">
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
