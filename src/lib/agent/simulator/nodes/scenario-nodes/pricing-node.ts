/**
 * Pricing Simulation Node - Simulates price increase/decrease scenarios
 */

import type { SimulatorState, TimelinePoint } from "../../state/simulator-state";

export async function pricingSimulationNode(state: SimulatorState): Promise<Partial<SimulatorState>> {
  if (!state.realityTimeline || !state.scenario) {
    return {
      errors: [...(state.errors || []), "Missing required data for pricing simulation"],
    };
  }

  try {
    const simulation = JSON.parse(JSON.stringify(state.realityTimeline)) as TimelinePoint[];
    const startIndex = Math.max(0, simulation.length - 1 - state.scenario.startMonthsAgo);
    const isPriceIncrease = state.scenario.type === "price_increase";
    const priceChange = state.scenario.growthFactor || 0.15; // Default 15%

    for (let i = startIndex; i < simulation.length; i++) {
      const monthsActive = i - startIndex;
      const point = simulation[i];

      if (isPriceIncrease) {
        // PRICE INCREASE SCENARIO
        // Immediate revenue boost
        const revenueIncrease = priceChange * state.scenario.probability;
        point.revenue = Math.round(point.revenue * (1 + revenueIncrease));

        // Customer churn over time (loses 5-10% customers over 3 months)
        const churnRate = Math.min(monthsActive * 0.03, 0.10); // Max 10% churn
        const churnImpact = 1 - churnRate;
        point.revenue = Math.round(point.revenue * churnImpact);

        point.events.push(
          `Prices increased ${Math.round(priceChange * 100)}% (${Math.round(churnRate * 100)}% customer churn)`
        );

        point.metadata = {
          ...point.metadata,
          revenueGrowth: (revenueIncrease - churnRate) * 100,
          keyDrivers: [`Price increase: +${Math.round(priceChange * 100)}%`, `Churn rate: ${Math.round(churnRate * 100)}%`],
        };
      } else {
        // PRICE DECREASE SCENARIO
        // Immediate revenue loss
        const revenueLoss = priceChange * state.scenario.probability;
        point.revenue = Math.round(point.revenue * (1 - revenueLoss));

        // Customer acquisition over time (gains 10-20% customers over 3 months)
        const acquisitionRate = Math.min(monthsActive * 0.05, 0.20); // Max 20% growth
        const acquisitionImpact = 1 + acquisitionRate;
        point.revenue = Math.round(point.revenue * acquisitionImpact);

        point.events.push(
          `Prices decreased ${Math.round(priceChange * 100)}% (+${Math.round(acquisitionRate * 100)}% new customers)`
        );

        point.metadata = {
          ...point.metadata,
          revenueGrowth: (acquisitionRate - revenueLoss) * 100,
          keyDrivers: [
            `Price decrease: -${Math.round(priceChange * 100)}%`,
            `New customers: +${Math.round(acquisitionRate * 100)}%`,
          ],
        };
      }

      // Recalculate balance
      point.balance = (i === 0 ? 0 : simulation[i - 1].balance) + point.revenue - point.expenses;
    }

    console.log(`✅ ${isPriceIncrease ? "Price increase" : "Price decrease"} simulation completed`);

    return {
      simulationTimeline: simulation,
      processingSteps: [
        ...state.processingSteps,
        `${isPriceIncrease ? "Price increase" : "Price decrease"} simulation completed`,
      ],
    };
  } catch (error) {
    console.error("❌ Pricing simulation error:", error);
    return {
      errors: [
        ...(state.errors || []),
        `Pricing simulation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  }
}
