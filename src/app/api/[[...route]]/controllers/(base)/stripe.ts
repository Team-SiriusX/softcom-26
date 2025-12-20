/**
 * Stripe Payment Integration Controller
 * Handles payment processing, subscriptions, and webhooks
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/current-user";

const app = new Hono()
  /**
   * POST /api/stripe/create-payment-intent
   * Create a payment intent for one-time payments
   */
  .post(
    "/create-payment-intent",
    zValidator(
      "json",
      z.object({
        amount: z.number().positive(),
        currency: z.string().default("usd"),
        description: z.string().optional(),
        metadata: z.record(z.string()).optional(),
      })
    ),
    async (c) => {
      const user = await currentUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { amount, currency, description, metadata } = c.req.valid("json");

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          description,
          metadata: {
            userId: user.id,
            ...metadata,
          },
        });

        return c.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        });
      } catch (error: any) {
        console.error("Error creating payment intent:", error);
        return c.json({ error: error.message }, 500);
      }
    }
  )

  /**
   * POST /api/stripe/create-checkout-session
   * Create a Stripe Checkout session
   */
  .post(
    "/create-checkout-session",
    zValidator(
      "json",
      z.object({
        priceId: z.string().optional(),
        amount: z.number().positive().optional(),
        currency: z.string().default("usd"),
        mode: z.enum(["payment", "subscription"]).default("payment"),
        successUrl: z.string(),
        cancelUrl: z.string(),
        metadata: z.record(z.string()).optional(),
      })
    ),
    async (c) => {
      const user = await currentUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { priceId, amount, currency, mode, successUrl, cancelUrl, metadata } =
        c.req.valid("json");

      try {
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
          mode,
          success_url: successUrl,
          cancel_url: cancelUrl,
          customer_email: user.email,
          metadata: {
            userId: user.id,
            ...metadata,
          },
          line_items: [],
        };

        if (mode === "subscription" && priceId) {
          sessionParams.line_items = [
            {
              price: priceId,
              quantity: 1,
            },
          ];
        } else if (mode === "payment" && amount) {
          sessionParams.line_items = [
            {
              price_data: {
                currency,
                unit_amount: Math.round(amount * 100),
                product_data: {
                  name: "Payment",
                },
              },
              quantity: 1,
            },
          ];
        } else {
          return c.json(
            { error: "Invalid parameters: priceId required for subscription, amount for payment" },
            400
          );
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return c.json({
          sessionId: session.id,
          url: session.url,
        });
      } catch (error: any) {
        console.error("Error creating checkout session:", error);
        return c.json({ error: error.message }, 500);
      }
    }
  )

  /**
   * GET /api/stripe/payment-intent/:paymentIntentId
   * Get payment intent details
   */
  .get("/payment-intent/:paymentIntentId", async (c) => {
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { paymentIntentId } = c.req.param();

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return c.json({
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        created: paymentIntent.created,
        metadata: paymentIntent.metadata,
      });
    } catch (error: any) {
      console.error("Error retrieving payment intent:", error);
      return c.json({ error: error.message }, 500);
    }
  })

  /**
   * GET /api/stripe/customer
   * Get or create Stripe customer for current user
   */
  .get("/customer", async (c) => {
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      // Search for existing customer
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      let customer: Stripe.Customer;

      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        // Create new customer
        customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: user.id,
          },
        });
      }

      return c.json({
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
      });
    } catch (error: any) {
      console.error("Error with customer:", error);
      return c.json({ error: error.message }, 500);
    }
  })

  /**
   * POST /api/stripe/webhook
   * Handle Stripe webhooks
   */
  .post("/webhook", async (c) => {
    const signature = c.req.header("stripe-signature");

    if (!signature) {
      return c.json({ error: "No signature" }, 400);
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return c.json({ error: "Webhook secret not configured" }, 500);
    }

    try {
      const body = await c.req.text();
      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

      // Handle payment_intent.succeeded event
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment intent succeeded:", paymentIntent.id);

        const userId = paymentIntent.metadata?.userId;
        const customerId = paymentIntent.customer as string;

        if (!userId) {
          console.error("No userId in payment intent metadata");
          return c.json({ error: "No userId in metadata" }, 400);
        }

        // Get invoice to retrieve subscription details
        const invoice = paymentIntent.invoice
          ? await stripe.invoices.retrieve(paymentIntent.invoice as string)
          : null;

        if (invoice && invoice.subscription) {
          // This is a subscription payment
          const stripeSubscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          const priceId = stripeSubscription.items.data[0].price.id;

          // Determine tier based on price ID
          let tier: "PRO" | "BUSINESS" = "PRO";
          let billingCycle: "MONTHLY" | "ANNUAL" = "MONTHLY";

          if (
            priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID ||
            priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID
          ) {
            tier = "PRO";
            billingCycle = priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID ? "ANNUAL" : "MONTHLY";
          } else if (
            priceId === process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID ||
            priceId === process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID
          ) {
            tier = "BUSINESS";
            billingCycle =
              priceId === process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID ? "ANNUAL" : "MONTHLY";
          }

          // Set limits based on tier
          const aiQueriesLimit = tier === "PRO" ? 30 : 150;
          const transactionsLimit = -1; // unlimited for paid tiers
          const businessAccountsLimit = tier === "PRO" ? 3 : -1;

          // Update user and subscription in database
          await db.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId: customerId,
              subscriptionTier: tier,
            },
          });

          await db.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeSubscriptionId: invoice.subscription as string,
              stripePriceId: priceId,
              stripeCurrentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              tier,
              status: "ACTIVE",
              billingCycle,
              aiQueriesLimit,
              transactionsLimit,
              businessAccountsLimit,
            },
            update: {
              stripeSubscriptionId: invoice.subscription as string,
              stripePriceId: priceId,
              stripeCurrentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              tier,
              status: "ACTIVE",
              billingCycle,
              aiQueriesLimit,
              transactionsLimit,
              businessAccountsLimit,
            },
          });

          console.log(`Subscription payment processed for user ${userId} - Tier: ${tier}`);
        } else {
          // This is a one-time payment
          console.log(`One-time payment processed for user ${userId}: $${paymentIntent.amount / 100}`);
        }
      }

      return c.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      return c.json({ error: error.message }, 400);
    }
  })

  /**
   * GET /api/stripe/subscription
   * Get current user's subscription details
   */
  .get("/subscription", async (c) => {
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      const subscription = await db.subscription.findUnique({
        where: { userId: user.id },
      });

      if (!subscription) {
        // Return default FREE tier info
        return c.json({
          tier: "FREE",
          status: "ACTIVE",
          aiQueriesUsed: 0,
          aiQueriesLimit: 0,
          transactionsUsed: 0,
          transactionsLimit: 50,
          businessAccountsUsed: 0,
          businessAccountsLimit: 1,
        });
      }

      return c.json(subscription);
    } catch (error: any) {
      console.error("Error fetching subscription:", error);
      return c.json({ error: error.message }, 500);
    }
  })

  /**
   * POST /api/stripe/create-portal-session
   * Create a Stripe billing portal session for managing subscriptions
   */
  .post("/create-portal-session", async (c) => {
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      if (!user.stripeCustomerId) {
        return c.json({ error: "No Stripe customer ID found" }, 400);
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      });

      return c.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating portal session:", error);
      return c.json({ error: error.message }, 500);
    }
  });

export default app;
