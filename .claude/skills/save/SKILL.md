---
name: save
description: Save a checkpoint of bigsmall before a compaction or a fresh session: write Sean's pending notes and the plan for each into the findings log, bring CLAUDE.md's "Pick up here" up to date, ship, and stop. Use when Sean says "do a save", "save", "checkpoint", "compact first", or that he is starting a new session.
argument-hint: '[empty]'
---

# Save

A save leaves nothing only in the conversation: the next session, or the one after a compaction, starts from the repo alone.

## 1. Write down what is pending

- Every note of Sean's not yet built goes into `docs/research/findings-0-first-pass.md` as a new pass at the bottom: `## <Ordinal> pass: <what it covers> (saved before a compaction)`, a line saying what it follows on and what is live (the last commit), then a table, `| Observation | Plan |`, one row per note, the plan concrete enough to build cold (files, the rule, the docs to update, the tests). Questions for Sean are rows too, with the recommendation first.
- When a saved pass is later built, its heading says so ("built the same day", "built in the forty-third") and its rows' outcomes are recorded under it.

## 2. Pick up here

Bring `CLAUDE.md`'s "Pick up here" list up to date, kept short:

- Trials awaiting Sean's verdict, each with the commit that reverts it.
- Questions open with Sean, the recommendation first.
- The next build, pointing at the saved pass.
- Anything left mid-way, said plainly (a failing test, a half-done change), never hidden.

## 3. Ship and stop

- Use the ship skill: gate on `pnpm check`, commit (`docs: …`), push, watch CI.
- Report in a few lines: what is saved where, what is live, and what the next session starts with. Then stop: no new work after a save unless Sean asks.
