/**
 * Investment Simulation Node - Simulates investment or one-time expense scenarios
 */

import type { SimulatorState, TimelinePoint } from "../../state/simulator-state";

export async function investmentSimulationNode(state: SimulatorState): Promise<Partial<SimulatorState>> {
  if (!state.realityTimeline || !state.scenario) {
    return {
      errors: [...(state.errors || []), "Missing required data for investment simulation"],
    };
  }

  try {
    const simulation = JSON.parse(JSON.stringify(state.realityTimeline)) as TimelinePoint[];
    const startIndex = Math.max(0, simulation.length - 1 - state.scenario.startMonthsAgo);
    const isInvestment = state.scenario.type === "investment";

    for (let i = startIndex; i < simulation.length; i++) {
      const monthsActive = i - startIndex;
      const point = simulation[i];

      if (isInvestment) {
        // INVESTMENT SCENARIO (e.g., marketing campaign, new equipment, software)

        // One-time investment cost
        if (monthsActive === 0 && state.scenario.oneTimeCost) {
          point.expenses += Math.abs(state.scenario.oneTimeCost);
          point.events.push(`Investment made: $${Math.abs(state.scenario.oneTimeCost).toLocaleString()}`);
        }

        // Ongoing costs (if any)
        if (state.scenario.monthlyCost) {
          point.expenses += Math.abs(state.scenario.monthlyCost);
        }

        // Return on investment over time
        // ROI ramps up gradually: Month 0: 20%, Month 1: 40%, Month 2: 60%, Month 3+: 100%
        const roiCurve = [0.2, 0.4, 0.6, 0.8, 1.0, 1.0];
        const roiMultiplier = roiCurve[Math.min(monthsActive, 5)];

        const fullImpact = state.scenario.growthFactor || 0.2; // Default 20% revenue growth
        const actualImpact = fullImpact * roiMultiplier * state.scenario.probability;
        point.revenue = Math.round(point.revenue * (1 + actualImpact));

        point.events.push(
          `Investment ROI: ${Math.round(roiMultiplier * 100)}% realized (+${Math.round(actualImpact * 100)}% revenue)`
        );

        point.metadata = {
          ...point.metadata,
          revenueGrowth: actualImpact * 100,
          expenseChanges: {
            investment_cost: monthsActive === 0 ? state.scenario.oneTimeCost || 0 : 0,
            ongoing_cost: state.scenario.monthlyCost || 0,
          },
          keyDrivers: [`ROI realization: ${Math.round(roiMultiplier * 100)}%`],
        };
      } else {
        // ONE-TIME EXPENSE SCENARIO (e.g., emergency repair, legal fees)

        // One-time expense
        if (monthsActive === 0 && state.scenario.oneTimeCost) {
          point.expenses += Math.abs(state.scenario.oneTimeCost);
          point.events.push(`Unexpected expense: $${Math.abs(state.scenario.oneTimeCost).toLocaleString()}`);
        }

        // Ongoing impact (if any)
        if (state.scenario.monthlyCost) {
          point.expenses += Math.abs(state.scenario.monthlyCost);
          point.events.push(`Ongoing cost: $${Math.abs(state.scenario.monthlyCost).toLocaleString()}/mo`);
        }

        // Potential negative impact on revenue (distraction, downtime)
        if (state.scenario.growthFactor && state.scenario.growthFactor < 0) {
          const revenueImpact = Math.abs(state.scenario.growthFactor);
          point.revenue = Math.round(point.revenue * (1 - revenueImpact * state.scenario.probability));

          point.events.push(`Revenue impact: -${Math.round(revenueImpact * 100)}%`);
        }

        point.metadata = {
          ...point.metadata,
          expenseChanges: {
            one_time_expense: monthsActive === 0 ? state.scenario.oneTimeCost || 0 : 0,
            ongoing_expense: state.scenario.monthlyCost || 0,
          },
          keyDrivers: ["Unplanned expense"],
        };
      }

      // Recalculate balance
      point.balance = (i === 0 ? 0 : simulation[i - 1].balance) + point.revenue - point.expenses;
    }

    console.log(`✅ ${isInvestment ? "Investment" : "Expense"} simulation completed`);

    return {
      simulationTimeline: simulation,
      processingSteps: [
        ...state.processingSteps,
        `${isInvestment ? "Investment" : "Expense"} simulation completed`,
      ],
    };
  } catch (error) {
    console.error("❌ Investment simulation error:", error);
    return {
      errors: [
        ...(state.errors || []),
        `Investment simulation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  }
}
