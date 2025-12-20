/**
 * State definitions for LangGraph Financial Simulator
 */

export type ScenarioType =
  | "hire"
  | "fire"
  | "price_increase"
  | "price_decrease"
  | "new_client"
  | "lose_client"
  | "investment"
  | "expense";

export interface Scenario {
  type: ScenarioType;
  startMonthsAgo: number;
  monthlyCost?: number;
  monthlyRevenue?: number;
  oneTimeCost?: number;
  growthFactor?: number;
  probability: number;
  description: string;
}

export interface TimelinePoint {
  month: string;
  balance: number;
  revenue: number;
  expenses: number;
  events: string[];
  metadata?: {
    revenueGrowth?: number;
    expenseChanges?: Record<string, number>;
    keyDrivers?: string[];
  };
}

export interface MonthlyImpact {
  month: string;
  difference: number;
  cumulativeDifference: number;
  keyFactors: string[];
}

export interface ImpactMetrics {
  amount: number;
  percent: number;
  breakdownByMonth: MonthlyImpact[];
}

export interface AIVerdict {
  analysis: string;
  reasoning: string[];
  recommendation: string;
  confidence: number;
}

export interface SimulatorState {
  // Input
  query: string;
  businessId: string;

  // Parsed scenario
  scenario?: Scenario;

  // Historical data
  realityTimeline?: TimelinePoint[];

  // Simulation results
  simulationTimeline?: TimelinePoint[];

  // Impact analysis
  impact?: ImpactMetrics;

  // AI verdict
  verdict?: AIVerdict;

  // Metadata
  timestamp: number;
  processingSteps: string[];
  errors?: string[];
}

export interface SimulationResult {
  success: boolean;
  data?: {
    query: string;
    reality: TimelinePoint[];
    simulation: TimelinePoint[];
    impact: ImpactMetrics;
    verdict: AIVerdict;
    processingSteps: string[];
  };
  error?: string;
}
