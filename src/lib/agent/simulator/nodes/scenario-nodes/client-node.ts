/**
 * Client Simulation Node - Simulates new client acquisition or client loss
 */

import type { SimulatorState, TimelinePoint } from "../../state/simulator-state";

export async function clientSimulationNode(state: SimulatorState): Promise<Partial<SimulatorState>> {
  if (!state.realityTimeline || !state.scenario) {
    return {
      errors: [...(state.errors || []), "Missing required data for client simulation"],
    };
  }

  try {
    const simulation = JSON.parse(JSON.stringify(state.realityTimeline)) as TimelinePoint[];
    const startIndex = Math.max(0, simulation.length - 1 - state.scenario.startMonthsAgo);
    const isNewClient = state.scenario.type === "new_client";

    for (let i = startIndex; i < simulation.length; i++) {
      const monthsActive = i - startIndex;
      const point = simulation[i];

      if (isNewClient) {
        // NEW CLIENT SCENARIO
        // Monthly recurring revenue
        const monthlyRevenue = Math.abs(state.scenario.monthlyRevenue || 0);
        point.revenue += monthlyRevenue;

        // Account expansion over time (10-20% growth over 6 months)
        const expansionRate = (state.scenario.growthFactor || 0.1) * Math.min(monthsActive / 6, 1);
        const expansionRevenue = Math.round(monthlyRevenue * expansionRate * state.scenario.probability);
        point.revenue += expansionRevenue;

        // One-time onboarding costs
        if (monthsActive === 0 && state.scenario.oneTimeCost) {
          point.expenses += Math.abs(state.scenario.oneTimeCost);
          point.events.push(`New client onboarding cost: $${Math.abs(state.scenario.oneTimeCost).toLocaleString()}`);
        }

        point.events.push(
          `New client MRR: $${monthlyRevenue.toLocaleString()} (+${Math.round(expansionRate * 100)}% expansion)`
        );

        point.metadata = {
          ...point.metadata,
          revenueGrowth: ((monthlyRevenue + expansionRevenue) / point.revenue) * 100,
          keyDrivers: [
            `New client MRR: $${monthlyRevenue.toLocaleString()}`,
            `Account expansion: ${Math.round(expansionRate * 100)}%`,
          ],
        };
      } else {
        // LOST CLIENT SCENARIO
        // Loss of monthly recurring revenue
        const monthlyLoss = Math.abs(state.scenario.monthlyRevenue || 0);
        point.revenue = Math.max(0, point.revenue - monthlyLoss);

        // Potential cost savings from reduced service delivery
        const costSavings = Math.round(monthlyLoss * 0.3); // 30% cost savings
        point.expenses = Math.max(0, point.expenses - costSavings);

        if (monthsActive === 0) {
          point.events.push(`Lost major client (MRR: $${monthlyLoss.toLocaleString()})`);
        }

        point.events.push(`Client loss impact: -$${monthlyLoss.toLocaleString()} revenue, -$${costSavings.toLocaleString()} costs`);

        point.metadata = {
          ...point.metadata,
          revenueGrowth: -(monthlyLoss / point.revenue) * 100,
          expenseChanges: {
            cost_savings: -costSavings,
          },
          keyDrivers: [`Lost client MRR: -$${monthlyLoss.toLocaleString()}`],
        };
      }

      // Recalculate balance
      point.balance = (i === 0 ? 0 : simulation[i - 1].balance) + point.revenue - point.expenses;
    }

    console.log(`✅ ${isNewClient ? "New client" : "Lost client"} simulation completed`);

    return {
      simulationTimeline: simulation,
      processingSteps: [
        ...state.processingSteps,
        `${isNewClient ? "New client" : "Lost client"} simulation completed`,
      ],
    };
  } catch (error) {
    console.error("❌ Client simulation error:", error);
    return {
      errors: [
        ...(state.errors || []),
        `Client simulation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  }
}
