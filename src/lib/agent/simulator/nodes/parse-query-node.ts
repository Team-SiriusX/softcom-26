/**
 * Parse Query Node - Extracts structured scenario from natural language
 */

import { GeminiClient } from "../utils/gemini-client";
import type { SimulatorState } from "../state/simulator-state";

export async function parseQueryNode(state: SimulatorState): Promise<Partial<SimulatorState>> {
  const gemini = new GeminiClient();

  const prompt = `SYSTEM: You are a JSON generator. Your entire response must be ONLY a valid JSON object. Do not include any text before or after the JSON. Do not use markdown. Do not explain.

USER QUERY: "${state.query}"

TASK: Convert this into a financial scenario JSON object with these exact fields:

REQUIRED FORMAT (return THIS structure with appropriate values):
{"type":"hire","startMonthsAgo":3,"monthlyCost":-3500,"monthlyRevenue":0,"oneTimeCost":-1200,"growthFactor":0.15,"probability":0.80,"description":"Brief description"}

FIELD RULES:
- type: MUST be one of these exact strings: "hire", "fire", "price_increase", "price_decrease", "new_client", "lose_client", "investment", "expense"
- startMonthsAgo: number from 0 to 5
- monthlyCost: negative number for costs (e.g., -3500 for $3500/month cost)
- monthlyRevenue: positive number for income (e.g., 5000 for $5000/month)
- oneTimeCost: negative for one-time expenses (e.g., -1200)
- growthFactor: decimal from 0.0 to 1.0 (e.g., 0.15 = 15% growth)
- probability: decimal from 0.0 to 1.0 (e.g., 0.80 = 80% confidence)
- description: short text (under 100 chars)

EXAMPLES:
Query: "What if I hired a sales manager 3 months ago?"
Response: {"type":"hire","startMonthsAgo":3,"monthlyCost":-3500,"monthlyRevenue":0,"oneTimeCost":-1200,"growthFactor":0.15,"probability":0.80,"description":"Hired sales manager with productivity ramp"}

Query: "What if we raised prices by 15% 2 months ago?"
Response: {"type":"price_increase","startMonthsAgo":2,"monthlyCost":0,"monthlyRevenue":0,"oneTimeCost":0,"growthFactor":0.15,"probability":0.90,"description":"15% price increase with retention risk"}

Query: "What if we landed that big client 4 months ago?"
Response: {"type":"new_client","startMonthsAgo":4,"monthlyCost":0,"monthlyRevenue":5000,"oneTimeCost":0,"growthFactor":0.10,"probability":0.85,"description":"Major new client with growth potential"}

YOUR TURN - Respond with ONLY the JSON object for: "${state.query}"`;

  try {
    const scenario = await gemini.parseQuery(prompt);

    console.log("✅ Parsed scenario:", scenario);

    return {
      scenario,
      processingSteps: [...(state.processingSteps || []), "Query parsed successfully"],
    };
  } catch (error) {
    console.error("❌ Parse query error:", error);
    return {
      errors: [...(state.errors || []), `Parse error: ${error instanceof Error ? error.message : "Unknown error"}`],
    };
  }
}
