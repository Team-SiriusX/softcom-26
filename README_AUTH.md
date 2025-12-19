# Authentication Guide

This application uses [Better Auth](https://www.better-auth.com/) for authentication with email/password and social login support.

## Features

- ✅ Email & Password Authentication
- ✅ Google OAuth
- ✅ GitHub OAuth
- ✅ Protected Routes via Middleware
- ✅ Session Management
- ✅ Type-safe Auth Client

## Usage

### Using the Auth Client

```tsx
import { signIn, signUp, signOut, useSession } from "@/lib/auth-client";

// In a client component
const { data: session, isPending } = useSession();
```

### Sign In

Users can sign in at `/auth/sign-in` with:
- Email and password
- Google account
- GitHub account

### Sign Up

Users can create an account at `/auth/sign-up` with:
- Email, password, and name
- Google account
- GitHub account

### Sign Out

Use the `SignOutButton` component anywhere in your app:

```tsx
import { SignOutButton } from "@/components/auth/sign-out-button";

<SignOutButton />
```

### Checking Authentication Status

```tsx
import { useSession } from "@/lib/auth-client";

function MyComponent() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session?.user) {
    return <div>Not authenticated</div>;
  }

  return <div>Welcome, {session.user.name}!</div>;
}
```

### User Navigation Component

A complete user navigation component is available at `@/components/auth/user-nav`:

```tsx
import { UserNav } from "@/components/auth/user-nav";

// In your layout or navbar
<UserNav />
```

## Protected Routes

The middleware automatically protects routes:
- **Auth routes** (`/auth/sign-in`, `/auth/sign-up`): Redirect to `/` if already authenticated
- **Public routes** (`/`, `/sample`): Accessible to everyone
- **All other routes**: Require authentication, redirect to `/auth/sign-in` if not authenticated

Edit routes in `src/routes.ts`:

```typescript
export const authRoutes = ["/auth/sign-in", "/auth/sign-up"];
export const publicRoutes = ["/", "/sample"];
export const SIGN_IN_PAGE_PATH = "/auth/sign-in";
export const DEFAULT_LOGIN_REDIRECT = "/";
```

## Environment Variables

Make sure to set these in your `.env` file:

```env
# Database
DATABASE_URL="your-database-url"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key" # Generate with: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000" # Change in production

# Optional: For client-side
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth (optional)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

## Database Setup

Run migrations to set up the auth tables:

```bash
npx prisma migrate dev
```

## Customization

### Add More Fields to User

Edit `src/lib/auth.ts`:

```typescript
export const auth = betterAuth({
  // ... other config
  user: {
    additionalFields: {
      role: {
        type: "string",
      },
      // Add more fields here
    },
  },
});
```

### Change Default Redirect

Edit `src/routes.ts` to change where users land after login:

```typescript
export const DEFAULT_LOGIN_REDIRECT = "/dashboard"; // or any route
```

## Server-Side Session

To access the session on the server:

```tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function ServerComponent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return <div>Not authenticated</div>;
  }

  return <div>Welcome, {session.user.name}!</div>;
}
```

## API Routes

Protect API routes by checking the session:

```typescript
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Your protected API logic here
}
```
