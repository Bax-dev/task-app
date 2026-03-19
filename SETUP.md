# TaskFlow - Production-Ready Task Management

A full-stack, multi-tenant task management application built with Next.js, PostgreSQL, and TypeScript.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS, React Query, Zustand
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Auth**: JWT (jose) + bcrypt password hashing
- **Email**: Nodemailer (SMTP)
- **Testing**: Vitest
- **Validation**: Zod

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Yarn or npm

## Quick Start

```bash
# 1. Install dependencies
yarn install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your database URL and JWT secret

# 3. Generate Prisma client
yarn db:generate

# 4. Run database migrations
yarn db:migrate

# 5. Start development server
yarn dev
```

## Architecture

### Backend Modules (`app/api/modules/`)

Each module follows clean architecture with separation of concerns:

```
/modules
  /auth           - Register, login, logout, session
  /users          - User profiles, org members
  /organizations  - CRUD, membership management
  /projects       - CRUD, org-scoped
  /tasks          - CRUD, assignment, status/priority
  /invitations    - Email invites, accept flow

Each module contains:
  /models/       - Prisma queries only (no business logic)
  /services/     - Business logic, validation rules
  /controllers/  - Request/response handling
  /types/        - Zod schemas, DTOs, interfaces
  /utils/        - Module-specific helpers
```

### Shared Infrastructure

```
/lib
  /auth/         - JWT, password hashing, session cookies
  /db/           - Prisma client singleton
  api-client.ts  - Frontend fetch wrapper
  api-response.ts - Standardized API responses
  email.ts       - Email sending (nodemailer)
  rate-limit.ts  - In-memory rate limiter
  query-client.tsx - React Query provider

/middleware
  auth-guard.ts  - JWT verification from request
  org-guard.ts   - Organization membership checks
  validate.ts    - Zod validation wrapper
```

### Frontend

```
/hooks           - React Query hooks (use-auth, use-organizations, etc.)
/stores          - Zustand stores (auth-store, org-store)
/components      - UI components (auth, layout, tasks, organizations)
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register with name, email, password
- `POST /api/auth/login` - Login with email, password
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/me` - Get current user

### Organizations
- `GET /api/organizations` - List user's organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id` - Get organization details
- `PATCH /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization (admin only)
- `GET /api/organizations/:id/members` - List members
- `GET /api/organizations/:id/projects` - List projects
- `GET /api/organizations/:id/invitations` - List invitations

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/tasks` - List project tasks

### Tasks
- `GET /api/tasks` - List user's tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/assign` - Toggle assignment

### Invitations
- `POST /api/invitations` - Create invitation (admin only)
- `GET /api/invitations/:token` - Get invitation details
- `POST /api/invitations/accept` - Accept invitation

### Users
- `GET /api/users/profile` - Get profile
- `PATCH /api/users/profile` - Update profile

## Security

- JWT tokens in HTTP-only cookies (7-day expiry)
- bcrypt password hashing (12 rounds)
- Zod input validation on all endpoints
- Rate limiting on login/invite endpoints
- Organization-scoped queries prevent cross-tenant access
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- CSRF protection via SameSite cookies

## Roles

- **ADMIN**: Full access, can invite members, manage org settings
- **MEMBER**: Can create/manage projects and tasks

## Testing

```bash
yarn test        # Run all tests
yarn test:watch  # Watch mode
```

## Deployment

### Vercel
```bash
vercel deploy
```

### Environment Variables (Production)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong random secret for JWT signing
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email config
- `EMAIL_FROM` - Sender email address
- `NEXT_PUBLIC_APP_URL` - Public app URL

## Scripts

```bash
yarn dev          # Development server
yarn build        # Production build
yarn start        # Production server
yarn test         # Run tests
yarn db:generate  # Generate Prisma client
yarn db:migrate   # Run migrations
yarn db:push      # Push schema to DB
yarn db:studio    # Open Prisma Studio
```
