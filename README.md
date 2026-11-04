# ReportFlow — Smart Business Report Generation System

**[Live Demo](https://reportflow-report-generation.vercel.app) · [GitHub Source](https://github.com/Sameer37609/reportflow-report-generation)**

A full-stack sales reporting application built with Next.js, TypeScript, PostgreSQL and Prisma. Explore sales KPIs, revenue trends and category performance, preview filtered reports, and download CSV or JSON.

**The hosted Vercel application is a read-only portfolio demo.** It uses 48 fictional transactions, connects to no database and rejects public write operations on the server. Visitors can explore reports and export results without an account; custom previews are not saved.

The local application provides PostgreSQL-backed transaction CRUD and persistent saved report definitions. Local records and credentials are never included in the public demo. Neither mode implements user authentication or Admin/Viewer permissions.

![ReportFlow dashboard with fictional demo data](docs/images/dashboard.png)

## Features

- **Analytics dashboard:** completed revenue, total transactions, completed transactions and average transaction value, with monthly revenue and category charts.
- **Reporting:** Sales Summary and Category Performance, inclusive date ranges, optional category filters, saved report previews and live custom report exploration.
- **Exports:** CSV and JSON downloads containing report metadata, filtered transactions and exact-money summaries; Category Performance also includes category totals.
- **Search and filtering:** customer/transaction ID search, category/status filters, report title search and report-type filters. Transactions are sorted newest-first; column-click sorting is not implemented.
- **Local data management:** validated transaction create/edit/delete, duplicate-ID handling, delete confirmation, saved reports and persistence after refresh or server restart.
- **Responsive interface:** desktop, tablet and mobile layouts, visible keyboard focus, named controls, loading/error feedback and useful empty states.

Revenue counts completed transactions only; total transaction count includes all statuses. Server and export calculations use decimal arithmetic, PostgreSQL stores DECIMAL(12,2), and UI calculations sum integer cents. Reports reflect current records rather than immutable historical snapshots.

## Technology

Next.js App Router · React · TypeScript · Tailwind CSS · Lucide React · Next.js Route Handlers · Prisma ORM · PostgreSQL · Vercel

Charts use SVG/CSS. CSV/JSON exports use shared calculation and formatting utilities without an additional export library.

## Run the demo locally

Requires Node.js 22.18+ and npm. No PostgreSQL setup or environment file is needed for demo mode.

```bash
npm ci
npm run demo:dev
```

Open [localhost:3000](http://127.0.0.1:3000). For an optimized build:

```bash
npm run demo:build
npm run demo:start
```

The demo scripts explicitly select demo mode and mask any local database connection variable. Installation generates the Prisma client but does not connect to a database, apply migrations or seed data.

## Local PostgreSQL development

Create a dedicated local development role/database using your PostgreSQL administrator account:

```bash
psql -h localhost -p 5432 -U postgres -d postgres -W
```

At the SQL prompt, enter the following. The password is entered privately through the prompt:

```sql
CREATE ROLE reportflow_user LOGIN CREATEDB;
\password reportflow_user
CREATE DATABASE reportflow_dev OWNER reportflow_user;
\q
```

Do not repeat CREATE statements for existing objects. Substitute your administrator account and PostgreSQL executable path if needed. CREATEDB is used for Prisma's development shadow database, not a production application role.

Configure a Git-ignored `.env` using [.env.example](.env.example) as a template:

| Variable          | Local development                                 | Hosted demo               |
| ----------------- | ------------------------------------------------- | ------------------------- |
| `REPORTFLOW_MODE` | `local`                                           | `demo`                    |
| `DATABASE_URL`    | Private connection URL for local `reportflow_dev` | Not required; leave unset |

On Windows, the setup helper prompts privately, URL-encodes the password and refuses to overwrite an existing `.env`:

```powershell
.\scripts\configure-local-db.ps1
```

On other systems, create `.env` locally and URL-encode special characters in the password. Never commit credentials or expose them through NEXT_PUBLIC variables.

```bash
npm ci
npm run db:generate
npm run db:migrate
npm run dev
```

Open [localhost:3000](http://127.0.0.1:3000). Local mode requires an explicit setting and a localhost database named `reportflow_dev`; normal start commands bind to loopback. Keep this unauthenticated writable workspace local.

An optional fictional seed is available for empty local tables:

```bash
node --env-file=.env --experimental-strip-types prisma/seed.mts
```

It requires local mode, refuses nonempty tables and never resets existing records.

## REST APIs and exports

| Endpoint                                       | Methods               | Purpose                                          |
| ---------------------------------------------- | --------------------- | ------------------------------------------------ |
| `/api/transactions`                            | GET; local POST       | List/create transactions                         |
| `/api/transactions/:id`                        | GET; local PUT/DELETE | Read/edit/delete a transaction                   |
| `/api/reports`                                 | GET; local POST       | List/save report definitions                     |
| `/api/reports/:id`                             | GET; local DELETE     | Definition, filtered rows and calculated metrics |
| `/api/analytics`                               | GET                   | Overall KPI totals                               |
| `/api/reports/:id/export?format=csv` or `json` | GET                   | Download a saved/sample report using its filters |
| `/api/reports/preview`                         | GET                   | Validate and calculate an unsaved report         |
| `/api/reports/preview/export`                  | GET                   | Export an unsaved report                         |

Preview parameters are `title`, `type`, `start`, `end` and optional `category`; preview exports also require `format`. Types are Sales Summary or Category Performance, and dates use YYYY-MM-DD. The server validates categories, statuses, dates, money precision and report ranges. Errors use consistent JSON responses with appropriate HTTP status codes.

CSV downloads use UTF-8, escaped quoted fields and spreadsheet formula-prefix protection. JSON retains exact monetary values as decimal strings. Downloads include sanitized filenames, appropriate content types and attachment headers. Empty reports retain metadata and zero totals. Exported values use the same reporting rules as previews.

## Tests and verification

```bash
npm run lint
npm run typecheck
npm test
npm run test:config
npm audit
npm audit --omit=dev
npm run demo:build
```

The automated suite covers calculations, CSV formula protection and escaping, empty exports, safe filenames, explicit deployment modes and compatibility of security-patched dependencies. To test demo APIs, serve the production demo on port 3004 and run:

```bash
node scripts/demo.mjs start --hostname 127.0.0.1 --port 3004
# In another terminal:
node tests/demo-api.mjs
```

Scoped local database/export/persistence test instructions and earlier results are recorded in [verification documentation](docs/PUBLIC-DEMO-VERIFICATION.md). These tests write identifiable fixtures and remove only recorded IDs; do not run them concurrently with manual data edits.

On 5 November 2026, hosted smoke checks verified six public pages, fictional-data totals, both report types' CSV/JSON responses and six safe write-denial probes. Full accessibility conformance and high-volume performance are not claimed.

## Deployment and security

The live demo is hosted on Vercel from the repository's `main` branch. Production demo mode requires `REPORTFLOW_MODE=demo` during build and runtime; no hosted PostgreSQL database or database credentials are needed. Standard Next.js build settings use the existing build script. Prisma's postinstall step generates its client only: migrations and seeds are not run on Vercel.

Missing or invalid mode configuration fails closed. A server proxy rejects demo mutations, mutation handlers independently check mode, and the database function refuses demo access. Demo reads use fixed fictional records; hidden UI controls are not the security boundary. The local PostgreSQL path remains separate.

Security fixes include compatible Next.js/Prisma patch updates and two scoped transitive overrides documented in the verification report. The latest recorded full/runtime audits reported zero advisories; rerun them before future releases. Review overrides when updating dependencies.

## Structure and limitations

- `app/`: pages and REST Route Handlers.
- `components/`: shared shell, charts, forms and export controls.
- `lib/`: deployment mode, data sources, validation, calculations and exports.
- `prisma/`: schema, migrations and optional fictional seed.
- `tests/`: calculation, security, export and scoped API regressions.

No user accounts, sessions or Admin/Viewer authorization are implemented. The public demo cannot persist edits. Lists are loaded in full rather than paginated for large datasets, reports are not immutable snapshots, and concurrent-edit conflict handling is not included. Calendar presets use the fictional dataset's 2026 periods; All time includes every record. Accessibility basics have been checked, not a full WCAG audit.

Built by [Sameer37609](https://github.com/Sameer37609). This is an independent portfolio project; fictional transactions do not represent real customer activity.
