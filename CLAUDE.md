# Edlog — CLAUDE.md

Comprehensive guide for AI assistants working on this codebase.

## Project Overview

**Edlog** is a mobile-first web application for teachers in Cameroonian secondary schools to quickly fill digital curriculum logbooks. The target workflow is entry creation in under 60 seconds, with pre-loaded GCE curriculum data.

**Core roles:**
- `TEACHER` — Creates logbook entries
- `SCHOOL_ADMIN` — Manages teachers, views reports for their school
- `RPI_MEMBER` — Regional board oversight across schools

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Database | PostgreSQL + Prisma ORM 5 |
| Auth | NextAuth 5 (beta) — JWT strategy |
| Styling | Tailwind CSS 3 |
| Validation | Zod 4 |
| Icons | Lucide React |
| Password hashing | bcryptjs (12 rounds) |

---

## Directory Structure

```
src/
├── app/
│   ├── (auth)/              # Public auth routes: /login, /register
│   ├── (dashboard)/         # Protected routes (require session)
│   │   ├── logbook/         # Entry dashboard + new entry form
│   │   ├── history/         # Full entry history with filters
│   │   ├── profile/         # User profile management
│   │   └── admin/           # Admin-only: teachers, reports
│   ├── api/                 # API route handlers
│   │   ├── auth/            # NextAuth + registration
│   │   ├── entries/         # Logbook entry CRUD
│   │   ├── subjects/        # Subject & topic data
│   │   ├── classes/         # Class listing
│   │   └── admin/           # Admin-only endpoints
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   └── globals.css          # Global styles + Tailwind imports
├── components/
│   ├── ui/                  # Primitive components: Button, Input, Card, Badge,
│   │                        #   Select, Textarea, LoadingSpinner, Toast
│   ├── BottomNav.tsx        # Mobile bottom navigation
│   ├── EntryCard.tsx        # Logbook entry display
│   ├── EmptyState.tsx       # Empty state UI
│   ├── SignaturePad.tsx     # Digital signature capture
│   └── StatsCard.tsx        # Statistics display
├── hooks/
│   ├── useEntries.ts        # Entry fetching hook
│   └── useSubjects.ts       # Subject data hook
├── lib/
│   ├── auth.ts              # NextAuth config + getSessionUser()
│   ├── db.ts                # Prisma client singleton
│   ├── utils.ts             # Date formatting, sanitization, cn()
│   └── validations.ts       # Zod schemas for all API inputs
└── types/
    └── index.ts             # Shared TypeScript types
prisma/
├── schema.prisma            # Database schema
└── seed.ts                  # Seed script for dev data
```

---

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (or use SQLite for local dev)

### Environment Variables
Copy `.env.example` to `.env.local` and fill in:
```bash
DATABASE_URL="postgresql://..."    # Or "file:./dev.db" for SQLite
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<random secret>"
AUTH_SECRET="<random secret>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Edlog"
```

### Commands
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # prisma generate && next build
npm run start        # Start production server
npm run lint         # ESLint check
npm run seed         # Seed database with curriculum/school data
```

### Database Setup
```bash
npx prisma migrate dev    # Apply migrations (development)
npx prisma migrate deploy # Apply migrations (production)
npx prisma studio         # Visual database browser
npm run seed              # Seed initial data
```

---

## Database Schema Key Points

### Models
- `User` — Teachers and admins; has `role`, `schoolId`, `isVerified`
- `School` — Institution linked to an `RPIBoard`; has a unique `code` for registration
- `Class` — e.g. "Form 5", "Lower Sixth", linked to `schoolId`
- `Subject` — Academic subject; linked to `schoolId` via `SchoolSubject`
- `Topic` — Curriculum topics organized by module number; belong to a `Subject`
- `LogbookEntry` — Core domain model (see below)
- `RPIBoard` — Regional board (top of the hierarchy)

### LogbookEntry Status Flow
```
DRAFT → SUBMITTED → VERIFIED
              ↓
           FLAGGED
```

### Important Indexes
- `teacherId + date` on `LogbookEntry` (enforce one entry per teacher per day/period combination)
- `classId + date` on `LogbookEntry`

---

## Authentication & Authorization

- Auth is managed by **NextAuth 5** with a Credentials provider and JWT sessions.
- Session max age: 30 days.
- Session contains: `id`, `email`, `name`, `role`, `schoolId`, `isVerified`.
- Use `getSessionUser()` from `src/lib/auth.ts` in API routes to get and validate the current user:

```typescript
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'SCHOOL_ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 });
  // ...
}
```

- Admin endpoints should **always** check `user.role`.
- Teachers only access their own entries unless they are an admin.

---

## API Route Conventions

All API routes live under `src/app/api/`. Conventions:

1. **Auth check first** — Call `getSessionUser()` at the top of every handler.
2. **Role guard** — Check `user.role` for admin-only routes.
3. **Validate input with Zod** — Parse request body through schemas in `src/lib/validations.ts`.
4. **Sanitize user-supplied HTML** — Use `sanitizeHtml()` from `src/lib/utils.ts` on any field that accepts free text.
5. **Scope data to user** — Teachers must only see/modify their own entries; filter by `teacherId: user.id`.
6. **JSON responses** — Use `Response.json({ ... }, { status: N })`.

### Existing Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/register` | Public | Teacher registration (requires school code) |
| GET | `/api/entries` | Teacher/Admin | List entries (filtered by role) |
| POST | `/api/entries` | Teacher | Create new logbook entry |
| PATCH | `/api/entries/[id]` | Teacher (owner) | Update entry |
| DELETE | `/api/entries/[id]` | Teacher (owner) | Delete entry |
| GET | `/api/subjects` | Teacher | List subjects + topics for school |
| GET | `/api/classes` | Teacher | List classes for school |
| GET | `/api/admin/stats` | SCHOOL_ADMIN | Dashboard statistics |
| GET | `/api/admin/teachers` | SCHOOL_ADMIN | List teachers |
| POST | `/api/admin/teachers/[id]/verify` | SCHOOL_ADMIN | Verify teacher account |
| GET | `/api/admin/entries` | SCHOOL_ADMIN | All entries for school |

