# Surge-25

A Next.js application with authentication, database integration using Prisma, and a modern UI component library.

## Tech Stack

- **Framework:** Next.js 15.5.5 (React 19)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Better Auth
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI + shadcn/ui
- **API Layer:** Hono
- **State Management:** TanStack Query (React Query)
- **Form Handling:** React Hook Form + Zod

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (Package manager)
- **PostgreSQL** (Database server)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd surge-25
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory and add the following environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/surge25?schema=public"

# Auth (Better Auth)
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

```

> **Note:** Replace the database credentials with your actual PostgreSQL connection details. Generate a secure secret for `BETTER_AUTH_SECRET`.

### 3. Install Dependencies

Install all required packages using pnpm:

```bash
pnpm install
```

### 4. Set Up the Database

#### Option A: If you have an existing database with tables

Generate the Prisma client:

```bash
pnpm dlx prisma generate
```

#### Option B: If your database is empty or you need to create tables

Push the Prisma schema to your database:

```bash
pnpm dlx prisma db push
```

This will:
- Create all necessary tables in your database
- Generate the Prisma client in `src/generated/prisma`

### 5. Run the Development Server

Start the development server with:

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Production Deployment

### Build the Application

To create an optimized production build:

```bash
pnpm run build
```

### Start the Production Server

After building, start the production server:

```bash
pnpm run start
```

## Available Scripts

- **`pnpm run dev`** - Start the development server with Turbopack
- **`pnpm run build`** - Build the application for production
- **`pnpm run start`** - Start the production server
- **`pnpm run lint`** - Run ESLint to check for code issues
- **`pnpm dlx prisma generate`** - Generate Prisma client
- **`pnpm dlx prisma db push`** - Push schema changes to the database
- **`pnpm dlx prisma studio`** - Open Prisma Studio to view/edit data

## Project Structure

```
surge-25/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js app directory
│   │   ├── api/              # API routes
│   │   ├── auth/             # Authentication pages
│   │   └── sample/           # Sample feature module
│   ├── components/           # React components
│   │   ├── providers/        # Context providers
│   │   └── ui/              # UI components (shadcn/ui)
│   ├── constants/            # App constants
│   ├── generated/            # Generated files (Prisma client)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   └── middleware.ts        # Next.js middleware
├── .env                      # Environment variables (create this)
└── package.json             # Dependencies and scripts
```

## Database Schema

The application uses the following main models:

- **User** - User accounts with role-based access
- **Session** - User sessions for authentication
- **Account** - OAuth and credential accounts
- **Verification** - Email/phone verification tokens

## Troubleshooting

### Prisma Client Not Found

If you encounter errors about Prisma client not being found:

```bash
pnpm dlx prisma generate
```

### Database Connection Issues

- Verify your `DATABASE_URL` in `.env` is correct
- Ensure PostgreSQL is running
- Check that the database exists

### Port Already in Use

If port 3000 is already in use, you can specify a different port:

```bash
pnpm dev -- -p 3001
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
