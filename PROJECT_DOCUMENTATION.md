# SoftCom-26 Project Documentation

## 1. Executive Summary

**SoftCom-26** is a next-generation AI-powered accounting platform designed for small to medium-sized businesses. It combines traditional double-entry bookkeeping with advanced AI capabilities, including a "Financial Time Machine" simulator and an intelligent conversational agent.

Key differentiators:
- **AI-First Design**: Built from the ground up with Gemini 2.5 Flash integration.
- **Financial Time Machine**: Allows users to simulate "what-if" scenarios (e.g., "What if I hired a sales manager 3 months ago?") and see the financial impact.
- **Double-Entry Core**: Robust accounting foundation ensuring data integrity.
- **Interactive 3D UI**: Engaging user interface with 3D elements.

---

## 2. Technical Architecture

### 2.1 Tech Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| **Frontend** | Next.js 15 (App Router) | React framework for server/client components. |
| **UI Library** | Shadcn UI + Tailwind CSS v4 | Component library and styling engine. |
| **State Management** | TanStack Query v5 | Server state management and caching. |
| **3D Graphics** | React Three Fiber (R3F) | Three.js renderer for React. |
| **Backend API** | Hono | Lightweight, type-safe web framework running on Next.js API routes. |
| **Database** | PostgreSQL | Relational database. |
| **ORM** | Prisma v6 | Type-safe database client and schema management. |
| **Authentication** | Better Auth | Secure, self-hosted authentication with Prisma adapter. |
| **AI Model** | Google Gemini 2.5 Flash | LLM for Agent and Simulator. |
| **Vector DB** | Upstash Vector | For RAG (Retrieval-Augmented Generation). |
| **Caching** | Upstash Redis | Semantic caching and session storage. |
| **Payments** | Stripe | Subscription management. |

### 2.2 System Architecture Diagram

```mermaid
graph TD
    Client[Client Browser]
    
    subgraph "Next.js Server"
        API[Hono API Routes]
        Auth[Better Auth]
        SSR[Server Components]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        Redis[(Upstash Redis)]
        Vector[(Upstash Vector)]
    end
    
    subgraph "External Services"
        Gemini[Google Gemini AI]
        Stripe[Stripe Payments]
    end
    
    Client -->|HTTP/JSON| API
    Client -->|HTML/RSC| SSR
    API -->|Prisma| DB
    API -->|REST| Redis
    API -->|REST| Vector
    API -->|REST| Gemini
    API -->|API| Stripe
    Auth -->|Prisma| DB
```

---

## 3. Directory Structure

```
softcom-26/
├── prisma/
│   └── schema.prisma       # Database schema definition
├── public/                 # Static assets (3D models, images)
├── seed/                   # Database seeding scripts
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # API Routes (Hono entry point)
│   │   ├── (auth)/         # Authentication pages
│   │   ├── dashboard/      # Protected application pages
│   │   └── page.tsx        # Landing page
│   ├── components/         # React components
│   │   ├── 3d Model/       # R3F components (Cash_register.jsx)
│   │   ├── assistant/      # AI Agent UI components
│   │   ├── ui/             # Shadcn UI primitives
│   │   └── providers/      # Context providers (Query, Business)
│   ├── generated/          # Generated Prisma client
│   ├── hooks/              # Custom React hooks (TanStack Query wrappers)
│   ├── lib/                # Core logic and utilities
│   │   ├── agent/          # AI Agent logic (RAG, Simulator)
│   │   │   ├── simulator/  # Financial Time Machine core
│   │   │   └── ...         # Agent orchestration
│   │   ├── auth.ts         # Better Auth configuration
│   │   ├── db.ts           # Prisma client instance
│   │   ├── hono.ts         # Hono RPC client
│   │   └── upstash/        # Redis client
│   ├── middleware.ts       # Route protection middleware
│   └── routes.ts           # Route configuration
└── ...config files
```

---

## 4. Database Schema & Data Model

The database is normalized and uses a multi-tenant architecture where data is scoped to a `Business`.

### 4.1 Core Entities

- **User**: The system user. Can own multiple businesses.
- **Business**: The central entity. All accounting data is linked to a Business ID.
- **Subscription**: Tracks user's Stripe subscription and usage limits.

### 4.2 Accounting Entities (Double-Entry)

- **LedgerAccount**: Represents a chart of accounts (Assets, Liabilities, Equity, Revenue, Expenses).
    - `type`: AccountType (ASSET, LIABILITY, etc.)
    - `normalBalance`: DEBIT or CREDIT
    - `currentBalance`: Cached balance for performance.
- **Transaction**: A high-level business event (Income, Expense, Transfer).
- **JournalEntry**: The immutable accounting record.
    - Linked to a `Transaction` and a `LedgerAccount`.
    - Contains `debitAmount` and `creditAmount`.
    - `entryType`: STANDARD, ADJUSTING, CLOSING.

### 4.3 AI & Analytics

- **ActionLog** (Redis): Logs user interactions with the AI agent.
- **Vector Embeddings** (Upstash): Stores embeddings of transactions and documents for RAG.

---

## 5. Core Modules Deep Dive

