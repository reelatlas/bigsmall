---
name: orchestrate
description: Runs a task as waves of agents for bigsmall: an orchestrator's brief, parallel workers with one question or one part each, checkers kept apart from gatherers, handoffs as files, a budget and a stop at every wave, the record and the cost written. Use when a task has several independent parts of one shape (a research pass over candidates, a bounded build with independent pieces), or when Sean says orchestrate, delegate, fan out, or run agents; not for a handful of calls, a lookup with a known target, or a design judgment, which is Sean's with a mock. v1, completed from the demand map's run (2026-10-19) and amended by each run that teaches it.
argument-hint: '[the task, or the research doc that holds its briefs]'
---

# Orchestrate

The shape docs/RESEARCH.md §4 proved on Cooking's figures, generalized (docs/PLAN.md §2, "A planner and agents that build"): one session decides, agents gather or build, nothing is believed until checked, and every wave is sized before it runs and stops at its end. A first run is docs/research/demand-map-1.md; its §3 and §4 are the worked example of the waves and the briefs.

## 1. When, and when not

- **Fan out** when the task has several independent parts of one shape: candidates to research by the same method, claims to verify one by one, pieces to build that do not touch the same files. Each part gets one agent and a narrow brief.
- **Do it here** when it is a handful of tool calls, a lookup whose target is known, or a check that could be run inline. An agent costs the brief, the summary, and what both drop.
- **Not an agent's call**: a look or a behavior. A design question is an artifact mock judged by Sean (CLAUDE.md, "Add a page"; the labs' rule), never an agent's recommendation alone; a token or a visible change goes to him in chat (the `tidy` skill, step 4).

## 2. Roles

