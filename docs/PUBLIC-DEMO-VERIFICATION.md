# Public demo and export verification — 5 November 2026

## Outcome

Implemented: explicit read-only public demo, preserved local PostgreSQL CRUD, real CSV/JSON report exports and dependency remediation. **Prepared for review and future read-only-demo hosting; nothing was committed, pushed or deployed.** Authentication and Admin/Viewer roles remain absent by design, not claimed as features.

The previous [Phase 4A audit](PHASE-4A-AUDIT.md) is historical. Its missing-export and dependency findings have been addressed here. Its warning against publishing writable local mode still applies.

## Actual results

| Check                                      | Result     | Evidence                                                                                                                                                                           |
| ------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clean lockfile installation                | PASS       | `npm ci`, including Prisma postinstall generation, completed with DATABASE_URL empty                                                                                               |
| Dependency audits                          | PASS       | Full tree and `--omit=dev`: 0 info, low, moderate, high or critical advisories after updates                                                                                       |
| Lint and TypeScript                        | PASS       | Clean ESLint and noEmit checks                                                                                                                                                     |
| Automated unit tests                       | PASS       | 10 tests: calculations, exact export money, CSV injection/escaping, empty exports, safe filenames, mode guard and targeted dependency API compatibility                            |
| Fail-closed configuration                  | PASS       | Missing/invalid mode and Vercel+local builds rejected before application build                                                                                                     |
| Demo build without DB credentials          | PASS       | Production build with explicit demo mode, DATABASE_URL empty and VERCEL=1                                                                                                          |
| Local production build                     | PASS       | Separate production build with existing private local configuration                                                                                                                |
| Demo data and DB isolation                 | PASS       | Demo APIs serve fixed 48-row fictional data and $55,277.00 revenue without DATABASE_URL; DB function rejects demo mode; source dynamically imports the database only in local mode |
| Demo write enforcement                     | PASS       | POST/PUT/PATCH/DELETE across eight API paths, including exports/preview/analytics: 32/32 denied with 403                                                                           |
| Local transaction CRUD                     | PASS       | Scoped API create/read/update/delete, duplicate-ID, bad-date, bad-money and missing-record regressions                                                                             |
| Local reports and exact analytics          | PASS       | Both report types, inclusive date/category filters, empty periods and exact-cent analytics delta                                                                                   |
| Local persistence and data safety          | PASS       | Fixtures survived actual server restart; exact-ID cleanup; before/after existing-data fingerprint unchanged                                                                        |
| Local browser regression                   | PASS       | Editing/refresh, saved report creation and refresh, previews, filters, KPIs and keyboard menu                                                                                      |
| Local CSV/JSON contents                    | PASS       | Both report types plus empty report match detail metrics; an actual formula-like database customer value is neutralized in CSV                                                     |
| Demo CSV/JSON downloads                    | PASS       | Browser download events, actual saved file contents, MIME/disposition/filenames, both report types, custom/empty filters and preview/export agreement                              |
| Invalid exports                            | PASS       | Unsupported format, invalid dates, duplicate query keys, saved-filter overrides and missing report IDs handled with 400/404                                                        |
| Responsive/browser checks                  | PASS       | Chrome at 375, 768 and 1440px; dashboard, report detail and explorer; no page overflow, console or hydration errors                                                                |
| Accessibility basics                       | PASS       | Named native inputs, download buttons and group, status/error feedback, visible focus, mobile Escape/focus handling and keyboard controls                                          |
| Full WCAG/screen-reader audit              | NOT TESTED | No claim of full accessibility compliance                                                                                                                                          |
| Hosted deployment/provider behavior        | NOT TESTED | No GitHub repository or host was created; no hosted smoke test                                                                                                                     |
| Spreadsheet application compatibility      | NOT TESTED | CSV bytes/escaping/downloads were checked, but Excel/LibreOffice were not manually opened                                                                                          |
| High-volume/concurrent-writer/load testing | NOT TESTED | Lists intentionally load in full for this portfolio scale                                                                                                                          |
| Optional seed execution                    | NOT TESTED | No automatic seed/reset; seed now also requires explicit local mode                                                                                                                |

The local database had zero transactions and saved reports before the scoped regressions and was returned to that same state. Test markers, private environment files and download artifacts are ignored by Git. The published screenshot is a genuine public-demo capture with fictional records only.