---

## Component Conventions

### UI Primitives (`src/components/ui/`)
Use these before reaching for Tailwind directly:
- `Button` — Accepts `variant`, `size` props
- `Input`, `Textarea`, `Select` — Controlled form elements
- `Card` — Content container
- `Badge` — Status indicator (maps to `EntryStatus`)
- `LoadingSpinner` — Loading state
- `Toast` — Notification system (call `showToast()`)

### Path Alias
Always import using the `@/` alias:
```typescript
import { Button } from '@/components/ui/Button';
import { db } from '@/lib/db';
import type { SessionUser } from '@/types';
```

---

## Validation Schemas

All schemas are in `src/lib/validations.ts` using Zod 4:

- `loginSchema` — `{ email, password }`
- `registerSchema` — `{ name, email, password, confirmPassword, schoolCode, role }`
- `createEntrySchema` — Full logbook entry fields
- `updateEntrySchema` — Partial version of `createEntrySchema`

To add a new schema:
```typescript
export const mySchema = z.object({ ... });
export type MyInput = z.infer<typeof mySchema>;
```

---

## Styling Conventions

- **Tailwind CSS** for all styling — no separate CSS modules or styled-components.
- Use the `cn()` utility from `src/lib/utils.ts` for conditional class names.
- Custom brand color: `brand-*` (50–950 shades, blue-based) defined in `tailwind.config.ts`.
- Custom font: `Inter` (loaded via `next/font`).
- Custom animation: `slide-down` available as `animate-slide-down`.
- **Mobile-first** — always design for small screens first; the bottom nav is the primary navigation.

---

## Utility Functions (`src/lib/utils.ts`)

| Function | Purpose |
|----------|---------|
| `cn(...classes)` | Merge Tailwind class names conditionally |
| `formatDate(date)` | Format date to GB locale string |
| `getWeekNumber(date)` | ISO week number from a date |
| `sanitizeHtml(input)` | Strip dangerous HTML from user input (XSS prevention) |
| `truncate(str, length)` | Truncate string with ellipsis |

---

## TypeScript Types (`src/types/index.ts`)

Key types:
```typescript
type Role = 'TEACHER' | 'SCHOOL_ADMIN' | 'RPI_MEMBER';
type EntryStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'FLAGGED';

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  schoolId: string;
  isVerified: boolean;
}

interface EntryWithRelations {
  // LogbookEntry + nested subject, topic, class, teacher relations
}

interface AdminStats {
  // Statistics data shape for admin dashboard
}
```

---

## Security Considerations

- **Never skip auth checks** in API routes — always call `getSessionUser()` first.
- **Sanitize all HTML input** using `sanitizeHtml()` before storing in the database.
- **Password hashing** uses bcryptjs with 12 rounds — do not reduce this.
- **Role checks** must be explicit — never infer permissions from frontend state.
- **Input validation** — always parse with Zod before using request body data.
- **Scope queries** to the authenticated user's school/ID to prevent cross-tenant data leaks.

---

## Testing

There are currently **no automated tests**. When adding tests:

- Preferred framework: **Vitest** (aligns with the Next.js/TypeScript stack)
- Unit test utilities: `src/lib/utils.ts`, validations, type guards
- Integration tests: API routes using `msw` or Next.js test utilities
- Place test files adjacent to source: `foo.test.ts` next to `foo.ts`

---

## No CI/CD Configured

There are no GitHub Actions workflows. When setting up CI, recommended jobs:
1. `lint` — `npm run lint`
2. `type-check` — `npx tsc --noEmit`
3. `build` — `npm run build` (requires `DATABASE_URL` env var)
4. `test` — once test suite is added

---

## Common Patterns

### Adding a New API Route
1. Create `src/app/api/<resource>/route.ts`
2. Check session with `getSessionUser()`
3. Validate input with a Zod schema
4. Query via `db` from `src/lib/db.ts`
5. Return `Response.json()`

### Adding a New Page
1. Create `src/app/(dashboard)/<page>/page.tsx` for protected pages
2. Use existing UI components from `src/components/ui/`
3. Fetch data using custom hooks from `src/hooks/` or direct API calls

### Adding a New Validation Schema
1. Add to `src/lib/validations.ts`
2. Export the inferred type: `export type Foo = z.infer<typeof fooSchema>`

### Modifying the Database Schema
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <migration-name>`
3. Update `prisma/seed.ts` if seed data needs changing
4. Run `npm run seed` to re-seed

---

## Prisma Client Usage

Always import the singleton:
```typescript
import { db } from '@/lib/db';
```

The singleton prevents connection pool exhaustion in development (Next.js hot-reload creates multiple instances otherwise). Never instantiate `new PrismaClient()` directly in application code.
