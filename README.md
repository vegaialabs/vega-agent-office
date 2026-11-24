# Agent Office
Standalone Next.js / TypeScript assessment. Manage projects and project-scoped tasks through assignment, development, testing, correction and approval. UI actions are manual workflow simulations: they do not run AI or execute tests. Actual implementation/review agents are recorded in `docs/execution-log.md`.

## Evaluator routes
- `/demo`: interactive local mode, without sign-in even when remote configuration is present.
- `/evidence`: historical Codex evidence and separately labelled later assistant-run checks.
- `/documentation`: evaluation walkthrough, role summaries and reproducible commands.

- `/en`: English evaluator guide (workspace UI remains Spanish).
- `/quality-report.md`: downloadable quality and acceptance snapshot.

## Local development
Node 22+, `npm ci`, then `npm run dev`. With no Supabase configuration, the clearly labelled local demo persists in browser storage. This mode is not the database acceptance test. Project selection survives reload. Projects support creation and switching (up to 20 server-side); tasks support creation (100 per account) and audited state transitions. Deleting or renaming projects is outside this version.

## Supabase and CAPTCHA
Use a dedicated test project first. Apply `supabase/migrations/001_workspace.sql` then `20261124101832_projects.sql` and `20261124104400_whitespace_validation.sql` on fresh databases. On the already migrated existing database, apply the second and third migrations in filename order after approval. It backfills each user's tasks into an initial project and preserves the old create-task RPC for the existing deployment. RLS allows only owner reads; direct writes are revoked. Private security-definer functions explicitly validate `auth.uid()`, owner, revision, input and limits. Public wrappers use security-invoker.

Enable anonymous sign-in and Cloudflare Turnstile CAPTCHA in Supabase Auth settings. Register the deployed hostname in Turnstile, put its **secret only in Supabase Auth configuration**, and its public sitekey in `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from `.env.example`. Never use a service-role key. CAPTCHA token is passed to `signInAnonymously`, cleared after each attempt and expiry/error, and required before enabling sign-in. Backend CAPTCHA enforcement is required: the widget alone cannot stop direct Auth API calls. No production CAPTCHA settings were changed in this task.

Sources: [Supabase CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha), [anonymous auth](https://supabase.com/docs/guides/auth/auth-anonymous), [changelog](https://supabase.com/changelog.md).

## Validation
- `npm run check`: domain unit tests, strict TypeScript, production build.
- `npx playwright install chromium`; `npm run test:e2e`: desktop/mobile flow, evidence, project isolation/persistence, keyboard entry, overflow and axe accessibility.
- `npm run test:captcha`: mocked frontend CAPTCHA success, missing sitekey, expiry/error, consumed tokens/retry and script failure. No external Auth validation is claimed.
- `npm run test:integration`: Docker required; starts an isolated PostgreSQL 18 container with no network/ports/host volumes, applies migrations and checks SQL/RLS. Auth identities are simulated JWT settings; this does **not** validate Supabase Auth itself. Container is stopped afterward.
- `npm run test:auth`: actual anonymous Auth and REST checks, only with dedicated `TEST_SUPABASE_URL`, `TEST_SUPABASE_PUBLISHABLE_KEY`, `TEST_SUPABASE_CONFIRMED_ISOLATED=yes`; optional fresh `TEST_CAPTCHA_TOKEN_1` and `_2`. Exits 2/BLOCKED if missing. Use disposable test project; it retains test users/records. Never configure production here.

## Current assessment status
The original Codex session delegated to separate Develop and Testing agents and recorded an actual review finding and correction. Later v0.6 UI and documentation extensions were assistant-operated. Final independent acceptance is BLOCKED pending real Supabase Auth, real CAPTCHA and final candidate review. See the dated quality report and execution log. The public URL is the earlier deployed version until release acceptance.

## GitHub and release
Lockfile and CI included; `.env*`, dependencies/builds/test artifacts ignored. Review `git diff` and tracked files before publishing. There are no private Vega packages. Publishing and production replacement require approval. See `docs/deployment.md` for staged Docker commands and `docs/execution-log.md` for actual evidence and remaining blockers.
