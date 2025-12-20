# Financial Simulator - LangGraph + Gemini Implementation

## 🎯 Overview

Production-ready **"What-If" Financial Time Machine** that uses:
- **LangGraph** for agentic workflow orchestration
- **Google Gemini 2.0 Flash** for AI reasoning and natural language parsing
- **Upstash Redis** for state management and caching
- **PostgreSQL + Prisma** for real transaction data
- **Next.js 14 + Hono** for API layer

## 🏗️ Architecture

### State Graph Flow

```
START → Parse Query → Fetch Data → [Scenario Simulation] → Calculate Impact → Generate Verdict → Store Results → END
                                             ↓
                        ┌───────────────────┴────────────────────┐
                        │                                        │
                   Hiring/Firing                           Pricing
                        │                                        │
                   Client Changes                          Investment
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Agent Framework | LangGraph | State machine orchestration |
| LLM | Gemini 2.0 Flash | Query parsing, verdict generation |
| State Storage | Upstash Redis | Caching, simulation history |
| Database | PostgreSQL + Prisma | Real transaction data |
| API | Hono | Type-safe REST endpoints |
| Frontend | React + TanStack Query | Data fetching, state management |

## 📁 File Structure

```
src/lib/agent/simulator/
├── simulator-graph.ts          # Main LangGraph orchestration
├── state/
│   └── simulator-state.ts      # TypeScript state interfaces
├── nodes/
│   ├── parse-query-node.ts     # Natural language → structured scenario
│   ├── fetch-data-node.ts      # Historical data retrieval
│   ├── calculate-impact-node.ts # Financial difference calculation
│   ├── generate-verdict-node.ts # AI analysis generation
│   ├── store-results-node.ts   # Redis persistence
│   └── scenario-nodes/
│       ├── hiring-node.ts      # Hiring/firing scenarios
│       ├── pricing-node.ts     # Price change scenarios
│       ├── client-node.ts      # Client acquisition/loss
│       └── investment-node.ts  # Investment/expense scenarios
├── utils/
│   ├── gemini-client.ts        # Gemini API wrapper
│   └── redis-cache.ts          # Redis operations
```

## 🚀 Getting Started

### 1. Environment Variables

Add to `.env.local`:

```bash
# Gemini AI
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Upstash Redis (already configured if you have Upstash)
UPSTASH_REDIS_URL=your_upstash_url
UPSTASH_REDIS_TOKEN=your_upstash_token

# Database (already configured)
DATABASE_URL=your_postgresql_url
```

### 2. Install Dependencies

Already installed:
- `@langchain/langgraph` - LangGraph state machine
- `@langchain/core` - Core LangChain utilities
- `@google/generative-ai` - Gemini API client
- `@upstash/redis` - Redis client

### 3. API Endpoints

#### Run Simulation
```typescript
POST /api/simulator
{
  "businessId": "business-id",
  "query": "What if I hired a sales person 3 months ago?"
}
```

#### Get Simulation History
```typescript
GET /api/simulator/history/:businessId
```

#### Get Specific Simulation
```typescript
GET /api/simulator/:businessId/:simulationId
```

#### Clear Cache
```typescript
DELETE /api/simulator/cache/:businessId
```

## 💻 Usage Examples

### React Component Example

```typescript
import { useRunSimulation, useSimulationHistory } from "@/hooks/use-simulator";
import { useSelectedBusiness } from "@/components/providers/business-provider";

export function WhatIfSimulator() {
  const { selectedBusinessId } = useSelectedBusiness();
  const runSimulation = useRunSimulation();
  const { data: history } = useSimulationHistory(selectedBusinessId);

  const handleSimulate = async (query: string) => {
    if (!selectedBusinessId) return;

    try {
      const result = await runSimulation.mutateAsync({
        businessId: selectedBusinessId,
        query,
      });

      console.log("Impact:", result.impact);
      console.log("Verdict:", result.verdict);
    } catch (error) {
      console.error("Simulation failed:", error);
    }
  };

  return (
    <div>
      <input
        placeholder="What if I hired someone 3 months ago?"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSimulate(e.currentTarget.value);
          }
        }}
      />
      {runSimulation.data && (
        <div>
          <h3>Impact: ${runSimulation.data.impact.amount.toLocaleString()}</h3>
          <p>{runSimulation.data.verdict.analysis}</p>
        </div>
      )}
    </div>
  );
}
```

### Direct API Call

```typescript
import { runSimulation } from "@/lib/agent/simulator/simulator-graph";

