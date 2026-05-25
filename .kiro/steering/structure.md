# Project Structure & Organization

## Directory Layout

```
pos-rahmany-new-2/
├── app/                              # Next.js App Router
│   ├── (action)/                     # Server actions
│   │   └── createPDF/                # PDF generation utilities
│   ├── (backend)/                    # Backend API routes
│   │   └── api/                      # RESTful API endpoints
│   │       ├── academicyear/         # Academic year management
│   │       ├── accountbank/           # Bank account management
│   │       ├── admin/                # Admin operations
│   │       ├── attendance/            # Attendance tracking
│   │       ├── auth/                 # Authentication routes
│   │       ├── betterauth/           # Better Auth integration
│   │       ├── botwa/                # WhatsApp bot integration
│   │       ├── class/                # Class management
│   │       ├── major/                # Major/program management
│   │       ├── payment/              # Payment processing
│   │       ├── paymenttype/          # Payment type configuration
│   │       ├── roles/                # Role management
│   │       ├── schedules/            # Schedule management
│   │       ├── students/             # Student management
│   │       ├── tahfidzgroup/         # Tahfidz group management
│   │       ├── tahfidzrecord/        # Tahfidz record tracking
│   │       ├── userdata/             # User data management
│   │       ├── violations/           # Violation/discipline records
│   │       └── [other endpoints]/    # Additional API routes
│   ├── (frontend)/                   # Frontend pages
│   │   └── dashboard/                # Dashboard and admin pages
│   │       ├── page.tsx              # Main dashboard
│   │       ├── users/                # User management
│   │       ├── majors/               # Major management
│   │       ├── roles/                # Role management
│   │       ├── bendahara/            # Finance staff pages
│   │       │   ├── users/
│   │       │   ├── class/
│   │       │   ├── payment/
│   │       │   ├── billing/
│   │       │   └── paymenttype/
│   │       ├── payments/             # Payment pages
│   │       ├── accountbank/          # Bank account pages
│   │       ├── paymenttypes/         # Payment type pages
│   │       ├── upload/               # File upload pages
│   │       ├── parent/               # Parent portal
│   │       ├── reports/              # Reporting pages
│   │       └── [other pages]/        # Additional pages
│   ├── (hooks)/                      # Custom React hooks
│   │   └── hooks/
│   │       ├── Attendances/          # Attendance-related hooks
│   │       ├── Payments/             # Payment-related hooks
│   │       └── [other hooks]/        # Additional hooks
│   ├── auth/                         # Authentication pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Home page
├── components/                       # Reusable React components
│   ├── ui/                           # UI components (Radix-based)
│   │   ├── card.tsx
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── select.tsx
│   │   ├── input.tsx
│   │   ├── calendar.tsx
│   │   └── [other UI components]/
│   ├── dialog/                       # Dialog/modal components
│   │   ├── DialogUser.tsx
│   │   ├── DialogFindStudentByIdMajor.tsx
│   │   └── [other dialogs]/
│   ├── date/                         # Date-related components
│   │   └── datePicker.tsx
│   ├── navbar.tsx                    # Navigation bar
│   ├── footer.tsx                    # Footer component
│   └── [other components]/           # Additional components
├── lib/                              # Utility functions and libraries
│   ├── prisma.ts                     # Prisma client instance
│   ├── auth.ts                       # Authentication utilities
│   └── [other utilities]/            # Additional utilities
├── prisma/                           # Database schema and migrations
│   ├── schema.prisma                 # Prisma data model
│   ├── generated/                    # Generated Prisma client
│   └── migrations/                   # Database migrations
├── public/                           # Static assets
│   ├── images/
│   ├── icons/
│   └── [other assets]/
├── repository/                       # Data/configuration files
│   └── month.json                    # Month configuration
├── .kiro/                            # Kiro configuration
│   ├── steering/                     # Steering documents
│   │   ├── product.md
│   │   ├── tech.md
│   │   └── structure.md
│   └── specs/                        # Feature specifications (generated)
├── .github/                          # GitHub configuration
│   └── modernize/                    # Code migration tracking
├── .husky/                           # Git hooks
├── .vscode/                          # VS Code settings
├── .next/                            # Next.js build output
├── node_modules/                     # Dependencies
├── .env                              # Environment variables (production)
├── .env.local                        # Environment variables (development)
├── .gitignore                        # Git ignore rules
├── .dockerignore                     # Docker ignore rules
├── Dockerfile                        # Docker configuration
├── docker-compose.yml                # Docker Compose configuration
├── tsconfig.json                     # TypeScript configuration
├── next.config.ts                    # Next.js configuration
├── package.json                      # Dependencies and scripts
├── package-lock.json                 # Dependency lock file
├── README.md                         # Project documentation
├── README_FIXES.md                   # Fix documentation
├── PAYMENT_LOGIC_ANALYSIS.md         # Payment logic documentation
└── setup.sh                          # Setup script
```

## Key Directory Purposes

### `/app/(backend)/api`

