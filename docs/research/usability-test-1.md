# Usability test 1 — the smart input

**Needs rewriting before it runs:** the tasks below were written for the table with its suggestion list and for two boxes behind a switch. Since 2026-10-07 the converter is one box whose table is the unit list (ADR 0012, ADR 0013): rewrite the tasks for it, drop task 7 and its go/no-go line, and take the questions from docs/UX-SPEC.md §15.

Milestone 2 exit gate (docs/PLAN.md §13). Five people, about 20 minutes each, one at a time. The goal is to learn whether the table layout is understood without explanation, whether people find the two-box layout behind the switch, and where the smart input surprises them. Nothing here measures speed. The behavior being tested is described in docs/UX-SPEC.md; its open questions are §15.

Rewritten for the table layout on 2026-10-07 (ADR 0009). What the test should learn about it is listed in docs/research/findings-friends-1.md.

## Who

Five participants, recruited from people who are not working on the project:

- at least two who think in US units and two who think in metric;
- at least two who do the session on their own phone;
- at least one who uses a screen reader, a screen magnifier, or keyboard-only navigation, if at all possible.

## Setup

Use the live site, `https://bigsmall.work`, in a private window on the participant's phone or laptop, so no earlier theme or layout carries over: the layout is then the table, the default. Before they start, open the Theme menu and pick Daylight, since the page otherwise follows the device's dark mode. Wait for the page to finish loading, since anything typed before it is ready is lost (docs/UX-SPEC.md §13). Do not demo anything first.

Record with the participant's consent: screen capture plus audio, or just notes if they prefer. Ask them to think aloud.

## Script

Opening (read aloud): "This is an early version of a unit converter. I'm testing the design, not you. Please say what you're thinking as you go. There are no wrong answers, and I can't help until the end."

Then the tasks, one at a time. Do not explain the interface between tasks. If they are stuck for a full minute, note it and move on.

| #   | Task (read aloud)                                                                             | What we are watching                                                                                                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "You have a recipe that calls for 250 ml of milk. How many cups is that?"                     | Do they type the number and unit together, or look for a dropdown? How do they commit the unit: Enter or picking a row? Does anyone Tab or click away expecting it to commit? Once the table appears, do they find cups in it, or look for a second box? |
| 2   | "It's 72 degrees Fahrenheit outside. What is that in Celsius?"                                | Typing "f" or "72 f" vs the name; do they notice the chip; do the table's rows read as answers?                                                                                                                                                          |
| 3   | "Now go the other way: what is 30 Celsius in Fahrenheit?" (the same values already on screen) | Do they tap the Celsius row, which moves it into the box, and type 30; retype "30 c" in the box; or look for a swap? If they tap a row, does what happens match what they expected?                                                                      |
| 4   | "Convert 5 ounces to grams."                                                                  | Two ounces appear, weight and fluid, and the weight ounce is highlighted first. Do they check which one before pressing Enter? Note whether they press Enter, pick a row, or click away (clicking away with "oz" commits neither).                       |
| 5   | "Send this conversion to a friend." (any conversion on screen)                                | Do they look for a share button, copy the URL, or copy a number from the box or a row? Do they notice the copy check?                                                                                                                                    |
| 6   | "How far is 10 kilometers in miles? Then clear everything and start over."                    | Which way do they clear: the eraser button, the chip's ×, Backspace, Escape, or undo? Does Escape stepping back one chunk at a time surprise them?                                                                                                       |
| 7   | "Some people like to see just two values side by side. Is there a way to do that here?"       | Do they find the layout switch beside the theme menu, and read its icons? Afterwards ask: "Which way do you prefer, and why?"                                                                                                                            |

For a keyboard-only participant, add: "Convert 3 feet to meters using only the keyboard." Watch Tab into the table (one stop), the arrow keys between its rows and in the box's list (including reaching Back), Enter moving a row into the box, Escape, and whether they find the keyboard shortcuts map.

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
- **Rework moving a row into the box** (docs/UX-SPEC.md §1) if two or more people tap a row in task 3 and are surprised by what happens, or none find it and all retype.
- **Reconsider the default layout** (ADR 0009) if three or more prefer two boxes in task 7.
- **Tune Escape and the 700 ms typing chunks** (docs/UX-SPEC.md §9) if two or more people are surprised by what Escape takes back.

Write the findings and the decision in `docs/research/findings-1.md`, then update docs/UX-SPEC.md before changing behavior (CLAUDE.md rule 8).
