/**
 * Financial Simulator Orchestration
 * Coordinates all simulation nodes in a state machine pattern
 * Note: Using manual orchestration instead of LangGraph due to API compatibility
 */

import type { SimulatorState, SimulationResult } from "./state/simulator-state";
import { parseQueryNode } from "./nodes/parse-query-node";
import { fetchDataNode } from "./nodes/fetch-data-node";
import { hiringSimulationNode } from "./nodes/scenario-nodes/hiring-node";
import { pricingSimulationNode } from "./nodes/scenario-nodes/pricing-node";
import { clientSimulationNode } from "./nodes/scenario-nodes/client-node";
import { investmentSimulationNode } from "./nodes/scenario-nodes/investment-node";
import { calculateImpactNode } from "./nodes/calculate-impact-node";
import { generateVerdictNode } from "./nodes/generate-verdict-node";
import { storeResultsNode } from "./nodes/store-results-node";

/**
 * Execute the simulation state machine
 */
async function executeSimulationGraph(initialState: SimulatorState): Promise<SimulatorState> {
  let state = { ...initialState };

  // Step 1: Parse Query
  const parseResult = await parseQueryNode(state);
  state = { ...state, ...parseResult };

  // Check for early errors
  if (state.errors && state.errors.length > 0) {
    return state;
  }

  // Step 2: Fetch Data
  const fetchResult = await fetchDataNode(state);
  state = { ...state, ...fetchResult };

  // Check for errors
  if (state.errors && state.errors.length > 0) {
    return state;
  }

  // Step 3: Run appropriate scenario simulation
  if (!state.scenario) {
    state.errors = [...(state.errors || []), "No scenario parsed"];
    return state;
  }

  let simulationResult;
  switch (state.scenario.type) {
    case "hire":
    case "fire":
      simulationResult = await hiringSimulationNode(state);
      break;
    case "price_increase":
    case "price_decrease":
      simulationResult = await pricingSimulationNode(state);
      break;
    case "new_client":
    case "lose_client":
      simulationResult = await clientSimulationNode(state);
      break;
    case "investment":
    case "expense":
      simulationResult = await investmentSimulationNode(state);
      break;
    default:
      state.errors = [...(state.errors || []), `Unknown scenario type: ${state.scenario.type}`];
      return state;
  }

  state = { ...state, ...simulationResult };

  // Check for errors
  if (state.errors && state.errors.length > 0) {
    return state;
  }

  // Step 4: Calculate Impact
  const impactResult = await calculateImpactNode(state);
  state = { ...state, ...impactResult };

  // Check for errors
  if (state.errors && state.errors.length > 0) {
    return state;
  }

  // Step 5: Generate AI Verdict
  const verdictResult = await generateVerdictNode(state);
  state = { ...state, ...verdictResult };

  // Check for errors
  if (state.errors && state.errors.length > 0) {
    return state;
  }

  // Step 6: Store Results
  const storeResult = await storeResultsNode(state);
  state = { ...state, ...storeResult };

  return state;
}

/**
 * Main execution function for running simulations
 */
export async function runSimulation(businessId: string, query: string): Promise<SimulationResult> {
  console.log("🔮 Starting financial simulation:", { businessId, query });

  const initialState: SimulatorState = {
    query,
    businessId,
    timestamp: Date.now(),
    processingSteps: ["Simulation started"],
    errors: [],
  };

  try {
    const result = await executeSimulationGraph(initialState);

    // Check for errors
    if (result.errors && result.errors.length > 0) {
      throw new Error(`Simulation failed: ${result.errors.join(", ")}`);
    }

    // Validate required fields
    if (!result.realityTimeline || !result.simulationTimeline || !result.impact || !result.verdict) {
      throw new Error("Simulation completed but missing required data");
    }

    console.log("✅ Simulation completed successfully");
    console.log("   Processing steps:", result.processingSteps?.length || 0);
    console.log("   Impact:", result.impact.amount, `(${result.impact.percent}%)`);

    return {
      success: true,
      data: {
        query: result.query,
        reality: result.realityTimeline,
        simulation: result.simulationTimeline,
        impact: result.impact,
        verdict: result.verdict,
        processingSteps: result.processingSteps || [],
      },
    };
  } catch (error) {
    console.error("❌ Simulation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown simulation error",
    };
  }
}

/**
 * Get Mermaid diagram visualization of the graph
 */
export function getGraphVisualization(): string {
  return `
graph TD
    START([Start]) --> parseQuery[Parse Query]
    parseQuery --> fetchData[Fetch Historical Data]
    fetchData --> decision{Scenario Type?}
    
    decision -->|hire/fire| hiringSimulation[Hiring Simulation]
    decision -->|price changes| pricingSimulation[Pricing Simulation]
    decision -->|client changes| clientSimulation[Client Simulation]
    decision -->|investment/expense| investmentSimulation[Investment Simulation]
    decision -->|error| END([End])
    
    hiringSimulation --> calculateImpact[Calculate Impact]
    pricingSimulation --> calculateImpact
    clientSimulation --> calculateImpact
    investmentSimulation --> calculateImpact
    
    calculateImpact --> generateVerdict[Generate AI Verdict]
    generateVerdict --> storeResults[Store Results]
    storeResults --> END
    
    style parseQuery fill:#e1f5ff
    style fetchData fill:#e1f5ff
    style calculateImpact fill:#fff4e6
    style generateVerdict fill:#f3e5f5
    style storeResults fill:#e8f5e9
  `;
}
