# Phase 4A audit — 4 November 2026

> Historical report. See [the current public-demo/export verification](PUBLIC-DEMO-VERIFICATION.md) for implemented fixes and current dependency/security status.

## Decision

**Audit completed; public deployment readiness FAIL.** The working application is Phase 2 plus bounded audit fixes. Planned Phase 3 authentication, sessions, Admin/Viewer roles and downloadable CSV/JSON exports are absent. This is not an authenticated production system or an implemented read-only demo.

## Evidence and results

| Check                                    | Result          | Evidence / qualification                                                                                                                                                           |
| ---------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing project/design                  | PASS            | Audited in existing ReportFlow workspace; no rebuild of architecture or visual redesign                                                                                            |
| Transaction CRUD                         | PASS            | Scoped API create/read/PUT/delete; browser edit and refresh; duplicate ID and missing-record checks                                                                                |
| Persistence                              | PASS            | Audit fixtures read after actual production-server restart; browser refreshed saved transaction/report                                                                             |
| Both report types and preview            | PASS            | Sales Summary and Category Performance definitions; exact-date and category-filtered database results; browser previews                                                            |
| Search/filter/sorting                    | PASS            | Browser searches/type/status filters and empty states; API newest-date ordering verified with two dates; no column-sort UI exists                                                  |
| KPI/chart accuracy                       | PASS            | Exact-cent API delta reconciled with baseline; UI revenue reflects edited amount; small-value chart scale regression checked                                                       |
| Empty/invalid requests                   | PASS            | Empty report period yields zero; invalid date/money/array amount and malformed JSON rejected; duplicate 409, missing 404                                                           |
| Layout/console/hydration                 | PASS            | Production Chrome at 375/768/1440px; page overflow checks, menu Escape/focus, console/pageerror listeners                                                                          |
| CSV/JSON downloadable report exports     | FAIL            | No export utilities, controls or routes; JSON REST payloads are not exports                                                                                                        |
| CSV formula-injection protection         | NOT TESTED      | No CSV implementation to test; required when exports are implemented                                                                                                               |
| Authentication and sessions              | FAIL            | No auth provider, session cookies, sign-in route or auth guard                                                                                                                     |
| Admin/Viewer authorization               | FAIL            | No role model or server-side permissions                                                                                                                                           |
| Requests without credentials             | FAIL (security) | GET/POST/PUT/DELETE succeed without credentials; PATCH returns 405 because unsupported, not because authorized                                                                     |
| Browser Origin rejection                 | PASS (limited)  | Foreign, null and malformed Origin rejected with 403; same-host local writes work; missing Origin remains allowed for CLI clients                                                  |
| Secrets/publish-candidate checks         | PASS (bounded)  | `.env` ignored; known configured URL/password absent from publish candidates; obvious credential/private-key pattern scan found none; not a guarantee against every secret pattern |
| Prisma validation/migrations             | PASS            | Schema validates; one applied migration is up to date; authenticated reportflow_dev connection succeeds; no reset, new migration or seed run                                       |
| ESLint/TypeScript/build                  | PASS            | Clean lint/type checks and successful optimized Next.js production build after application fixes                                                                                   |
| Calculation tests                        | PASS            | All four automated tests pass                                                                                                                                                      |
| Dependency advisory audit                | FAIL            | npm audit reports 12 advisories: 4 high, 8 moderate, 0 critical; unresolved                                                                                                        |
| Full screen-reader/accessibility audit   | NOT TESTED      | Basic keyboard/focus only                                                                                                                                                          |
| Forced database outage, concurrency/load | NOT TESTED      | No disruptive database shutdown or high-volume tests performed                                                                                                                     |
| Hosted Vercel smoke/auth tests           | NOT TESTED      | Nothing deployed; production infrastructure unavailable by design                                                                                                                  |

The audit fixtures have unique identifiers and are removed by exact IDs. Cleanup compares the complete before/after transaction/report response fingerprint. Existing data remained unchanged. The local database was empty at the initial inspection; no production database was contacted.

## Fixes made

- Reject array/object/null money inputs before string coercion; reject unsupported year zero dates.
- Replace malformed-JSON exception text with a generic error, avoiding submitted-text reflection.
- Handle foreign/malformed/null Origin consistently with 403 instead of a misleading database 503. Origin rejection is not authorization.
- Remove report-title-based deletion from the older persistence test. Tests now restrict base URLs to loopback. New audit tests record IDs, verify a data fingerprint and refuse an outstanding marker.
- Bind normal dev/start scripts to loopback by default.
- Broaden ignore rules for backups, local data, private keys, logs and Vercel metadata while retaining migration SQL and placeholder `.env.example`.
- Fix stale All time/footer/empty-report labels and duplicate rounded chart-axis ticks for small revenue. Preserve component/layout styling.
- Rewrite README with actual features, setup/API/testing guidance, screenshot and honest readiness limits.