const result = await runSimulation(
  "business-123",
  "What if we raised prices by 15% 2 months ago?"
);

if (result.success) {
  console.log("Reality:", result.data.reality);
  console.log("Simulation:", result.data.simulation);
  console.log("Impact:", result.data.impact);
  console.log("AI Verdict:", result.data.verdict);
}
```

## 🎓 Supported Scenarios

### 1. Hiring/Firing
```
"What if I hired a sales manager 3 months ago?"
"What if we let go of 2 developers 4 months ago?"
```

**Simulates:**
- Monthly salary costs
- One-time recruiting/severance costs
- Productivity ramp-up curve (30% → 100% over 3 months)
- Revenue impact based on growth factor

### 2. Pricing Changes
```
"What if we raised prices by 15% 2 months ago?"
"What if we discounted our service by 20% 5 months ago?"
```

**Simulates:**
- Immediate revenue impact
- Customer churn (for increases)
- Customer acquisition (for decreases)
- Net effect over time

### 3. Client Acquisition/Loss
```
"What if we landed that big client 4 months ago?"
"What if we lost our largest client 1 month ago?"
```

**Simulates:**
- Monthly recurring revenue
- Account expansion over time
- Onboarding costs
- Service delivery cost savings

### 4. Investment/Expenses
```
"What if we invested $10k in marketing 3 months ago?"
"What if we had an unexpected $5k legal expense 2 months ago?"
```

**Simulates:**
- One-time costs
- ROI ramp-up curve
- Revenue growth from investment
- Opportunity costs

## 📊 Response Format

```typescript
{
  "query": "What if I hired a sales person 3 months ago?",
  "reality": [
    {
      "month": "2024-09",
      "balance": 15000,
      "revenue": 22000,
      "expenses": 15000,
      "events": ["Normal operations"],
      "metadata": { "revenueGrowth": 2.5 }
    },
    // ... 5 more months
  ],
  "simulation": [
    {
      "month": "2024-09",
      "balance": 12700,
      "revenue": 22000,
      "expenses": 18300,
      "events": [
        "Normal operations",
        "Hired new employee (one-time cost: $1,200)",
        "Employee month 1 (30% productive, +4% revenue)"
      ],
      "metadata": {
        "revenueGrowth": 4.5,
        "expenseChanges": { "new_hire_salary": -3500 },
        "keyDrivers": ["New hire productivity: 30%"]
      }
    },
    // ... 5 more months
  ],
  "impact": {
    "amount": 8450,
    "percent": 12.3,
    "breakdownByMonth": [
      {
        "month": "2024-09",
        "difference": -2300,
        "cumulativeDifference": -2300,
        "keyFactors": ["Hired new employee (one-time cost: $1,200)"]
      },
      // ... month-by-month progression
    ]
  },
  "verdict": {
    "analysis": "Hiring a sales person 3 months ago would have cost you $2,300 initially but generated $8,450 more by now (12.3% improvement). The employee's productivity ramped from 30% to 100% over 3 months, driving 15% revenue growth.",
    "reasoning": [
      "Initial investment of $4,700 ($3,500 salary + $1,200 onboarding) created short-term cash flow pressure",
      "Revenue increased by 4% in month 1, 7% in month 2, and 12% in month 3 as productivity improved",
      "By month 3, the hire was generating $4,200/month in additional revenue vs $3,500 salary cost"
    ],
    "recommendation": "This would have been a solid hire. Consider making this hire now if you can handle the $4,700 initial investment and 2-month cash flow dip. Expect breakeven by month 3 and positive ROI after.",
    "confidence": 0.85
  },
  "processingSteps": [
    "Simulation started",
    "Query parsed successfully",
    "Loaded from cache",
    "Hiring simulation completed",
    "Impact calculated",
    "AI verdict generated",
    "Results stored (ID: sim-1234567890-abc123)"
  ]
}
```

## ⚡ Performance Optimizations

### 1. Caching Strategy
- **Reality timelines**: 1 hour TTL (transactions don't change frequently)
- **Simulation results**: 7 days TTL (reusable for similar queries)
- **Parsed scenarios**: In-memory for session

### 2. Gemini API Optimization
- Model: `gemini-2.0-flash-exp` (10x faster than Pro)
- Temperature: 0.2 (consistent financial reasoning)
- Max tokens: 2048 (sufficient for verdicts)
- JSON mode: Forced structured output

### 3. Database Query Optimization
- Fetch only last 6 months of transactions
- Group by month in database query
- Fallback to realistic generated data if no transactions

### 4. Parallel Processing (Future Enhancement)
```typescript
// Run multiple scenarios in parallel
const results = await Promise.all([
  runSimulation(businessId, "What if I hired someone?"),
  runSimulation(businessId, "What if I raised prices?"),
  runSimulation(businessId, "What if I landed a big client?"),
]);
```

## 🧪 Testing

### Test Query Examples

```typescript
// Hiring
"What if I hired a sales person 3 months ago?"
"What if we brought on a developer 4 months ago for $5000/month?"

