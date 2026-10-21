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
- **Commit only on its exit status, in one foreground command:** `pnpm check && git add -A && git commit …` (CLAUDE.md, "Working habits"). In a chain every command joins with `&&`, `pnpm format` included, `|| exit 1` after a subshell that must gate what follows, and a `;` only before an echo of an exit code; never read a background run's notification as the gate's result (docs/LEARNINGS.md: "A gate run in the background reports its last command's exit code", "A chain's `;` between stages runs the next stage after a failed gate").
- A change to behavior or look also runs the browser suite first. With Sean's dev server holding the project's dev slot, run it against a build: `pnpm build && pnpm e2e:preview` (`apps/web/playwright.preview.config.ts`, the base config with only its server changed; docs/TESTING.md, "End to end"), never stopping his server; a preview of your own already on 4322 is reused, so a stale one is stopped first. Each browser-test step a chain runs gates the next with an explicit exit check (`&&`, or `|| exit 1`), never `;`. Name the project with its value joined, `--project=desktop-chromium e2e/x.spec.ts`, whenever spec files follow it: `--project desktop-chromium e2e/x.spec.ts` swallows the files and runs everything (docs/LEARNINGS.md, 2026-10-18).
- A preview of your own left on 4322 serves a stale build and is reused: stop it in the chain before the suite, `for pid in $(netstat -ano | grep -E ":4322 " | grep LISTENING | awk '{print $NF}' | sort -u); do taskkill //PID "$pid" //F; done` (Git Bash; the tidy of 2026-10-21).

## 2. Commit

- Conventional Commits as CLAUDE.md's "Commits" says: the types, a scope where it helps (`feat(core):`, `docs(tidy):`), small and focused, one kind of change a commit, and a visual trial a commit of its own with "(trial)" in its subject.
- The message ends with the attribution line the session's reminder gives, copied as given. Pass it through a quoted heredoc (`git commit -F - <<'EOF'`), never `-m` with quotes inside quotes.

## 3. Push

- `git push origin HEAD:main`. Vercel builds and promotes it. Do not start or watch GitHub Actions; a push does not run it.
- A new browser test is run on a dev server too, not only against the build: `pnpm e2e` and the workflow's e2e job start one, and a page served by it can differ from the build's in what a loose locator finds (docs/LEARNINGS.md, "A test that passes on the build can fail on CI's dev server").
- Never force-push `main`.

## 4. Report

One line each: what shipped (the commits' subjects or a summary), and that the push is on `main` for Vercel to build.
