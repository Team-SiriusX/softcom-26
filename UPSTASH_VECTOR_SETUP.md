# 🚀 Upstash Vector Setup Guide

## Quick Setup

### 1. Get Upstash Credentials

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a **Vector Index**:
   - Click "Create Vector Index"
   - Name: `financial-advisor-rag`
   - Dimensions: **768** (for Gemini embeddings)
   - Metric: **Cosine** similarity
   - Region: Choose closest to your app
3. Copy credentials:
   - `UPSTASH_VECTOR_REST_URL`
   - `UPSTASH_VECTOR_REST_TOKEN`

### 2. Environment Variables

Add to your `.env`:

```env
# Upstash Vector (for fast semantic search)
UPSTASH_VECTOR_REST_URL="https://your-vector-url.upstash.io"
UPSTASH_VECTOR_REST_TOKEN="your-vector-token"

# Google Gemini (for embeddings and LLM)
GOOGLE_GEMINI_API_KEY="your-gemini-api-key"

# Optional: Upstash Redis (for session memory)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

### 3. Test the Setup

```bash
# Start dev server
pnpm dev

# Open voice assistant
# Navigate to /dashboard/assistant

# Click the refresh button (spinning icon)
# This will index your financial data

# Try a query:
# "What are my biggest expenses this month?"
# "Show me my cash flow"
# "How's my profitability?"
```

## How It Works

### Indexing Flow
```
1. User clicks refresh OR starts new conversation
   ↓
2. System fetches financial data from database
   ↓
3. Data is formatted into searchable text chunks
   ↓
4. Google Gemini generates embeddings (768-dim vectors)
   ↓
5. Vectors are stored in Upstash with metadata
   ↓
6. Done! (happens in background, doesn't block queries)
```

### Query Flow
```
1. User asks: "What's my biggest expense?"
   ↓
2. Query is embedded using Gemini
   ↓
3. Upstash Vector searches for similar embeddings
   ↓
4. Top 5 most relevant chunks returned
   ↓
5. Chunks sent to Gemini LLM for answer generation
   ↓
6. Answer returned to user (spoken if voice mode)
```

## What Gets Indexed

### Transactions (Last 50)
```
"Transaction on 12/15/2024: EXPENSE of $150.00.
Description: Office supplies from Staples.
Account: Office Expenses. Category: Supplies.
Reconciled."
```

### Ledger Accounts (All Active)
```
"Ledger Account: Cash in Bank (Code: 1000).
Type: ASSET, CURRENT_ASSET.
Current Balance: $25,432.50.
Normal Balance: DEBIT.
Active."
```

### Analytics Summary
```
"Financial Overview:
Current cash balance: $25,432.50. Cash change: -5.2%.
Monthly revenue: $50,000.00. Revenue change: 12.3%.
Monthly expenses: $38,500.00. Expense change: 8.1%.
Net income: $11,500.00. Profit margin: 23.0%.
Working capital: $15,200.00. Current ratio: 2.5.
Monthly burn rate: $12,833.33. Runway: 1.9 months."
```

## Performance Benefits

### Before Upstash Vector
- ❌ Slow database queries (100-500ms)
- ❌ Limited to exact keyword matching
- ❌ Complex JOIN operations
- ❌ Difficult to find relevant context

### After Upstash Vector
- ✅ Ultra-fast vector search (10-50ms)
- ✅ Semantic understanding of queries
- ✅ Ranked results by relevance
- ✅ Automatic context retrieval

## Monitoring

### Check Indexing Status
```bash
# API endpoint to verify vector health
curl http://localhost:3000/api/agent/health
```

Returns:
```json
{
  "status": "ok",
  "config": {
    "vector": true,
    "gemini": true,
    "upstash": true
  }
}
```

### View in UI
- **Refresh button** shows spinning animation during indexing
- **"Indexing..." badge** appears when background indexing runs
- **Updated timestamp** shows last context refresh

## Troubleshooting

### "Vector indexing not available"
- Check `.env` has all required variables
- Verify `UPSTASH_VECTOR_REST_URL` is correct
- Verify `GOOGLE_GEMINI_API_KEY` is valid

### "Dimension mismatch"
- Ensure Upstash index is **768 dimensions**
- Delete and recreate index if wrong dimension

### "No relevant context found"
- Click refresh button to index data
- Wait 2-3 seconds for indexing to complete
- Try query again

### Slow first query
- First embedding takes ~500ms (model initialization)
- Subsequent queries are faster (~50-100ms)
- This is normal behavior

## Cost Estimates

### Upstash Vector (Free Tier)
- ✅ 10,000 vectors free
- ✅ 10,000 queries/day free
- For typical business: **Free forever**

### Google Gemini
- Embeddings: $0.00002 per 1K tokens
- LLM Generation: $0.00025 per 1K tokens
- 1000 queries/month: **~$0.50**

### Total Monthly Cost
- Small business: **FREE** (within limits)
- Medium business: **~$1-5**
- Large business: **~$10-20**

## Advanced Configuration

### Adjust Indexing Limit
Edit `src/lib/agent/financial-indexer.ts`:

```typescript
// Index more transactions
indexRecentTransactions(businessId, 100); // default: 50

// Index specific time periods
// Add custom date filtering in the function
```

### Custom Data Sources
Add new indexing functions:

```typescript
export async function indexCustomReports(businessId: string) {
  // Fetch your custom data
  // Format as text
  // Generate embeddings
  // Upsert to vector store
}
```

## Next Steps

1. ✅ Set up Upstash Vector
2. ✅ Add environment variables
3. ✅ Test with voice assistant
4. 🚀 Deploy to production!

---

**Need Help?** Check the [Upstash Docs](https://upstash.com/docs/vector) or [Gemini API Docs](https://ai.google.dev/docs)
