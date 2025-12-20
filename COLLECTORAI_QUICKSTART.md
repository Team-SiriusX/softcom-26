# 🚀 CollectorAI Quick Start Guide

## ⚡ Fastest Way: Use the Dashboard

**Navigate to `/dashboard/collector` in your app!**

The CollectorAI Dashboard provides:
- 📊 Real-time statistics (invoices, emails sent, success rate)
- ▶️  One-click "Run Agent Now" button
- 📜 Complete execution history
- 🔍 Detailed action logs showing who received emails and when
- ✉️  Email tracking per invoice

**Just click "Run Agent Now" and watch it work!**

---

## 5-Minute Manual Setup

### Step 1: Install Dependencies ✅ (Already Done)
```bash
pnpm add @langchain/langgraph @langchain/core @langchain/google-genai
```

### Step 2: Update Database Schema ✅ (Already Done)
```bash
pnpm dlx prisma@6.17.1 generate
pnpm dlx prisma@6.17.1 db push
```

### Step 3: Test the Agent

#### Option A: Via Code
```typescript
import { runCollectorAI } from "@/lib/agent/collector/langgraph-agent";

// Run for a specific business
const result = await runCollectorAI("your-business-id-here");

console.log(`
✅ Completed!
📊 Processed: ${result.stats.processed} invoices
⚡ Actions: ${result.stats.actionsTaken}
📧 Emails: ${result.stats.emailsSent}
❌ Errors: ${result.stats.errors}
⏱️  Time: ${(result.duration / 1000).toFixed(2)}s
`);
```

#### Option B: Via API (Recommended)
```bash
# Using curl
curl -X POST http://localhost:3000/api/collector/run \
  -H "Content-Type: application/json" \
  -d '{"businessId": "your-business-id"}'
```

#### Option C: Via Frontend Hook
```tsx
import { useRunCollectorAI } from "@/hooks/use-collector";

function CollectorDashboard() {
  const { mutate: runAgent, isPending } = useRunCollectorAI();
  
  return (
    <button 
      onClick={() => runAgent({ businessId: "clx123..." })}
      disabled={isPending}
    >
      {isPending ? "Running..." : "Run CollectorAI"}
    </button>
  );
}
```

---

## File Structure (What Was Created)

```
src/
├── lib/
│   └── agent/
│       └── collector/
│           ├── types.ts                 # TypeScript interfaces
│           ├── email-service.ts         # Email generation & sending
│           └── langgraph-agent.ts       # LangGraph state machine
│
├── app/
│   └── api/
│       └── [[...route]]/
│           └── controllers/
│               └── (base)/
│                   └── collector.ts     # Hono API endpoints
│
├── hooks/
│   └── use-collector.ts                 # React TanStack Query hooks
│
prisma/
└── schema.prisma                        # Extended with CollectorAI models

docs/
├── COLLECTORAI_DOCUMENTATION.md         # Full documentation
└── COLLECTORAI_QUICKSTART.md           # This file
```

---

## API Endpoints Created

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/collector/run` | POST | Manually trigger agent for a business |
| `/api/collector/history/:businessId` | GET | Get execution history (last 20 runs) |
| `/api/collector/invoices/:businessId` | GET | Get invoices needing attention |
| `/api/collector/stats/:businessId` | GET | Get real-time collection statistics |

---

## How It Works (Simplified)

1. **Load Invoices**: Finds overdue or scheduled invoices
2. **Analyze Client**: Checks payment history (reliability score)
3. **AI Decision**: Gemini decides: Send email? Offer plan? Wait? Escalate?
4. **Execute**: Sends email, creates payment plan, or schedules next action
5. **Loop**: Processes next invoice (max 50 per run)
6. **Log**: Records execution stats in database

---

## Testing Workflow

### 1. Create Test Data
```typescript
// Create a test invoice
await db.invoice.create({
  data: {
    businessId: "your-business-id",
    clientId: "client-id",
    invoiceNumber: "TEST-001",
    issueDate: new Date("2024-01-01"),
    dueDate: new Date("2024-01-15"), // 35 days ago
    subtotal: 5000,
    total: 5000,
    status: "OVERDUE",
  },
});
```

### 2. Run Agent
```typescript
const result = await runCollectorAI("your-business-id");
```

### 3. Check Results
```typescript
// View execution log
const logs = await db.agentExecutionLog.findMany({
  where: { businessId: "your-business-id" },
  orderBy: { startedAt: "desc" },
  take: 1,
});

console.log(logs[0].summaryReport);

// View collection actions
const actions = await db.collectionAction.findMany({
  where: {
    invoice: {
      invoiceNumber: "TEST-001",
    },
  },
  orderBy: { createdAt: "desc" },
});

