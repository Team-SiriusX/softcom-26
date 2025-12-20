/**
 * Hiring Simulation Node - Simulates hiring/firing scenarios
 */

import type { SimulatorState, TimelinePoint } from "../../state/simulator-state";

export async function hiringSimulationNode(state: SimulatorState): Promise<Partial<SimulatorState>> {
  if (!state.realityTimeline || !state.scenario) {
    return {
      errors: [...(state.errors || []), "Missing required data for hiring simulation"],
    };
  }

  try {
    const simulation = JSON.parse(JSON.stringify(state.realityTimeline)) as TimelinePoint[]; // Deep clone
    const startIndex = Math.max(0, simulation.length - 1 - state.scenario.startMonthsAgo);
    const isHiring = state.scenario.type === "hire";

    for (let i = startIndex; i < simulation.length; i++) {
      const monthsActive = i - startIndex;
      const point = simulation[i];

      if (isHiring) {
        // HIRING SCENARIO
        // Add monthly salary cost
        point.expenses += Math.abs(state.scenario.monthlyCost || 0);

        // One-time costs (recruiting, equipment, training)
        if (monthsActive === 0 && state.scenario.oneTimeCost) {
          point.expenses += Math.abs(state.scenario.oneTimeCost);
          point.events.push(`Hired new employee (one-time cost: $${Math.abs(state.scenario.oneTimeCost).toLocaleString()})`);
        }

        // Productivity ramp-up over time
        // Month 0: 30% productive, Month 1: 50%, Month 2: 70%, Month 3+: 100%
        const productivityCurve = [0.3, 0.5, 0.7, 1.0, 1.0, 1.0];
        const productivity = productivityCurve[Math.min(monthsActive, 5)];

        // Revenue boost from new hire
        const fullImpact = state.scenario.growthFactor || 0.15;
        const actualImpact = fullImpact * productivity * state.scenario.probability;
        point.revenue = Math.round(point.revenue * (1 + actualImpact));

        point.events.push(
          `Employee month ${monthsActive + 1} (${Math.round(productivity * 100)}% productive, +${Math.round(actualImpact * 100)}% revenue)`
        );

        // Update metadata
        point.metadata = {
          ...point.metadata,
          revenueGrowth: actualImpact * 100,
          expenseChanges: {
            new_hire_salary: state.scenario.monthlyCost || 0,
          },
          keyDrivers: [`New hire productivity: ${Math.round(productivity * 100)}%`],
        };
      } else {
        // FIRING SCENARIO
        // Remove salary cost
        const salarySavings = Math.abs(state.scenario.monthlyCost || 0);
        point.expenses = Math.max(0, point.expenses - salarySavings);

        // One-time severance cost
        if (monthsActive === 0 && state.scenario.oneTimeCost) {
          point.expenses += Math.abs(state.scenario.oneTimeCost);
          point.events.push(`Severance payment: $${Math.abs(state.scenario.oneTimeCost).toLocaleString()}`);
        }

        // Revenue impact (loss of productivity)
        const revenueImpact = state.scenario.growthFactor || 0.1; // Default 10% revenue loss
        point.revenue = Math.round(point.revenue * (1 - revenueImpact * state.scenario.probability));

        point.events.push(
          `Employee terminated (saved $${salarySavings.toLocaleString()}/mo, -${Math.round(revenueImpact * 100)}% revenue)`
        );

        point.metadata = {
          ...point.metadata,
          revenueGrowth: -revenueImpact * 100,
          expenseChanges: {
            salary_savings: salarySavings,
          },
          keyDrivers: ["Reduced headcount"],
        };
      }

      // Recalculate balance
      point.balance = (i === 0 ? 0 : simulation[i - 1].balance) + point.revenue - point.expenses;
    }

    console.log(`✅ ${isHiring ? "Hiring" : "Firing"} simulation completed`);

    return {
      simulationTimeline: simulation,
      processingSteps: [...state.processingSteps, `${isHiring ? "Hiring" : "Firing"} simulation completed`],
    };
  } catch (error) {
    console.error("❌ Hiring simulation error:", error);
    return {
      errors: [
        ...(state.errors || []),
        `Hiring simulation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  }
}