// Pricing
"What if we raised prices by 15% 2 months ago?"
"What if we offered a 20% discount 1 month ago?"

// Clients
"What if we landed that $5000/month client 3 months ago?"
"What if we lost our biggest client 2 months ago?"

// Investment
"What if we invested $10000 in marketing 4 months ago?"
"What if we bought new equipment for $8000 3 months ago?"
```

### Expected Behavior

1. **Parse Query**: Gemini extracts scenario type, timeframe, amounts
2. **Fetch Data**: Real transactions or realistic generated timeline
3. **Simulate**: Month-by-month calculations with compounding effects
4. **Calculate Impact**: Precise dollar and percentage differences
5. **Generate Verdict**: Natural language analysis with reasoning
6. **Store Results**: Cached in Redis for 7 days

## 🐛 Debugging

### View Processing Steps
Every simulation includes `processingSteps` array showing exact execution flow:

```typescript
[
  "Simulation started",
  "Query parsed successfully",
  "Fetched historical data",
  "Hiring simulation completed",
  "Impact calculated",
  "AI verdict generated",
  "Results stored (ID: sim-1234567890-abc123)"
]
```

### Check Errors
Errors are captured in the `errors` array:

```typescript
if (!result.success) {
  console.error("Simulation failed:", result.error);
}
```

### Graph Visualization
Generate Mermaid diagram:

```typescript
import { getGraphVisualization } from "@/lib/agent/simulator/simulator-graph";
console.log(getGraphVisualization());
```

## 🔐 Security

- **Authentication**: All endpoints require `currentUser()` check
- **Business ownership**: Validate user owns the business
- **Rate limiting**: Implement in production (recommended: 10 req/min)
- **Input validation**: Zod schemas validate all inputs
- **API key protection**: Gemini API key stored in environment variables

## 📈 Monitoring

### Key Metrics to Track

1. **Simulation success rate**: `result.success` percentage
2. **Processing time**: Track `Date.now()` before/after
3. **Cache hit rate**: Log cache hits vs database queries
4. **Gemini API usage**: Track tokens and costs
5. **Error types**: Categorize errors by node

### Recommended Logging

```typescript
console.log("🔮 Simulation started:", { businessId, query });
console.log("✅ Simulation completed:", { duration, impact: result.data.impact.amount });
console.log("❌ Simulation failed:", { error, step: state.processingSteps.length });
```

## 🚀 Deployment Checklist

- [x] Environment variables configured
- [x] Dependencies installed
- [x] API routes registered
- [x] Redis connection tested
- [x] Gemini API key validated
- [ ] Rate limiting implemented
- [ ] Error monitoring setup (Sentry, LogRocket)
- [ ] Analytics tracking added
- [ ] Load testing performed
- [ ] User documentation created

## 📚 Additional Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Gemini API Reference](https://ai.google.dev/docs)
- [Upstash Redis Docs](https://docs.upstash.com/redis)
- [Hono Framework](https://hono.dev/)

## 🎉 Success Criteria

✅ Implementation is complete when:

1. LangGraph state machine executes all nodes successfully
2. Gemini API parses natural language queries accurately
3. All 4+ scenario types simulate correctly
4. Impact calculations show month-by-month breakdown
5. AI verdicts provide actionable recommendations
6. Results persist in Redis for 7 days
7. React hooks integrate seamlessly
8. API returns within 3-5 seconds

---

**Built with ❤️ using LangGraph + Gemini AI**
