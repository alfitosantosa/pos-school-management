# Tech Stack

## Framework & Runtime

- **Next.js 16** (App Router) with **React 19**
- **TypeScript 5**
- Output: `standalone` (Docker-optimized)
- Turbopack enabled for dev

## Database

- **PostgreSQL** via **Prisma 7** ORM
- `@prisma/adapter-pg` for direct PG connection
- `@prisma/extension-accelerate` for edge caching
- Prisma client imported from `@/lib/prisma`

## Authentication

- **Better Auth** (`better-auth`) with Prisma adapter
- Google OAuth provider
- Auth handler at `app/(backend)/api/auth/[...all]/route.ts`
- Auth lib at `lib/auth.ts`

## State & Data Fetching

- **TanStack Query v5** for server state (staleTime: 5min, gcTime: 30min, no refetch on focus/mount)
- **Jotai** for client-side global state
- **React Hook Form** + `@hookform/resolvers` for forms
- Custom fetch wrapper at `lib/api-client.ts` (`apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`)

## UI

- **Tailwind CSS v4**
- **shadcn/ui** components (Radix UI primitives) in `components/ui/`
- **Lucide React** for icons
- **Recharts** for charts
- **Sonner** for toast notifications
- **Motion** (Framer Motion) for animations
- **next-themes** for dark/light mode

## Payments

- **Midtrans** (`midtrans-client`) — production keys in `.env`

## Notifications

- **Evolution API** (WhatsApp bot) via `NEXT_PUBLIC_EVO_URL`

## Date Handling

- **date-fns v4** and **react-day-picker v9**

## File Handling

- `read-excel-file` and `xlsx` for Excel import/export (client-side only — excluded from server bundle via webpack config)

## Common Commands

```bash
# Development
npm run dev           # Next.js dev with Turbopack
npm run dev:clean     # Clear .next cache then dev

# Production
npm run build         # Prebuild clears cache, then next build
npm run start         # Production server

# Linting
npm run lint          # next lint

# Database
npx prisma generate   # Regenerate Prisma client
npx prisma db push    # Push schema changes to DB
npx prisma studio     # Open Prisma Studio GUI
```
