---
name: ship
description: Ship a change to bigsmall: gate on `pnpm check`, commit in Conventional Commits form with the attribution line, and push to main, which deploys to bigsmall.work on its own. Use whenever work is ready to land (a feature, a fix, a tidy commit, a save), or when Sean says ship, push, or deploy. Tidy and save end with it.
argument-hint: '[the commit subject, or empty to write one from the diff]'
---

# Ship

Every push to `main` deploys to `https://bigsmall.work` when Vercel's own build finishes (CLAUDE.md, "Ship"; docs/DEPLOYMENT.md). GitHub Actions does not start on a push and does not hold the deploy. No pull requests: work lands on `main`.

## 1. Gate

- In Bash, first: `export PATH="/c/Users/seanr/AppData/Roaming/npm:/c/Program Files/nodejs:/c/Program Files/GitHub CLI:$PATH"`.
- `pnpm format`, then `pnpm check` (lint with the token guard, format check, types, unit tests, build, bundle budget, the SEO contract).
- **Commit only on its exit status, in one foreground command:** `pnpm check && git add -A && git commit …`. Never chain the commit after the check with `;`, which commits even when the check fails (a commit once shipped with a failing format check that way, 2026-10-15), and in a chain of several stages join every command with `&&`, `pnpm format` included: a `;` before a later stage's format let that stage run after the stage before it failed, commit the failed stage's files under its own message, and push them (2026-10-18; docs/LEARNINGS.md), and never read a background run's notification as the gate's result: it carries the last command's exit code, an `echo`'s, and a commit once landed on a red gate that way (2026-10-16; docs/LEARNINGS.md, "A gate run in the background reports its last command's exit code").
- A change to behavior or look also runs the browser suite first. With Sean's dev server holding the project's dev slot, run it against a build on `astro preview`, as docs/TESTING.md, "End to end", says, never stopping his server; if a preview of your own already holds 4322, stop it first, or the config's own fails to start. Each browser-test step a chain runs gates the next with an explicit exit check (`&&`, or `|| exit 1`), never `;`. Name the project with its value joined, `--project=desktop-chromium e2e/x.spec.ts`, whenever spec files follow it: `--project desktop-chromium e2e/x.spec.ts` swallows the files and runs everything (docs/LEARNINGS.md, 2026-10-18).

## 2. Commit

- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`, `a11y:`, `style:` for a visual trial; a scope where it helps (`feat(core):`, `docs(tidy):`). Small and focused: one kind of change a commit.
- A visual trial ("try and see") is a commit of its own, so rolling it back is one revert; say "(trial)" in its subject.
- The message ends with the attribution line the session's reminder gives, copied as given. Pass it through a quoted heredoc (`git commit -F - <<'EOF'`), never `-m` with quotes inside quotes.

## 3. Push

- `git push origin HEAD:main`. Vercel builds and promotes it. Do not start or watch GitHub Actions; a push does not run it.
- A new browser test is run locally on a dev server before it ships, not only against the build: CI's old run used the dev server, where Astro's dev toolbar adds elements a loose locator also finds (docs/LEARNINGS.md, "A test that passes on the build can fail on CI's dev server").
- Never force-push `main`.

## 4. Report

One line each: what shipped (the commits' subjects or a summary), and that the push is on `main` for Vercel to build.
