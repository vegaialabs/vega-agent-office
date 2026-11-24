# Acceptance checklist — candidate, 2026-11-24
- [x] Unit tests, typecheck and production build executed by Develop and independent Testing (round 1).
- [x] Local browser create task; assign; submit; reject with evidence; resubmit; approve; inspect history, desktop and mobile.
- [x] Local demo project creation, switching, project-scoped tasks and reload persistence implemented and tested.
- [x] PostgreSQL integration: RLS ownership, direct writes denied, foreign RPC and stale revision rejected; simulated JWT subjects, not real Auth sessions.
- [ ] Whitespace-only SQL input/evidence regression independently revalidated after round-1 finding (candidate correction ready).
- [ ] Real Supabase anonymous sessions: reload persistence and cross-session isolation (BLOCKED: dedicated test configuration absent).
- [ ] CAPTCHA backend enforcement and real successful human challenge (BLOCKED: test configuration/provider credentials). Mocked lifecycle suite covers frontend only.
- [x] Keyboard entry, mobile overflow and automated axe checks ran on local demo; broader assistive-technology audit not claimed.
- [x] Real agents `/root/develop` and `/root/testing` executed, findings recorded; corrections require subsequent Testing review.
- [x] Existing Docker/VPS URL https://agentoffice.vegaialabs.com opened signed-out by Testing; HTTP 200, no hosting login, no pageerrors.
- [ ] Public candidate deployment and real signed-out/Auth acceptance (active public service unchanged).
- [x] Local v0.6 candidate deployed on loopback and initial evidence route verified.
- [x] GitHub publication and remote CI green for b45f720 (run 45403236326).
- [x] v0.6 local /demo and /evidence routes: desktop/mobile browser suite 4/4, mocked CAPTCHA suite 5/5, unit 7/7, typecheck/build PASS (assistant-operated; independent review pending).
- [x] Later v0.6 assistant-operated browser suite 10/10 (including office, handbook, English guide and report download); independent final review still pending.

## 2026-11-24 — manual password-demo acceptance in testing
Owner browser validation: sign-in, project/task creation, correction and approval, sign-out and new sign-in with restored data. Read-only SQL confirmed done, revision 5, cycles 1 and five events. CI passed for b45f720 (run 45403236326). This is owner-operated testing and assistant SQL verification, not independent Codex sign-off. Real two-account isolation and production acceptance remain pending.
