# Deployment procedure (not executed)
1. Run `npm ci`, `npm run check`, `npm run test:e2e`, `npm run test:integration`, and configured `npm run test:auth`. Obtain independent Testing review.
2. Verify CAPTCHA server settings and both anonymous browser sessions in a disposable Supabase test project. Run all migrations in filename order there first. Never rerun 001 against the migrated live database.
3. After approval, back up the live database and apply the additive projects and whitespace-validation migrations in filename order once. Old deployment remains compatible with its one-argument create-task RPC.
4. Build an isolated candidate image (all variables below are public browser configuration):

```sh
docker build -t agent-office:candidate \
 --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
 --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
 --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY="$NEXT_PUBLIC_TURNSTILE_SITE_KEY" .
docker run --rm --name agent-office-candidate -p 127.0.0.1:3101:3000 agent-office:candidate
```

Public values are compiled at build time; setting them only at container runtime does not work. Test candidate separately without changing any live container, proxy, DNS, other Vega service or existing volume. Verify project/task workflows and fresh CAPTCHA.
5. Obtain authorization for the concrete validated image, database migration and service replacement. Use the operator's existing deployment mechanism; retain current image for rollback. No proxy/service-specific commands are assumed here.
6. Open https://agentoffice.vegaialabs.com in a fresh signed-out browser context after replacement. Verify it requires no hosting login; verify mobile, CAPTCHA, persistence and session isolation. Record actual results.
7. Publish GitHub only after approval; inspect `git status`, `git diff --check` and tracked files for credentials first. Never upload `.env`, raw auth payloads, tokens, private submission URLs or unsanitized browser traces.

## Local v0.6 staging
The candidate-only helper `scripts/switch-candidate.sh IMAGE` targets the existing loopback candidate at 18132. It keeps the old container stopped and automatically restores it if startup or HTTP route checks fail. It does not modify production, DNS, Nginx or Supabase. Build and test the exact image first. This is not a production release authorization.

## Password-mode candidate (alternative, not yet accepted)
Create and confirm a demo user through the Supabase Authentication dashboard in the dedicated test project. Build with `NEXT_PUBLIC_AUTH_MODE=password`, `NEXT_PUBLIC_DEMO_EMAIL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The password is never a build argument. Verify signed-out login, wrong-password rejection, data creation and reload, sign-out, and two distinct accounts for cross-user isolation. The single shared evaluator account is not a separate tenant per visitor. Do not publish production until the selected mode is accepted. Historical Turnstile checks apply to the original anonymous mode, not as proof of password authentication.