### 5.1 Authentication (Better Auth)
- **Implementation**: `src/lib/auth.ts`
- **Adapter**: Prisma Adapter.
- **Strategies**: Email/Password, Google OAuth.
- **Middleware**: `src/middleware.ts` protects routes based on `src/routes.ts` configuration.
- **Session**: Stored in PostgreSQL, managed via cookies.

### 5.2 Financial Simulator ("Time Machine")
- **Location**: `src/lib/agent/simulator/`
- **Concept**: Simulates alternative realities based on "what-if" queries.
- **Architecture**: State Machine Pattern.
    1.  **Parse Query**: Gemini converts natural language to structured `Scenario` (e.g., `{ type: "hire", startMonthsAgo: 3, cost: 5000 }`).
    2.  **Fetch Data**: Retrieves historical data or generates realistic synthetic data.
    3.  **Simulate**: Applies the scenario logic (e.g., subtract salary, add revenue ramp-up) to create a `SimulationTimeline`.
    4.  **Calculate Impact**: Compares `RealityTimeline` vs `SimulationTimeline`.
    5.  **Generate Verdict**: Gemini analyzes the delta and provides strategic advice.
- **Caching**: Redis caches simulation results for 7 days.

### 5.3 Optimized AI Agent
- **Location**: `src/lib/agent/optimized-agent.ts`
- **Features**:
    - **Intent Classification**: Determines if query is "SIMPLE_DASHBOARD", "RAG_SEARCH", or "COMPLEX".
    - **Semantic Caching**: Caches responses for 15 minutes to reduce latency and costs.
    - **RAG (Retrieval-Augmented Generation)**: Fetches relevant context from Upstash Vector.
    - **Dashboard Context**: Injects current KPI data (Cash, Revenue, Profit) into the prompt.
- **Performance**:
    - Simple queries: <500ms (Cache/Dashboard only).
    - Complex queries: <3s (Full RAG + LLM).

### 5.4 3D Visualization
- **Location**: `src/components/3d Model/`
- **Tech**: React Three Fiber.
- **Components**:
    - `Cash_register.jsx`: Interactive 3D model of a cash register.
    - `orb-scene.tsx`: Animated orb for the AI voice assistant.
- **Integration**: Embedded in React components using `<Canvas>`.

### 5.5 API Layer (Hono)
- **Location**: `src/app/api/[[...route]]/route.ts`
- **Structure**:
    - `controllers/(base)/`: Contains route handlers (business, transactions, agent, etc.).
    - **Type Safety**: Uses `zValidator` for request validation.
    - **RPC**: Client-side uses `hc<AppType>` for fully typed API calls (`src/lib/hono.ts`).

---

## 6. API Reference

All API routes are prefixed with `/api`.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/*` | POST/GET | Better Auth endpoints (sign-in, sign-up, session). |
| `/api/business` | GET/POST | Manage user businesses. |
| `/api/transactions` | GET/POST | Create and list transactions. |
| `/api/agent/chat` | POST | Send a message to the AI agent. |
| `/api/simulator` | POST | Run a financial simulation. |
| `/api/simulator/history/:id` | GET | Get simulation history. |
| `/api/reports/balance-sheet` | GET | Generate Balance Sheet. |
| `/api/reports/pnl` | GET | Generate Profit & Loss statement. |

---

## 7. Environment Configuration

Required environment variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/db"

# Authentication
BETTER_AUTH_SECRET="random_string"
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# AI & Vector
GOOGLE_GEMINI_API_KEY="..."
UPSTASH_VECTOR_REST_URL="..."
UPSTASH_VECTOR_REST_TOKEN="..."

# Redis (Caching)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Payments
STRIPE_SECRET_KEY="..."
STRIPE_WEBHOOK_SECRET="..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="..."
```

---

## 8. Development Workflow

1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

2.  **Database Setup**:
    ```bash
    # Generate Prisma Client
    pnpm dlx prisma generate
    
    # Push Schema to DB
    pnpm dlx prisma db push
    
    # Seed Database
    npx tsx seed/index.ts
    ```

3.  **Run Development Server**:
    ```bash
    pnpm dev
    ```
    Access at `http://localhost:3000`.

4.  **Run Tests**:
    ```bash
    pnpm test
    ```

---

## 9. Key Workflows

### 9.1 Creating a Transaction
1.  User submits form.
2.  `useCreateTransaction` hook calls `client.api.transactions.$post`.
3.  Hono controller validates input via Zod.
4.  Controller calls `db.transaction.create`.
5.  **Crucial Step**: Controller automatically creates 2 `JournalEntry` records (Debit & Credit) based on the transaction type and selected accounts.
6.  `LedgerAccount` balances are updated (if using a trigger or calculated on fly).

### 9.2 Running a Simulation
1.  User asks "What if I hired someone?".
2.  `useRunSimulation` calls `/api/simulator`.
3.  `GeminiClient` parses query -> `Scenario`.
4.  `SimulatorGraph` executes the state machine.
5.  Results stored in Redis.
6.  Frontend receives `SimulationResult` and renders comparison charts.

### 9.3 AI Chat
1.  User types message.
2.  `processOptimizedAgentQuery` is called.
3.  System checks Redis cache.
4.  If miss, classifies intent.
5.  Fetches context (RAG/Dashboard).
6.  Gemini generates response.
7.  Response cached and returned.
