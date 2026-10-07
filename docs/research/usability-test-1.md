# Usability test 1 — the smart input

Milestone 2 exit gate (docs/PLAN.md §13). Five people, about 20 minutes each, one at a time. The goal is to learn whether the two-box idea is understood without explanation and where the smart input surprises people. Nothing here measures speed. The behavior being tested is described in docs/UX-SPEC.md; its open questions are §15.

**Revise before running.** The table layout becomes the default (ADR 0009, docs/UX-SPEC.md §14). Once it is built, the tasks and what we watch are rewritten for it, with two boxes on the switch's other side; docs/research/findings-friends-1.md lists what the test should now learn.

## Who

Five participants, recruited from people who are not working on the project:

- at least two who think in US units and two who think in metric;
- at least two who do the session on their own phone;
- at least one who uses a screen reader, a screen magnifier, or keyboard-only navigation, if at all possible.

## Setup

Until a public preview exists, run a production build from your machine on the same Wi-Fi. The dev server is slower to start on a phone, and anything typed before the page is ready is lost (docs/UX-SPEC.md §13).

```bash
pnpm build
```

```bash
pnpm preview --host
```

The terminal prints a `Network:` address such as `http://192.168.1.20:4321`. Open it on the participant's phone or laptop. Before they start, open the Theme menu and pick Daylight, since the page otherwise follows the device's dark mode or an earlier choice. Do not demo anything first.

Record with the participant's consent: screen capture plus audio, or just notes if they prefer. Ask them to think aloud.

## Script

Opening (read aloud): "This is an early version of a unit converter. I'm testing the design, not you. Please say what you're thinking as you go. There are no wrong answers, and I can't help until the end."

Then the tasks, one at a time. Do not explain the interface between tasks. If they are stuck for a full minute, note it and move on.

| #   | Task (read aloud)                                                                       | What we are watching                                                                                                                                                                                                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "You have a recipe that calls for 250 ml of milk. How many cups is that?"               | Do they type the number and unit together, or look for a dropdown? How do they commit the unit: Enter or picking a row? Does anyone Tab or click away expecting it to commit? Do they notice nothing converts until both boxes have a committed unit? After Enter, the caret moves on to the second box: do they notice, and pick cups there? |
| 2   | "It's 72 degrees Fahrenheit outside. What is that in Celsius?"                          | Typing "f" or "72 f" vs the name; do they notice the chip; does the result read as a result?                                                                                                                                                                                                                                                  |
| 3   | "Now go the other way: what is 30 Celsius in Fahrenheit?" (same pair already on screen) | Do they use swap, retype, or type into the other box? Does the category label moving under the box they typed in tell them which side is driving?                                                                                                                                                                                             |
| 4   | "Convert 5 ounces to grams."                                                            | Two ounces appear, weight and fluid, and the weight ounce is highlighted first. Do they check which one before pressing Enter? Note whether they press Enter, pick a row, or click away (clicking away with "oz" commits neither).                                                                                                            |
| 5   | "Send this conversion to a friend." (any conversion on screen)                          | Do they look for a share button, copy the URL, or copy the number? Do they notice the copy check?                                                                                                                                                                                                                                             |
| 6   | "How far is 10 kilometers in miles? Then clear everything and start over."              | Which way do they clear: the eraser button, the chip's ×, Backspace, Escape, or undo? Does Escape stepping back one chunk at a time surprise them?                                                                                                                                                                                            |

For a keyboard-only participant, add: "Convert 3 feet to meters using only the keyboard." Watch Tab between the boxes, the arrow keys (including reaching Back), Escape, and whether they find the keyboard shortcuts map.

Closing questions (after the last task): "What did you expect to happen that didn't?" · "If you could change one thing, what?" · "Would you use this instead of what you use now? Why?"

## Observation sheet

One row per participant and task. Copy into `docs/research/findings-1.md`.

| Participant | Task | Completed (yes / with help / no) | Time (rough) | Surprises, quotes, errors |
| ----------- | ---- | -------------------------------- | ------------ | ------------------------- |

Also log:

- every no-match query and every mistyped unit; they go straight into aliases (docs/UNITS-CATALOG.md §5);
- every phrasing like "250 ml to cups" or "in cups", which the planned connective form would handle (docs/UX-SPEC.md §14);
- whether anyone finds undo, redo, clear all, the chip as something to click, or the shortcuts map without being told.

## What decides the next step

- **Proceed to milestone 3 as planned** if four of five complete tasks 1, 2, and 4 without help.
- **Revisit the commit cue** (docs/UX-SPEC.md §5) if two or more people leave a unit uncommitted because they expected Tab or clicking away to commit it. Only Enter or a pick commits, by the owner's decision, so the first fix to try is a clearer cue for an uncommitted unit, not an implicit commit.
- **Rework the ambiguity rows** if people pick the wrong ounce in task 4 more than once.
- **Strengthen the driving cue** if people cannot tell which box is driving in task 3; the next step would be visible "from" and "to" labels.
- **Tune Escape and the 700 ms typing chunks** (docs/UX-SPEC.md §9) if two or more people are surprised by what Escape takes back.

Write the findings and the decision in `docs/research/findings-1.md`, then update docs/UX-SPEC.md before changing behavior (CLAUDE.md rule 8).
