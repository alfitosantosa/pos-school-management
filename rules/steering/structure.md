# Project Structure

## Top-Level Layout

```
app/                  # Next.js App Router root
components/           # Shared UI components
lib/                  # Shared utilities and singletons
prisma/               # Prisma schema and migrations (if present)
public/               # Static assets
```

## App Directory

```
app/
├── (backend)/api/    # API route handlers (Next.js Route Handlers)
├── (pages)/dashboard/# Protected dashboard pages by role/domain
├── auth/             # Auth pages (sign-in, sign-up)
├── hooks/            # TanStack Query hooks, grouped by domain
├── types/            # TypeScript type definitions
├── client/           # Client-only providers (ReactQueryProvider)
├── action/           # Server actions (if any)
├── repository/       # Data access layer (if any)
├── globals.css       # Global styles
├── layout.tsx        # Root layout
└── page.tsx          # Root page (redirects to dashboard or auth)
```

## Route Groups

- `(backend)` — API routes only, no UI. Each domain has its own folder under `/api/`.
- `(pages)` — All dashboard UI pages. Nested by role/domain (e.g. `/dashboard/teacher/attendance/[id]`).

## API Routes Convention

- One folder per resource under `app/(backend)/api/`
- `route.ts` exports named HTTP handlers: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- Dynamic segments use `[id]` or descriptive param names like `[idTeacher]`
- Sub-resources use nested folders: `/api/attendance/class/bulk/`
- Always mark API route files with `"use server"` at the top
- Use `prisma` from `@/lib/prisma` for all DB access
- Return `NextResponse.json(...)` for all responses; include `{ status: 500 }` on errors

## Hooks Convention

- Located in `app/hooks/{Domain}/use{Feature}.ts`
- Always `"use client"` directive
- Use TanStack Query (`useQuery` / `useMutation`)
- Use `apiGet`, `apiPost`, etc. from `@/lib/api-client`
- `queryKey` arrays should be descriptive and consistent (e.g. `["students"]`, `["students-by-tahfidz-group", id]`)

## Components

```
components/
├── ui/               # shadcn/ui primitives (do not modify generated files)
│   ├── kibo-ui/      # Extended kibo-ui components
│   └── shadcn-io/    # Additional shadcn components
├── date/             # Date picker components
├── dialog/           # Dialog/modal components
└── navbar.tsx, footer.tsx, loading.tsx, etc.
```

## Types

- Domain types live in `app/types/{domain}-types.ts`
- Keep types close to their domain; avoid a single monolithic types file

## Key Lib Files

| File                | Purpose                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| `lib/api-client.ts` | Fetch wrapper (`apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`) |
| `lib/auth.ts`       | Better Auth instance                                                   |
| `lib/prisma.ts`     | Prisma client singleton                                                |

## Path Aliases

- `@/` maps to the project root (configured in `tsconfig.json`)
- Always use `@/` imports, never relative `../../` imports
