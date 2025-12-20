<div align="center">

# 💰 Finora

### AI-Powered Accounting Platform

A powerful, full-stack accounting application built with Next.js 15, featuring double-entry bookkeeping, multi-business support, AI-driven insights, and Stripe subscription billing.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.17-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## ✨ Features

### 🏢 Multi-Business Management

- Create and manage multiple businesses under a single account
- Switch between businesses seamlessly
- Business-scoped data isolation

### 📊 Double-Entry Bookkeeping

- Full chart of accounts with hierarchical structure
- Automatic journal entry generation
- Account types: Assets, Liabilities, Equity, Revenue, Expenses
- Balance tracking with debit/credit reconciliation

### 💳 Transaction Management

- Record income, expenses, and transfers
- Category-based organization
- Reference numbers and notes support
- Transaction reconciliation

### 📈 Analytics & Reporting

- Real-time financial dashboard
- Income vs expense trends
- Account balance summaries
- Custom financial reports

### 🔐 Authentication & Security

- Secure session-based authentication via Better Auth
- Role-based access control (User/Admin)
- Protected API routes and middleware

### 💎 Subscription Tiers

- **Free**: 50 transactions, 1 business
- **Pro**: Unlimited transactions, 3 businesses, 30 AI queries/month
- **Business**: Everything unlimited, 150 AI queries/month
- Stripe integration for payment processing

---

## 🛠️ Tech Stack

| Category             | Technology                   |
| -------------------- | ---------------------------- |
| **Framework**        | Next.js 15.5 with Turbopack  |
| **Language**         | TypeScript 5.0               |
| **UI Library**       | React 19                     |
| **Database**         | PostgreSQL + Prisma ORM      |
| **Authentication**   | Better Auth                  |
| **API Layer**        | Hono (Type-safe REST API)    |
| **State Management** | TanStack Query (React Query) |
| **Styling**          | Tailwind CSS 4               |
| **UI Components**    | shadcn/ui + Radix UI         |
| **Forms**            | React Hook Form + Zod        |
| **Payments**         | Stripe                       |
| **Animations**       | GSAP + Lenis                 |
| **3D Graphics**      | Three.js + React Three Fiber |
| **Charts**           | Recharts                     |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication pages (login, register)
│   ├── api/
│   │   └── [[...route]]/    # Hono API with catch-all routing
│   │       └── controllers/ # API controllers (business, transactions, etc.)
│   ├── dashboard/           # Protected dashboard pages
│   │   ├── accounts/        # Chart of accounts management
│   │   ├── analytics/       # Financial analytics
│   │   ├── business/        # Business management
│   │   ├── categories/      # Category management
│   │   ├── reports/         # Financial reports
│   │   └── transactions/    # Transaction management
│   └── pricing/             # Subscription pricing page
├── components/
│   ├── auth/                # Authentication components
│   ├── landing/             # Landing page sections
│   ├── providers/           # React context providers
│   └── ui/                  # shadcn/ui components
├── generated/
│   └── prisma/              # Generated Prisma client
├── hooks/                   # Custom React hooks (TanStack Query)
└── lib/                     # Utility functions and configurations
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **pnpm** package manager
- **PostgreSQL** database server

### 1. Clone the Repository

```bash
git clone <repository-url>
cd softcom-26
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/financeflow?schema=public"

# Authentication
BETTER_AUTH_SECRET="your-secure-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# API URL (optional, defaults to localhost)
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Stripe (for payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 4. Set Up the Database

```bash
# Push schema to database
pnpm dlx prisma db push

# Generate Prisma client
pnpm dlx prisma generate

# (Optional) Seed with sample data
npx tsx seed/index.ts
```

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📜 Available Scripts

| Command                    | Description                             |
| -------------------------- | --------------------------------------- |
| `pnpm dev`                 | Start development server with Turbopack |
| `pnpm build`               | Build for production                    |
| `pnpm start`               | Start production server                 |
| `pnpm lint`                | Run ESLint                              |
| `pnpm dlx prisma studio`   | Open Prisma Studio (database GUI)       |
| `pnpm dlx prisma db push`  | Push schema changes to database         |
| `pnpm dlx prisma generate` | Regenerate Prisma client                |

---

## 🗄️ Database Schema

### Core Models

- **User** - Authentication and profile
- **Business** - Multi-tenant business entities
- **LedgerAccount** - Chart of accounts with hierarchy
- **Transaction** - Income/expense/transfer records
- **JournalEntry** - Double-entry bookkeeping entries
- **Category** - Transaction categorization
- **Subscription** - Stripe subscription management

### Account Types

| Type      | Normal Balance | Examples                             |
| --------- | -------------- | ------------------------------------ |
| Asset     | Debit          | Cash, Accounts Receivable, Equipment |
| Liability | Credit         | Accounts Payable, Loans              |
| Equity    | Credit         | Owner's Equity, Retained Earnings    |
| Revenue   | Credit         | Sales, Service Income                |
| Expense   | Debit          | Rent, Utilities, Salaries            |

---

## 🔌 API Structure

The API is built with Hono and uses a catch-all route pattern:

```
/api/[...route]
├── /business          # Business CRUD operations
├── /transactions      # Transaction management
├── /ledger-accounts   # Chart of accounts
├── /categories        # Category management
├── /journal-entries   # Journal entries
├── /analytics         # Financial analytics
├── /reports           # Financial reports
└── /stripe            # Stripe webhooks & checkout
```

### Type-Safe Client

```typescript
import { client } from "@/lib/hono";

// Fully typed API calls
const response = await client.api.business.$get();
const businesses = await response.json();
```

---

## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) components built on Radix UI primitives. Components are located in `src/components/ui/`.

Key components include:

- Forms with validation (React Hook Form + Zod)
- Data tables with sorting and filtering
- Charts and visualizations (Recharts)
- Modals, drawers, and sheets
- Toast notifications (Sonner)

---

## 🔒 Authentication Flow

1. **Registration/Login** - Email/password via Better Auth
2. **Session Management** - Secure HTTP-only cookies
3. **Route Protection** - Middleware-based access control
4. **API Security** - `currentUser()` helper for server-side auth

### Protected Routes

Configure in `src/routes.ts`:

- `publicRoutes` - Accessible without auth
- `authRoutes` - Auth pages (redirect if logged in)
- All other routes require authentication

---

## 💳 Subscription System

### Tiers

| Feature      | Free     | Pro       | Business  |
| ------------ | -------- | --------- | --------- |
| Transactions | 50/month | Unlimited | Unlimited |
| Businesses   | 1        | 3         | Unlimited |
| AI Queries   | 0        | 30/month  | 150/month |
| Price        | $0       | $9.99/mo  | $24.99/mo |

### Stripe Integration

- Checkout sessions for upgrades
- Webhook handling for subscription events
- Automatic tier management

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**Built with ❤️ for modern accounting**

[Report Bug](../../issues) · [Request Feature](../../issues)

</div>