## Dependency findings

The raw advisory response is retained only in ignored `test-results/dependency-audit.json`. High findings flow through Prisma CLI/config dependencies `deepmerge-ts` and `effect`. Moderate findings flow through `minimatch` and the TypeScript ESLint tooling chain. These counts include dependency chains, not twelve independent demonstrated application exploits.

The advisory tool proposes a major Prisma upgrade and changes to the Next ESLint configuration. No forced fix, major ORM migration or untested dependency override was applied. Reassess supported patched releases, remediate the affected toolchains, then rerun generation, migrations, lint, API tests and build before public release. The Prisma CLI is currently declared in dependencies; scope it appropriately during that remediation. A successful build does not clear security advisories.

Advisories: [DeepmergeTS](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), [Effect](https://github.com/advisories/GHSA-38f7-945m-qr2g), [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249).

## GitHub readiness

Branch: `main`. No commits and no configured remote were found. Source files are currently untracked. No commit, staging, repository creation or push was performed. Suggested repository name: **reportflow-report-generation**.

Intended publishable contents: app/components/lib, Prisma schema and migration SQL, fictional seed, tests, local setup scripts, package manifest/lock, TypeScript/lint/PostCSS configuration, README and docs/images. `.env.example` contains placeholders. The screenshot was inspected and uses fictional audit fixtures; the avatar/name represents a decorative demo profile.

Ignored: environment files, node_modules, .next, caches, test-results, reports/coverage, local-data/pgdata/backups, SQL dumps, common private-key formats, logs and .vercel. SQL migration sources are explicitly exempted from the dump rule. Git ignore does not prevent forced staging, and novel filenames can still contain sensitive data. Inspect every staged file before publishing. Repository structure is suitable for review; publication should describe the project as local-only until blockers are addressed.

## Vercel readiness and choices

Next.js Node Route Handlers and Prisma/PostgreSQL are a supported general architecture, but this configuration is deliberately local-only. Localhost inside a hosted Vercel function is not the developer's PostgreSQL server. `lib/db.ts` also explicitly rejects remote databases. No custom Next/Vercel deployment configuration or auth settings exist.

Recommended simplest portfolio route: build a read-only demo from explicitly fictional static data, with writable API handlers actually disabled/omitted. That would avoid hosted database credentials, writes, login overhead and mutation abuse. This mode is **not implemented**; neither hiding buttons nor changing a README makes the current endpoints read-only.

Alternative: Vercel + managed PostgreSQL with TLS and provider-recommended pooling, least-privilege runtime credentials, protected server-side APIs, secure sessions, verified Admin/Viewer permissions, rate/resource controls and separate preview/production secrets. Plan provider-required pooled runtime/direct migration connections. Use a reviewed `prisma migrate deploy` release step; do not run `migrate dev` or fictional seeds against production. Choose and implement an auth system before inventing session-secret variable names. Do not expose database URLs through NEXT_PUBLIC variables.

The read-only route is simpler and lower risk but does not demonstrate protected multiuser writes. The authenticated route demonstrates more backend skills but requires additional security testing and operational ownership. Hosting cost/free-tier suitability was not quoted or verified; no service was purchased.

References: [Vercel databases](https://vercel.com/docs/postgres), [Vercel pooling](https://vercel.com/kb/guide/connection-pooling-with-functions), [Prisma v6 connections](https://www.prisma.io/docs/orm/v6/prisma-client/setup-and-configuration/databases-connections).

## Next actions — approval needed for further implementation

1. Review the missing Phase 3 features and choose a read-only public portfolio demo or a fully authenticated application. No further feature phase was started during this audit.
2. Resolve dependency advisories with verified compatible upgrades.
3. If choosing authenticated writes, implement and test sessions, Admin/Viewer server permissions, exports and CSV formula protection before changing deployment configuration.
4. Review source/staged filenames and the screenshot; make the first local commit only when requested. No GitHub action has occurred.
5. Only after explicit approval, configure the chosen hosting/database/auth environments, review migrations and run hosted smoke/security tests. This audit does not authorize deployment.
