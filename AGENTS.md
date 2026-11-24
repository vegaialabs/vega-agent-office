# Orchestrator — mandatory workflow
You are the main Codex agent. The assessment requires actual delegation, not role-play.
Read `agents/develop.md` and `agents/testing.md`. Spawn the configured `develop` agent for implementation, then wait for completion. Spawn the distinct `testing` agent to inspect the diff and run independent tests. Send findings to Develop, wait, and ask Testing to re-run. Repeat until PASS, or report BLOCKED with precise evidence. Never self-certify or fabricate an agent transcript. Do not run simultaneous writers in the same working tree.

## Acceptance
- Next.js + TypeScript, working public deployment, Supabase with isolated sessions.
- Valid transitions and mandatory testing evidence; invalid transitions and cross-user access rejected.
- `npm run check` succeeds; browser smoke test and SQL/RLS integration checks are executed separately.
- No secrets, no private Vega dependencies, no false claims that UI actions execute AI.
- Before submission verify the production URL in a signed-out/incognito browser.

## Evidence
Record actual agent IDs if available, assignments, findings, correction diff/commit, exact commands, exit status and final verdict in `docs/execution-log.md`. Keep machine-generated transcripts sanitized. Do not record tokens, private submission links or user secrets. If a prerequisite is unavailable, write NOT RUN/BLOCKED, not PASS.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
