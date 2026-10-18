---
name: ship
description: Ship a change to bigsmall: gate on `pnpm check`, commit in Conventional Commits form with the attribution line, push to main, and watch CI until it passes, which deploys to bigsmall.work. Use whenever work is ready to land (a feature, a fix, a tidy commit, a save), or when Sean says ship, push, or deploy. Tidy and save end with it.
argument-hint: '[the commit subject, or empty to write one from the diff]'
---

# Ship

Every push to `main` that passes CI deploys to `https://bigsmall.work` (CLAUDE.md, "Ship"; docs/DEPLOYMENT.md). No pull requests: work lands on `main`.

## 1. Gate

- In Bash, first: `export PATH="/c/Users/seanr/AppData/Roaming/npm:/c/Program Files/nodejs:/c/Program Files/GitHub CLI:$PATH"`.
- `pnpm format`, then `pnpm check` (lint with the token guard, format check, types, unit tests, build, bundle budget, the SEO contract).
- **Commit only on its exit status, in one foreground command:** `pnpm check && git add -A && git commit …`. Never chain the commit after the check with `;`, which commits even when the check fails (a commit once shipped with a failing format check that way, 2026-10-15), and never read a background run's notification as the gate's result: it carries the last command's exit code, an `echo`'s, and a commit once landed on a red gate that way (2026-10-16; docs/LEARNINGS.md, "A gate run in the background reports its last command's exit code").
- A change to behavior or look also runs the browser suite first. With Sean's dev server holding the project's dev slot, run it against a build on `astro preview`, as docs/TESTING.md, "End to end", says, never stopping his server; if a preview of your own already holds 4322, stop it first, or the config's own fails to start. Each browser-test step a chain runs gates the next with an explicit exit check (`&&`, or `|| exit 1`), never `;`. Name the project with its value joined, `--project=desktop-chromium e2e/x.spec.ts`, whenever spec files follow it: `--project desktop-chromium e2e/x.spec.ts` swallows the files and runs everything (docs/LEARNINGS.md, 2026-10-18).

## 2. Commit

- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`, `a11y:`, `style:` for a visual trial; a scope where it helps (`feat(core):`, `docs(tidy):`). Small and focused: one kind of change a commit.
- A visual trial ("try and see") is a commit of its own, so rolling it back is one revert; say "(trial)" in its subject.
- The message ends with the attribution line the session's reminder gives, copied as given. Pass it through a quoted heredoc (`git commit -F - <<'EOF'`), never `-m` with quotes inside quotes.

## 3. Push and watch

- `git push origin HEAD:main`.
- Find the run by the full SHA, not the short one: `gh run list --limit 5 --json databaseId,headSha -q '.[] | select(.headSha=="'"$(git rev-parse HEAD)"'") | .databaseId'`, retrying for a few seconds until it appears.
- `gh run watch <id> --exit-status`, then `gh run view <id> --json conclusion -q .conclusion`.
- CI runs the browser suite on the dev server, where Astro's dev toolbar adds elements a loose locator also finds: a new browser test runs on a dev server too before it ships, not only on the build.
- Say CI passed only from the conclusion. A watch run in the background reports the exit status of its last command, so read the conclusion it printed (docs/LEARNINGS.md, "A test that passes on the build can fail on CI's dev server").
- A failure: read the failed step (`gh run view <id> --log-failed`), fix, and ship again. Never force-push `main`.

## 4. Report

One line each: what shipped (the commits' subjects or a summary), CI's result, and that it is live. A run cancelled because a newer push superseded it is not a failure; say so.
