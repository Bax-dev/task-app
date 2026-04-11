# TaskFlow

A collaborative project & task management app — organizations, spaces, projects, tasks, sprints, boards, notes, daily reports, and more.

Built with Next.js (App Router), TypeScript, Prisma, PostgreSQL, Redux Toolkit Query, and Tailwind.

## Requirements

- **Node.js** `^20 || ^22 || >=24` (Node 21 is not supported)
- **PostgreSQL** database
- **Yarn** (or npm)

## Setup

```bash
# 1. Install dependencies
yarn install

# 2. Configure environment
cp .env.example .env   # then fill in DATABASE_URL, JWT_SECRET, etc.

# 3. Run database migrations
yarn db:migrate

# 4. (Optional) Seed sample data
yarn db:seed

# 5. Start the dev server
yarn dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Environment variables

Minimum required in `.env`:

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Optional (feature-gated):

```
RESEND_API_KEY=...            # email delivery (otherwise logs to console)
EMAIL_FROM=noreply@...
TASKFLOW_CRON_SECRET=...      # required to hit cron endpoints
AWS_* / BEDROCK_*             # AI features (suggest task, subtasks, chat)
```

## Scripts

| Command | What it does |
|---|---|
| `yarn dev` | Start the dev server |
| `yarn build` | Production build |
| `yarn start` | Run the production build |
| `yarn lint` | ESLint |
| `yarn test` | Run Vitest tests |
| `yarn db:migrate` | Apply Prisma migrations |
| `yarn db:generate` | Regenerate Prisma client |
| `yarn db:studio` | Open Prisma Studio |

## Features

- **Organizations, spaces, projects** — multi-tenant hierarchy with role-based access (admin, member, guest)
- **Tasks** — assignments, priorities, due dates, subtasks, labels, issue types, custom fields, comments, attachments
- **Boards** — kanban with customizable columns per project
- **Sprints** — plan, run, and track sprints with burndown / velocity reports
- **Workflows & automations** — configurable state machines and rule-based triggers
- **Daily reports** — members submit what-they-did / blockers / tomorrow; admins configure reminder schedule; automatic email + in-app nudges for pending submissions
- **Notes** — lightweight org-scoped docs (Tiptap editor)
- **Notifications** — in-app feed + email, real-time via Redis pub/sub
- **Activity logs / audit trail** — admin-only history of org actions
- **AI** — task suggestions, subtask generation, summaries, and chat (AWS Bedrock)
- **Integrations** — GitHub, Slack, Google
- **Saved filters & dashboards** — reusable views and analytics

## Cron jobs

Some features rely on an external scheduler (Vercel Cron, GitHub Actions, etc.) hitting protected endpoints with the `x-taskflow-cron-secret` header:

- `POST /api/daily-reports/reminders` — send reminders to members who haven't submitted (runs every minute)
- `POST /api/tasks/overdue-reminders` — send overdue task notifications

## Project structure

```
app/            Next.js App Router (pages + API routes)
  (app)/        Authenticated app pages
  (auth)/       Login / signup / password reset
  api/          Route handlers + modular backend (controllers / services / models)
components/     React components (UI primitives + feature components)
lib/            Shared utilities (db client, auth guards, email, pub/sub, etc.)
prisma/         Schema + migrations
store/          Redux Toolkit + RTK Query
types/          Shared TypeScript types
hooks/          React hooks
```
