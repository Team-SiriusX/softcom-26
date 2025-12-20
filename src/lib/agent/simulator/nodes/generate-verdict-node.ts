/**
 * Generate Verdict Node - Uses Gemini AI to create comprehensive analysis
 */

import { GeminiClient } from "../utils/gemini-client";
import type { SimulatorState } from "../state/simulator-state";

export async function generateVerdictNode(state: SimulatorState): Promise<Partial<SimulatorState>> {
  if (!state.realityTimeline || !state.simulationTimeline || !state.impact || !state.scenario) {
    return {
      errors: [...(state.errors || []), "Missing required data for verdict generation"],
    };
  }

  const gemini = new GeminiClient();

  const realityEnd = state.realityTimeline[state.realityTimeline.length - 1];
  const simulationEnd = state.simulationTimeline[state.simulationTimeline.length - 1];

  const prompt = `SYSTEM: You are a JSON generator. Your entire response must be ONLY a valid JSON object. Do not include any text before or after the JSON. Do not use markdown. Do not explain.

FINANCIAL ANALYSIS REQUEST:
Question: "${state.query}"
Scenario: ${state.scenario.description}
Financial Impact: $${state.impact.amount.toLocaleString()} (${state.impact.percent}%)
Current Balance: $${realityEnd.balance.toLocaleString()}
Simulated Balance: $${simulationEnd.balance.toLocaleString()}

DATA SUMMARY:
Reality Revenue Trend: ${state.realityTimeline.map(t => `$${Math.round(t.revenue/1000)}k`).join(", ")}
Simulation Revenue Trend: ${state.simulationTimeline.map(t => `$${Math.round(t.revenue/1000)}k`).join(", ")}
Monthly Impact: ${state.impact.breakdownByMonth.map(m => `${m.difference >= 0 ? '+' : ''}$${Math.round(m.difference/1000)}k`).join(", ")}

REQUIRED JSON FORMAT (return exactly this structure):
{"analysis":"2-3 sentence summary with specific numbers","reasoning":["Factor 1 with data","Factor 2 with data","Factor 3 with data"],"recommendation":"Clear actionable advice","confidence":0.85}

JSON RULES:
1. All property names in double quotes
2. All string values in double quotes
3. No line breaks inside strings (use space instead)
4. Escape internal quotes with backslash
5. confidence must be number between 0.0 and 1.0
6. reasoning must be array of 3-5 strings

EXAMPLE OUTPUT:
{"analysis":"Hiring 3 months ago would have cost 4700 initially but generated 8450 more by now. Employee productivity ramped from 30% to 100% over 3 months.","reasoning":["Initial investment of 4700 created 2-month cash pressure","Revenue grew 4% month 1, 7% month 2, 12% month 3","Breakeven hit in month 3 with positive ROI after"],"recommendation":"Strong hire opportunity. Make this hire now if you can handle 4700 initial investment and 2-month dip. Expect breakeven by month 3.","confidence":0.85}

YOUR TURN - Analyze the data above and respond with ONLY the JSON object:`;

  try {
    const verdict = await gemini.generateVerdict(prompt);

    console.log("✅ AI verdict generated:", {
      confidence: verdict.confidence,
      recommendation: verdict.recommendation.substring(0, 100) + "...",
    });

    return {
      verdict,
      processingSteps: [...state.processingSteps, "AI verdict generated"],
    };
  } catch (error) {
    console.error("❌ Verdict generation error:", error);
    return {
      errors: [
        ...(state.errors || []),
        `Verdict generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  }
}