- **The orchestrator** is this session: it reads the docs, writes the briefs, sizes the waves, never gathers itself for a question it has delegated (it stays blind, as the research skill's orchestrator does), copies the keepers, decides by the rule or by principle, and writes the record.
- **Workers** gather or build, one question or one part each, told nothing of each other's work or of our figures (the brief names the things, never a number). Model and effort as Sean sets for the run (2026-10-19: Opus 5.5, high for gathering).
- **Checkers** read the cited sources themselves, given `claims.csv` and never the workers' notes, and report row by row: confirmed, corrected, could not reach, wrong (Opus 5.5 at max, where rigor pays), each row carrying the orchestrator's `check` note saying what to confirm (a date, a second sentence on the page, a probe to re-run, a recomputation with the checker's own script from the re-downloaded source; a figure in a scan or a chart read from the image by measurement), which made the demand map's two checkers four to six times cheaper per row than Cooking's one (2026-10-19). A checker is a fresh agent, never the worker continued; the orchestrator reads a corrected row's source itself, from the checker's saved copy when it kept one.
- **A measurer**, later: an agent that reads the numbers a launch produced (Search Console's export, Umami) against the plan's expectations.

## 3. Waves, budgets, and stops

1. **Wave 0, the plan**: the pass's doc with the questions, the method, the briefs, the budget table (docs/research/demand-map-1.md §3 is the shape); shipped before any agent runs, so a fresh session on any account can pick up.
2. **Wave 1, gather**: workers in parallel, each with a tool-call budget (150 for a research question; stop gathering at 120 and write) and told to write its report as it goes, so a stop leaves a file.
3. **Wave 2, verify**: checkers over the claims; a claim with no reachable source is "could not reach", never guessed.
4. **Wave 3, decide**: the orchestrator synthesizes, the decisions numbered for Sean (where to see it, what changes, one recommendation), the record written, the cost logged, this skill amended with what the run taught.

**Pieces, and the context gauge.** The work runs in pieces that can each be closed cleanly, a wave or a portion of one, and at every piece's end the orchestrator weighs where the context stands and says so: continue, compact, or start a fresh session. A wave does not fill a context every time; a session can hold several waves, and one wave can need several compactions (Sean, 2026-10-19: after wave 1 and the day's work, the orchestrator's context stood at half). The gauge is `/context` in Claude Code, which Sean runs at a boundary when asked: it shows the window (1.0 million tokens on Fable 5.1, 2026-10-19) and what fills it, the messages being what grows. Wave 2 (the selection, two checkers' reports returned as text and saved, the close) took about 230 thousand of them, a quarter of the window, a checker's report landing twice, once as its reply and once as the orchestrator's save of it. The orchestrator gives its estimate at every piece's end and asks for the figure; its first estimate (wave 2's close) was high by a factor of two, having assumed a smaller window, so the figure corrects the estimate each time. Before a compaction or a new session, a save (the `save` skill), so either resumes from the repo alone: the compaction's summary, "Pick up here", and the pass's doc; a piece is never left half-done across one. Compacting is the default for now, a fresh session when Sean chooses, and the method is the same for both.

Estimates come from precedent and are written before the wave: Cooking's checker took about 0.7 million tokens over 255 tool calls, a worker less (docs/RESEARCH.md §4); five research workers at 150 calls are 1.5 to 2.5 million; two checkers over 81 selected rows with `check` notes took 0.54 million over 100 calls (2026-10-19: 37 calls and 0.24 million for 44 rows of web quotes and probes, 63 calls and 0.31 million for 37 rows of standards with a scanned PDF), so such a checker is budgeted at 60 to 80 calls. Each wave ends with the actuals in the pass's doc and a save (the `save` skill). A wave that would exceed its estimate by half stops and reports rather than finishing.

## 4. Handoffs are files, and sessions are interchangeable

- A worker's data goes into its own folder under the session's scratchpad (`<scratchpad>/<pass>/<worker>/`, docs/LEARNINGS.md: an agent shares the session's scratchpad), written by its own scripts: `claims.csv` (claim, layer, evidence level, URL, exact words, date read), `sources.md` (every page opened, what it gave), downloads in `downloads/` and never a script beside them. Its report (`findings.md`: the answer first, at most 2,500 words) comes back as the text of its reply, and the orchestrator saves it to the folder: the harness refuses a subagent's report file from the Write tool ("Subagents should return findings as text", the demand map's first wave, 2026-10-19), and a worker told to write the file ends with a stub and no report, which costs a second sitting to deliver it. To try at the next run, since the saved report costs the orchestrator its length a second time: the report written by the agent's own script (the Write tool's rule may not cover a script's file; to confirm) with the ten-line summary as the reply, the orchestrator reading the file selectively.
- At the wave's end the orchestrator copies the keepers into `docs/research/<pass>/<worker>/` and commits them, since a scratchpad belongs to one session and the next may run on another account (Sean has three). The briefs live in the pass's doc. "Pick up here" names the wave and what is next.
- Never two sessions on one tree at once; a build wave runs its agents in worktrees (`isolation: "worktree"`) and the orchestrator merges, each piece through the gate.

## 5. The brief

Every brief carries, in this order: the goal in one sentence; what is ruled out; the files to read, by section, and nothing else (the reading lists below); the method (docs/RESEARCH.md §1 for a figure, §8's layers for a practice, each finding with its layer and evidence level); the output files and their shape; the budget; the safety rules (docs/RESEARCH.md §4: downloads in their own folder, `python -I`, nothing personal in any request, no bot check or paywall bypassed, nothing posted, the repo read and never written); and what comes back in the reply: the report itself as text, then ten lines of summary (the answer, the three strongest findings with their evidence level, what could not be reached, the tool-call count, the file paths).

Reading lists by job, sections rather than whole docs, so an agent is not drowned (and so the docs need no splitting yet):

| Job                                 | Read                                                                                                                                                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A figure or a size table            | docs/RESEARCH.md §1 to §4; the category's catalog section (docs/UNITS-CATALOG.md); the research doc of the nearest precedent (docs/research/cooking-2.md §1 to §2)                                               |
| A practice: design, interaction, IA | docs/RESEARCH.md §8; the UX-SPEC section the practice touches; docs/PLAN.md §2's bullet on it; our own evidence in docs/research/findings-friends-1.md                                                           |
| Search and pages                    | docs/SEO.md; docs/research/seo-1.md's section on the question                                                                                                                                                    |
| A build piece                       | CLAUDE.md's non-negotiables and recipes; docs/ARCHITECTURE.md's rows for the files; the UX-SPEC section; docs/DESIGN-SYSTEM.md's pattern for the part; docs/TESTING.md's row for the spec file; the `ship` skill |

## 6. Fallbacks

- **A thin or wandering result**: re-brief narrower, continuing the same agent (SendMessage) when its context helps, a fresh one when it would anchor.
- **Two workers contradict, or a checker corrects**: the orchestrator reads that source itself; the rule or the principle decides; the disagreement is recorded, never averaged.
- **An agent cannot reach a source**: "could not reach" in the record, the claim unproven; never a guess, never a bypass.
- **A page one tool cannot get and another can**: a source that answers the harness's fetcher after refusing a script's request (a bot check served to curl) is read, nothing solved or spoofed, and the row is flagged with which tool read it; the flag stays in the record (the demand map's A18, 2026-10-19). A page both refuse is could not reach.
- **A wave runs long**: stop at the budget, keep what was written, report, and let Sean choose the next chunk.
- **A build agent fails the gate**: it fixes its own piece inside its worktree; the orchestrator merges nothing that is red.

## 7. Tools

The Agent tool for a handful of independent workers (model and effort per agent; SendMessage to continue one); the Workflow tool for a pipeline with per-item verification, when Sean has asked for orchestration in his own words; worktrees for builds. The `research` skill's steps decide a figure; this skill only arranges who does what.

## 8. The record

The pass's doc (`docs/research/<pass>.md`): the decisions numbered, the cost per wave, what the briefs got wrong; the findings log with Sean's words; a learning for each surprise; this skill amended in the same commit as the run that taught it (CLAUDE.md, "How the docs and skills evolve").

## 9. A run, step by step

What the demand map's run settled (2026-10-19), as the checklist a session follows; the sections above hold the reasons.

0. **The plan.** The pass's doc with the questions, the method, every brief, and the budget table; `docs/RESEARCH.md` amended where the method grows; shipped before any agent runs.
1. **Gather.** Workers in parallel from the doc's briefs (Opus 5.5, high; 150 calls; the report as the reply's text, the data by the worker's scripts into its own scratchpad folder; the safety rules in every brief). Save each report as `findings.md`, copy the keepers into `docs/research/<pass>/<worker>/`, write the headlines into the doc, the cost into its table, and save.
2. **Verify.** Select the load-bearing claims into one file with a `check` note per row, 60 to 80 rows split by topic; two checkers at max, 60 to 80 calls each, told never to open a worker's notes and to re-download what the worker downloaded; save and copy as in step 1; read every corrected source yourself; amend the positions; record the corrections and the caveats; the learnings; save.
3. **Decide.** The decisions numbered for Sean, each with where to see it, what changes, one recommendation, and his call; a mock as an artifact for anything he judges by eye, drawn from the product's own screenshots and tokens and kept as HTML with the pass; the spec drafted where a shape was decided; this skill amended; "Pick up here" pointing at the answers to come; save.
4. **At every piece's end**, the context gauge (§3): the estimate given, `/context` asked for, and continue, compact, or a fresh session said.
