/**
 * Calculate Impact Node - Computes financial differences between reality and simulation
 */

import type { SimulatorState, MonthlyImpact, ImpactMetrics } from "../state/simulator-state";

export async function calculateImpactNode(state: SimulatorState): Promise<Partial<SimulatorState>> {
  if (!state.realityTimeline || !state.simulationTimeline) {
    return {
      errors: [...(state.errors || []), "Missing timeline data for impact calculation"],
    };
  }

  try {
    const realityEnd = state.realityTimeline[state.realityTimeline.length - 1];
    const simulationEnd = state.simulationTimeline[state.simulationTimeline.length - 1];

    // Calculate total impact
    const amount = simulationEnd.balance - realityEnd.balance;
    const percent = realityEnd.balance !== 0 ? (amount / realityEnd.balance) * 100 : 0;

    // Calculate month-by-month breakdown
    const breakdownByMonth: MonthlyImpact[] = state.realityTimeline.map((reality, i) => {
      const sim = state.simulationTimeline![i];
      const diff = sim.balance - reality.balance;

      // Calculate cumulative difference
      const cumulativeDiff = diff;

      // Extract key factors from simulation events
      const keyFactors = sim.events.filter((e) => !reality.events.includes(e));

      return {
        month: reality.month,
        difference: Math.round(diff),
        cumulativeDifference: Math.round(cumulativeDiff),
        keyFactors: keyFactors.length > 0 ? keyFactors : ["No significant changes"],
      };
    });

    const impact: ImpactMetrics = {
      amount: Math.round(amount),
      percent: Math.round(percent * 10) / 10, // Round to 1 decimal
      breakdownByMonth,
    };

    console.log("✅ Impact calculated:", {
      amount: impact.amount,
      percent: impact.percent,
      months: breakdownByMonth.length,
    });

    return {
      impact,
      processingSteps: [...state.processingSteps, "Impact calculated"],
    };
  } catch (error) {
    console.error("❌ Calculate impact error:", error);
    return {
      errors: [
        ...(state.errors || []),
        `Impact calculation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  }
}
