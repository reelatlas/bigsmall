---
name: save
description: Save a checkpoint of bigsmall before a compaction or a fresh session: write Sean's pending notes and the plan for each into the findings log, bring CLAUDE.md's "Pick up here" up to date, ship, and stop. Use when Sean says "do a save", "save", "checkpoint", "compact first", or that he is starting a new session, or when the context gauge says the room is short (CLAUDE.md, Working habits, "Gauge the context at every close").
argument-hint: '[empty]'
---

# Save

A save leaves nothing only in the conversation: the next session, or the one after a compaction, starts from the repo alone. The context gauge is its usual trigger (CLAUDE.md, Working habits): a save, then Sean compacts and says when it is done, and the work resumes from the repo; a fresh session only on an account switch or at his ask.

## 1. Write down what is pending

- Every note of Sean's not yet built goes into `docs/research/findings-0-first-pass.md` as a new pass at the bottom: `## <Ordinal> pass: <what it covers> (<date>; saved before a compaction)`, its ordinal continuing the last heading's (read the last `## … pass` heading first, so no number is skipped), a line saying what it follows on and what is live (the last commit), then a table, `| Observation | Plan |`, one row per note, the plan concrete enough to build cold (files, the rule, the docs to update, the tests). Questions for Sean are rows too, with the recommendation first. The new pass gets its clause in the "Passes." index paragraph at the top of the log, in the same style, one clause per pass.
- When a saved pass is later built, its heading says so ("built the same day", "built in the forty-third") and its rows' outcomes are recorded under it.

## 2. Pick up here

Bring `CLAUDE.md`'s "Current status" (its date, and what the stretch changed) and its "Pick up here" list up to date, kept short:

- Trials awaiting Sean's verdict, each with the commit that reverts it.
- Questions open with Sean, the recommendation first.
- The next build, pointing at the saved pass.
- Anything left mid-way, said plainly (a failing test, a half-done change), never hidden.

## 3. Ship and stop

- Use the ship skill: gate on `pnpm check`, commit (`docs: …`), and push; Vercel deploys it on its own.
- Report in a few lines: what is saved where, what is live, and what the next session starts with. Then stop: no new work after a save unless Sean asks.