- RESTful API endpoints following Next.js App Router conventions
- Each resource has its own folder with `route.ts` file
- Supports GET, POST, PUT, DELETE operations
- Dynamic routes use `[id]` or `[paramName]` syntax
- Server-side logic with Prisma ORM

### `/app/(frontend)/dashboard`

- Admin and user-facing dashboard pages
- Role-based access control implemented
- Organized by feature/module (bendahara, payments, users, etc.)
- Client components with "use client" directive
- Uses React Query for data fetching

### `/app/(hooks)/hooks`

- Custom React hooks for data fetching and state management
- Organized by feature (Attendances, Payments, etc.)
- Typically wrap React Query hooks
- Provide typed interfaces for API responses

### `/components`

- Reusable React components
- `/ui` contains base UI components (buttons, cards, dialogs, etc.)
- `/dialog` contains modal/dialog components
- `/date` contains date-related components
- Components are typed with TypeScript

### `/lib`

- Utility functions and helper modules
- `prisma.ts` exports singleton Prisma client
- `auth.ts` contains authentication helpers
- Other utilities for common operations

### `/prisma`

- `schema.prisma` defines all database models and relationships
- `migrations/` contains database migration files
- `generated/` contains auto-generated Prisma client

## API Route Patterns

### Standard CRUD Routes

```
GET    /api/resource              # List all
POST   /api/resource              # Create
PUT    /api/resource              # Update (bulk)
DELETE /api/resource              # Delete (bulk)

GET    /api/resource/[id]         # Get single
PUT    /api/resource/[id]         # Update single
DELETE /api/resource/[id]         # Delete single
```

### Filtered/Specialized Routes

```
GET    /api/resource/filter/[param]     # Filter by parameter
GET    /api/resource/[id]/subresource   # Get related resources
POST   /api/resource/bulk/action        # Bulk operations
```

### Examples in Codebase

- `/api/class/route.ts` - Class CRUD
- `/api/attendance/student/[id]/route.ts` - Get student attendance
- `/api/payment/student/[studentId]/route.ts` - Get student payments
- `/api/students/major/[id]/route.ts` - Get students by major

## Component Organization

### UI Components (`/components/ui`)

- Built with Radix UI primitives
- Styled with Tailwind CSS
- Exported from individual files
- Used throughout the application

### Feature Components (`/components/dialog`, `/components/date`)

- Specific to features or use cases
- Combine multiple UI components
- Handle feature-specific logic

### Page Components (`/app/(frontend)/dashboard`)

- "use client" directive for interactivity
- Fetch data with React Query hooks
- Compose UI and feature components
- Handle page-level state

## Naming Conventions

### Files

- Components: `PascalCase.tsx` (e.g., `UserCard.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- API routes: `route.ts` in folder structure
- Hooks: `useFeatureName.ts` (e.g., `useAttendance.ts`)

### Folders

- Feature folders: `kebab-case` (e.g., `payment-items`)
- Grouped folders: `(parentheses)` for route grouping (e.g., `(backend)`, `(frontend)`)

### Database Models

- Model names: `PascalCase` (e.g., `User`, `Payment`)
- Table names: `snake_case` with `@@map` (e.g., `user_data`)
- Relations: camelCase (e.g., `student`, `teacher`)

## Important Files

### Configuration

- `tsconfig.json` - TypeScript configuration with path aliases
- `next.config.ts` - Next.js configuration
- `package.json` - Dependencies and scripts
- `.env` - Production environment variables
- `.env.local` - Development environment variables (not committed)

### Database

- `prisma/schema.prisma` - Complete data model definition
- Contains 40+ models for academic, financial, and administrative data

### Documentation

- `README.md` - Development and production optimization guide
- `README_FIXES.md` - Bug fixes and improvements
- `PAYMENT_LOGIC_ANALYSIS.md` - Payment system documentation

## Development Workflow

1. **Create API route** in `/app/(backend)/api/[resource]/route.ts`
2. **Define Prisma model** in `prisma/schema.prisma` if needed
3. **Create custom hook** in `/app/(hooks)/hooks/[Feature]/use[Feature].ts`
4. **Build UI components** in `/components/ui` or `/components/[feature]`
5. **Create page** in `/app/(frontend)/dashboard/[feature]/page.tsx`
6. **Test** with `npm run dev` and verify in browser

## Database Relationships

Key relationships to understand:

- `User` → `UserData` (1:1) - Extended user profile
- `UserData` → `Class` (many:1) - Student enrollment
- `Class` → `Schedule` (1:many) - Class schedules
- `Schedule` → `Attendance` (1:many) - Attendance records
- `UserData` → `Payment` (1:many) - Student payments
- `Payment` → `PaymentItems` (1:many) - Payment line items
- `UserData` → `Grade` (1:many) - Student grades
- `UserData` → `Violation` (1:many) - Student violations

## Performance Considerations

- Use React Query for server state management
- Implement proper pagination for large datasets
- Use Prisma `include` and `select` for efficient queries
- Leverage database indexes defined in schema
- Cache static assets with proper headers
- Use Turbopack for fast development builds