## Changes and design

`REPORTFLOW_MODE` must be `demo` or `local`; no fallback is accepted. Configuration and server proxy both validate mode. Vercel cannot select local mode. The proxy rejects demo writes before body validation or data access. The database function independently rejects demo mode, and the read source returns fictional records without initializing a database client. CLI seed/check scripts also refuse demo mode.

The layout is dynamic so mode is resolved at request time, not cached as local/demo UI from a different build. The default local commands bind to loopback; no local authorization was introduced. Custom public report exploration uses validated GET requests and never saves definitions.

Exports use shared source records and Decimal summaries. A saved report exports exactly its saved filters; unsaved previews use validated title/type/start/end/category query parameters. CSV contains metadata, KPI summary, filtered transactions and category totals for Category Performance. JSON contains report/filter metadata, currency, exact decimal strings, summary, categories and transaction details. Valid empty reports retain headers and zero totals. Responses are attachments with safe filenames, correct content types, no-store and nosniff headers.

CSV text cells are always quoted and escaped. Formula prefixes after whitespace and leading control characters are prefixed with an apostrophe; JSON preserves original text. Formula protection is tested against =, +, -, @, tab, CR/LF, BOM and whitespace prefixes, plus embedded commas, quotes and multiline values. It is a spreadsheet safety measure, not encryption or input authorization.

The visual system is preserved. Added compact CSV/JSON buttons, clear read-only labeling, unsaved report exploration and inline download errors/loading. Mutation controls are absent in demo UI; server enforcement remains authoritative if a visitor bypasses the interface.

## Dependency remediation

- Next.js, official WASM compiler and Next lint configuration: 16.4.4 → 16.4.5.
- Prisma/client: 6.19.0 → 6.19.3. This patches the Effect dependency; Prisma CLI moved to devDependencies.
- Scoped override `@prisma/config → deepmerge-ts 8.0.0`: the consumer uses the supported deepmerge export for trusted configuration objects. Merge API regression, Prisma generation, validation and migration-status checks pass.
- Scoped override `@typescript-eslint/typescript-estree → minimatch 11.0.1`: the consumer uses the supported minimatch function with dot:true. Node requirements and call sites were reviewed; match regression and the complete lint run pass.

The two overrides cross transitive major versions deliberately after compatibility review; no `audit fix --force`, major Prisma migration or root-framework major upgrade was used. They should be reviewed and removed when upstream dependencies accept the patched versions. The clean npm install and complete regressions verify this repository's use; they do not prove every possible upstream use case.

Initial audit: 4 high and 8 moderate advisories (12 affected package entries). Final full/runtime audits: **0 advisories**. No known unresolved exploitable production advisory was reported by npm at verification time. Advisory databases change, so re-audit before publication/deployment.

## Readiness and remaining limits

GitHub: source, migrations, tests, fictional data, README and screenshot are prepared for a staged-file review. No commits, remote, repository, push or deployment were created. Review `.env.example` and ensure only placeholders are present; never force-add private files. Suggested name remains `reportflow-report-generation`.

Hosting: the read-only demo is the approved architecture. Configure REPORTFLOW_MODE=demo for build and runtime and leave DATABASE_URL unset. A Next.js Node runtime can serve it without a production PostgreSQL database, auth secrets or paid services. Do not remove mode/DB guards or publish local mode. Hosted verification is still required after explicit deployment approval.

Local mode remains a development application with writable unauthenticated APIs, loopback-only start commands and a local reportflow_dev database guard. A future authenticated writable system requires a separate approved authentication/authorization phase. Report data reflects current records, not immutable snapshots. No public mutation persistence, session, role model or production database was added.

## Reproduce

See README for setup. Unit checks: `npm test`; config checks: `npm run test:config`; audits: `npm audit` and `npm audit --omit=dev`.

Demo: `npm run demo:build`, then serve with `node scripts/demo.mjs start --hostname 127.0.0.1 --port 3004`; run `node tests/demo-api.mjs`.

Local regressions: serve local mode on 3005; set TEST_BASE_URL=http://127.0.0.1:3005; run tests/audit-api.mjs and tests/local-exports.mjs, actually restart the server, then run tests/audit-cleanup.mjs. Cleanup checks persistence and removes only recorded fixture IDs. Do not run concurrently with manual data edits.