console.log(actions[0].emailBody); // See what email was sent
console.log(actions[0].aiReasoning); // See why AI made this decision
```

---

## Scheduling (Production)

### Option 1: Vercel Cron (Recommended)
Create `app/api/cron/collector/route.ts`:
```typescript
import { runCollectorAI } from "@/lib/agent/collector/langgraph-agent";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businesses = await db.business.findMany({
    select: { id: true },
  });

  const results = [];
  for (const business of businesses) {
    const result = await runCollectorAI(business.id);
    results.push({ businessId: business.id, ...result });
  }

  return NextResponse.json({ success: true, results });
}
```

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/collector",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Option 2: GitHub Actions
Create `.github/workflows/collector-cron.yml`:
```yaml
name: Run CollectorAI
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  run-collector:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Collector
        run: |
          curl -X POST https://yourapp.vercel.app/api/cron/collector \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## Monitoring Dashboard (Create This)

```tsx
// app/dashboard/collector/page.tsx
import { useCollectorStats, useCollectorHistory, useRunCollectorAI } from "@/hooks/use-collector";
import { useSelectedBusiness } from "@/hooks/use-business";

export default function CollectorDashboard() {
  const { selectedBusinessId } = useSelectedBusiness();
  const { data: stats } = useCollectorStats(selectedBusinessId);
  const { data: history } = useCollectorHistory(selectedBusinessId);
  const { mutate: runAgent, isPending } = useRunCollectorAI();

  return (
    <div className="p-6">
      <h1>CollectorAI Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>Total Invoices</CardHeader>
          <CardContent>{stats?.stats.totalInvoices || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>Overdue</CardHeader>
          <CardContent>{stats?.stats.overdueInvoices || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>Emails Sent (30d)</CardHeader>
          <CardContent>{stats?.stats.totalEmailsSent || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>Last Run</CardHeader>
          <CardContent>
            {stats?.stats.lastRun 
              ? new Date(stats.stats.lastRun).toLocaleDateString()
              : "Never"}
          </CardContent>
        </Card>
      </div>

      {/* Manual Trigger */}
      <Button 
        onClick={() => runAgent({ businessId: selectedBusinessId! })}
        disabled={isPending || !selectedBusinessId}
        className="mt-4"
      >
        {isPending ? "Running..." : "Run CollectorAI Now"}
      </Button>

      {/* Execution History */}
      <div className="mt-8">
        <h2>Recent Executions</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invoices</TableHead>
              <TableHead>Emails</TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history?.history.map(log => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.startedAt).toLocaleString()}</TableCell>
                <TableCell>{log.status}</TableCell>
                <TableCell>{log.invoicesProcessed}</TableCell>
                <TableCell>{log.emailsSent}</TableCell>
                <TableCell>{((log.durationMs || 0) / 1000).toFixed(1)}s</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

---

## Customization

### Change Email Templates
Edit `src/lib/agent/collector/email-service.ts`:
- Modify `generateEmailHTML()` function
- Update colors, branding, footer

### Adjust Escalation Thresholds
Edit `src/lib/agent/collector/langgraph-agent.ts`:
- Find the prompt in `makeDecision()` function
- Change day ranges (e.g., Days 1-3, 4-7, etc.)

### Add Custom Actions
1. Add action type to Prisma enum: `CollectionActionType`
2. Create handler function (like `sendReminderEmail`)
3. Add case in `executeAction()` switch statement
4. Update Gemini prompt with new action option

---

## Common Issues

### "No invoices to process"
- Create test invoices with `status: OVERDUE`
- Ensure `dueDate` is in the past
- Check business ID matches

### "Email failed to send"
- Verify `RESEND_API_KEY` in `.env`
- Check Resend domain verification
- View error in `CollectionAction.errorMessage`

### "AI decision error"
- Check `GOOGLE_GEMINI_API_KEY`
- View raw response in console logs
- Gemini may return invalid JSON (agent has fallback)

### "Redis errors"
- Agent works without Redis (degrades gracefully)
- Optional: Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

---

## Next Steps

1. ✅ **Test locally**: Run agent manually via API
2. 📧 **Configure emails**: Set up Resend domain
3. 📊 **Build dashboard**: Create monitoring UI
4. ⏰ **Schedule runs**: Set up cron job
5. 🎨 **Customize**: Adjust thresholds and templates
6. 🚀 **Go live**: Monitor first production run

---

## Support

- Full docs: `COLLECTORAI_DOCUMENTATION.md`
- Project docs: `PROJECT_DOCUMENTATION.md`
- Code comments: Detailed inline documentation

**You're ready to revolutionize invoice collection! 🎉**
