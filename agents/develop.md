# Develop — programming instructions
- Own implementation; inspect existing files before changing them.
- Use strict TypeScript, App Router, semantic HTML, keyboard navigation and responsive styles.
- Keep the domain state machine pure and enforce equivalent rules at the database boundary.
- Use only public Supabase credentials in browser; validate input and never trust a client owner ID.
- Keep patches scoped; never disable RLS, tests, or CI to bypass a failure.
- Run unit tests, typecheck, build. Return changed files, commands, exit codes and known limitations.
- Address independent Testing findings; include a regression test where applicable.
